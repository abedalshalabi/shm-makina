<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Brand;
use App\Models\Review;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\City;
use App\Mail\OrderPlacedMail;
use App\Http\Resources\OrderResource;
use App\Http\Resources\BrandResource;
use App\Http\Resources\ReviewResource;
use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Admin: Create order from dashboard
     */
    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => ['required', 'string', 'regex:/^05\d{8}$/'],
            'customer_city' => 'required|string|max:100',
            'customer_district' => 'required|string|max:100',
            'customer_street' => 'nullable|string|max:255',
            'customer_building' => 'nullable|string|max:100',
            'customer_additional_info' => 'nullable|string',
            'payment_method' => 'required|in:cod,credit_card,paypal,bank_transfer,online',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded',
            'order_status' => 'nullable|in:pending,processing,shipped,delivered,cancelled',
            'notes' => 'nullable|string',
            'discount_type' => 'nullable|in:fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'force_free_shipping' => 'nullable|boolean',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',

        ]);

        $city = City::where('name', $validated['customer_city'])
            ->where('is_active', true)
            ->first();

        if (!$city) {
            return response()->json([
                'message' => 'المدينة المختارة غير صالحة أو غير متاحة حالياً',
                'errors' => [
                    'customer_city' => ['يرجى اختيار مدينة صالحة لحساب الشحن'],
                ],
            ], 422);
        }

        DB::beginTransaction();

        try {
            $preparedItems = [];
            $subtotal = 0.0;

            foreach ($validated['items'] as $itemData) {
                $product = Product::find($itemData['product_id']);
                if (!$product || !$product->is_active) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "المنتج غير متاح: {$itemData['product_id']}",
                    ], 400);
                }

                $variant = null;
                $variantId = $itemData['product_variant_id'] ?? null;

                if ($variantId) {
                    $variant = ProductVariant::where('id', $variantId)
                        ->where('product_id', $product->id)
                        ->first();

                    if (!$variant) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "فاريانت غير صالح للمنتج: {$product->name}",
                        ], 400);
                    }
                } elseif ($product->variants()->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "يرجى اختيار قياس/فاريانت للمنتج: {$product->name}",
                    ], 400);
                }

                $qty = (int) $itemData['quantity'];

                $isAvailable = false;
                if ($variant) {
                    $isAvailable = $product->stock_status === 'in_stock' || $variant->stock_quantity >= $qty;
                } else {
                    if ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                        $isAvailable = true;
                    } else {
                        // For stock-based/out_of_stock states, trust actual quantity.
                        $isAvailable = $product->stock_quantity >= $qty;
                    }
                }

                if (!$isAvailable) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "عذراً، المنتج «{$product->name}» غير متوفر بالكمية المطلوبة",
                    ], 400);
                }

                $basePrice = $variant ? (float) $variant->price : (float) $product->price;
                $productDiscountPct = (float) ($product->discount_percentage ?? 0);
                $unitPrice = $productDiscountPct > 0
                    ? round($basePrice * (1 - $productDiscountPct / 100), 2)
                    : $basePrice;

                $lineTotal = $unitPrice * $qty;
                $lineDiscountAmount = max(0, $basePrice - $unitPrice) * $qty;
                $subtotal += $lineTotal;

                $preparedItems[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'quantity' => $qty,
                    'price' => $unitPrice,
                    'original_price' => $basePrice,
                    'discount_amount' => $lineDiscountAmount,
                    'total' => $lineTotal,
                    'variant_values' => $variant?->variant_values,
                ];
            }

            $discountType = $validated['discount_type'] ?? null;
            $discountValue = (float) ($validated['discount_value'] ?? 0);
            if (!$discountType) {
                $discountValue = 0;
            }
            $discountAmount = $this->calculateManualDiscountAmount($subtotal, $discountType, $discountValue);

            $shippingCost = (float) $city->shipping_cost;
            $forceFreeShipping = (bool) ($validated['force_free_shipping'] ?? false);
            if (
                $forceFreeShipping ||
                ((float) ($city->free_shipping_threshold ?? 0) > 0 && $subtotal >= (float) $city->free_shipping_threshold)
            ) {
                $shippingCost = 0.0;
            }

            $total = max(0, $subtotal - $discountAmount + $shippingCost);
            $notes = trim((string) ($validated['notes'] ?? ''));

            $order = Order::create([
                'user_id' => null,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'],
                'customer_city' => $validated['customer_city'],
                'customer_district' => $validated['customer_district'],
                'customer_street' => $validated['customer_street'] ?? null,
                'customer_building' => $validated['customer_building'] ?? null,
                'customer_additional_info' => $validated['customer_additional_info'] ?? null,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'] ?? 'pending',
                'order_status' => $validated['order_status'] ?? 'pending',
                'notes' => $notes !== '' ? $notes : null,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'discount_amount' => $discountAmount,
                'force_free_shipping' => $forceFreeShipping,
                'total' => $total,
            ]);

            foreach ($preparedItems as $item) {
                $order->items()->create([
                    'product_id' => $item['product']->id,
                    'product_variant_id' => $item['variant']?->id,
                    'product_name' => $item['product']->name,
                    'product_sku' => $item['variant'] ? $item['variant']->sku : $item['product']->sku,
                    'variant_values' => $item['variant_values'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'original_price' => $item['original_price'],
                    'discount_amount' => $item['discount_amount'],
                    'total' => $item['total'],
                ]);

                if ($item['variant']) {
                    $item['variant']->decrement('stock_quantity', $item['quantity']);
                } else {
                    if (!$item['product']->variants()->exists()) {
                        $item['product']->decrement('stock_quantity', $item['quantity']);
                    }
                }

                $item['product']->increment('sales_count', $item['quantity']);

                if ($item['product']->stock_status === 'stock_based') {
                    $item['product']->refresh();
                    $item['product']->in_stock = $item['product']->stock_quantity > 0;
                    $item['product']->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'تم إنشاء الطلب بنجاح',
                'data' => new OrderResource($order->load(['items.product'])),
                'meta' => [],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin order creation failed', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'message' => 'فشل إنشاء الطلب',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: Get all orders
     */
    public function orders(Request $request): JsonResponse
    {
        $query = QueryBuilder::for(Order::class)
            ->with(['items.product'])
            ->allowedFilters([
                'order_number',
                'customer_name',
                'customer_email',
                'order_status',
                'payment_status',
                'payment_method',
                AllowedFilter::exact('order_status'),
                AllowedFilter::exact('payment_status'),
                AllowedFilter::scope('date_range'),
                AllowedFilter::scope('amount_range'),
            ])
            ->allowedSorts(['created_at', 'total', 'order_status', 'payment_status'])
            ->defaultSort('-created_at');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_name', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('order_status', $request->status);
        }

        if ($request->has('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('from_date') && !empty($request->from_date)) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && !empty($request->to_date)) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $orders = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ]
        ]);
    }

    public function exportOrders(Request $request)
    {
        $query = QueryBuilder::for(Order::class)
            ->with(['items'])
            ->allowedFilters([
                'order_number',
                'customer_name',
                'customer_email',
                'order_status',
                'payment_status',
                'payment_method',
                AllowedFilter::exact('order_status'),
                AllowedFilter::exact('payment_status'),
                AllowedFilter::scope('date_range'),
                AllowedFilter::scope('amount_range'),
            ])
            ->allowedSorts(['created_at', 'total', 'order_status', 'payment_status'])
            ->defaultSort('-created_at');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_name', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('order_status', $request->status);
        }

        if ($request->has('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('from_date') && !empty($request->from_date)) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && !empty($request->to_date)) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\OrdersExport($query), 'sales_report_' . date('Y-m-d') . '.xlsx');
    }

    public function exportDetailedOrders(Request $request)
    {
        $query = Order::query()->with('items');

        // Apply the same filters as exportOrders
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_name', 'like', '%' . $request->search . '%')
                  ->orWhere('customer_email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('order_status', $request->status);
        }

        if ($request->has('from_date') && !empty($request->from_date)) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && !empty($request->to_date)) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $query->orderBy('created_at', 'desc');

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\DetailedOrdersExport($query), 'orders_report_detailed_' . date('Y-m-d') . '.xlsx');
    }

    /**
     * Admin: Show specific order
     */
    public function showOrder(Order $order): JsonResponse
    {
        return response()->json([
            'data' => new OrderResource($order->load(['items.product']))
        ]);
    }

    /**
     * Admin: Send customer confirmation email manually for a specific order
     */
    public function sendOrderCustomerEmail(Order $order): JsonResponse
    {
        $order->loadMissing(['items.product']);

        if (empty($order->customer_email) || !filter_var($order->customer_email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'message' => 'لا يوجد بريد إلكتروني صالح للعميل في هذا الطلب',
            ], 422);
        }

        try {
            Mail::to($order->customer_email)->send(new OrderPlacedMail($order, 'customer'));

            return response()->json([
                'message' => 'تم إرسال إيميل تأكيد الطلب للعميل بنجاح',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send customer order email from admin orders action', [
                'order_id' => $order->id,
                'customer_email' => $order->customer_email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'فشل إرسال الإيميل',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: Update order
     */
    public function updateOrder(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => 'sometimes|string|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'sometimes|string|in:pending,paid,failed,refunded',
            'payment_method' => 'sometimes|in:cod,credit_card,paypal,bank_transfer,online',
            'customer_name' => 'sometimes|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => ['sometimes', 'string', 'regex:/^05\d{8}$/'],
            'customer_city' => 'sometimes|string|max:100',
            'customer_district' => 'sometimes|string|max:100',
            'customer_street' => 'nullable|string|max:255',
            'customer_building' => 'nullable|string|max:100',
            'customer_additional_info' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required_with:items|integer|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'notes' => 'nullable|string',
            'discount_type' => 'nullable|in:fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'force_free_shipping' => 'nullable|boolean',
        ]);

        $oldStatus = $order->order_status;
        $newStatus = $validated['order_status'] ?? $oldStatus;

        $hasDeepUpdate = isset($validated['items'])
            || isset($validated['customer_name'])
            || array_key_exists('customer_email', $validated)
            || isset($validated['customer_phone'])
            || isset($validated['customer_city'])
            || isset($validated['customer_district'])
            || array_key_exists('customer_street', $validated)
            || array_key_exists('customer_building', $validated)
            || array_key_exists('customer_additional_info', $validated)
            || isset($validated['payment_method'])
            || array_key_exists('discount_type', $validated)
            || array_key_exists('discount_value', $validated)
            || array_key_exists('force_free_shipping', $validated)
            ;

        if ($hasDeepUpdate) {
            DB::beginTransaction();
            try {
                if ($oldStatus !== 'cancelled') {
                    $this->restoreOrderStock($order);
                }

                $cityName = $validated['customer_city'] ?? $order->customer_city;
                $city = City::where('name', $cityName)
                    ->where('is_active', true)
                    ->first();

                if (!$city) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Selected city is invalid or inactive',
                        'errors' => [
                            'customer_city' => ['Please select a valid city'],
                        ],
                    ], 422);
                }

                $sourceItems = isset($validated['items'])
                    ? $validated['items']
                    : $order->items->map(fn ($item) => [
                        'product_id' => $item->product_id,
                        'product_variant_id' => $item->product_variant_id,
                        'quantity' => $item->quantity,
                    ])->toArray();

                $preparedItems = [];
                $subtotal = 0.0;
                foreach ($sourceItems as $itemData) {
                    $product = Product::find($itemData['product_id']);
                    if (!$product || !$product->is_active) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Product not available: {$itemData['product_id']}",
                        ], 400);
                    }

                    $variant = null;
                    $variantId = $itemData['product_variant_id'] ?? null;
                    if ($variantId) {
                        $variant = ProductVariant::where('id', $variantId)
                            ->where('product_id', $product->id)
                            ->first();
                        if (!$variant) {
                            DB::rollBack();
                            return response()->json([
                                'message' => "Invalid variant for product: {$product->name}",
                            ], 400);
                        }
                    } elseif ($product->variants()->exists()) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Please select a variant for: {$product->name}",
                        ], 400);
                    }

                    $qty = (int) $itemData['quantity'];
                    $isAvailable = false;
                    if ($variant) {
                        $isAvailable = $product->stock_status === 'in_stock' || $variant->stock_quantity >= $qty;
                    } else {
                        if ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                            $isAvailable = true;
                        } else {
                            // For stock-based/out_of_stock states, trust actual quantity.
                            $isAvailable = $product->stock_quantity >= $qty;
                        }
                    }

                    if ($newStatus !== 'cancelled' && !$isAvailable) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Insufficient stock for product: {$product->name}",
                        ], 400);
                    }

                    $basePrice = $variant ? (float) $variant->price : (float) $product->price;
                    $productDiscountPct = (float) ($product->discount_percentage ?? 0);
                    $unitPrice = $productDiscountPct > 0
                        ? round($basePrice * (1 - $productDiscountPct / 100), 2)
                        : $basePrice;
                    $lineTotal = $unitPrice * $qty;
                    $lineDiscountAmount = max(0, $basePrice - $unitPrice) * $qty;
                    $subtotal += $lineTotal;

                    $preparedItems[] = [
                        'product' => $product,
                        'variant' => $variant,
                        'quantity' => $qty,
                        'price' => $unitPrice,
                        'original_price' => $basePrice,
                        'discount_amount' => $lineDiscountAmount,
                        'total' => $lineTotal,
                        'variant_values' => $variant?->variant_values,
                    ];
                }

                $discountType = array_key_exists('discount_type', $validated)
                    ? ($validated['discount_type'] ?: null)
                    : ($order->discount_type ?: null);
                $discountValue = array_key_exists('discount_value', $validated)
                    ? (float) ($validated['discount_value'] ?? 0)
                    : (float) ($order->discount_value ?? 0);
                if (!$discountType) {
                    $discountValue = 0;
                }
                $discountAmount = $this->calculateManualDiscountAmount($subtotal, $discountType, $discountValue);

                $shippingCost = (float) $city->shipping_cost;
                $forceFreeShipping = array_key_exists('force_free_shipping', $validated)
                    ? (bool) $validated['force_free_shipping']
                    : (bool) ($order->force_free_shipping ?? false);
                if (
                    $forceFreeShipping ||
                    ((float) ($city->free_shipping_threshold ?? 0) > 0 && $subtotal >= (float) $city->free_shipping_threshold)
                ) {
                    $shippingCost = 0.0;
                }
                $total = max(0, $subtotal - $discountAmount + $shippingCost);
                $notes = trim((string) ($validated['notes'] ?? $order->notes ?? ''));

                $order->update([
                    'customer_name' => $validated['customer_name'] ?? $order->customer_name,
                    'customer_email' => array_key_exists('customer_email', $validated) ? $validated['customer_email'] : $order->customer_email,
                    'customer_phone' => $validated['customer_phone'] ?? $order->customer_phone,
                    'customer_city' => $validated['customer_city'] ?? $order->customer_city,
                    'customer_district' => $validated['customer_district'] ?? $order->customer_district,
                    'customer_street' => array_key_exists('customer_street', $validated) ? $validated['customer_street'] : $order->customer_street,
                    'customer_building' => array_key_exists('customer_building', $validated) ? $validated['customer_building'] : $order->customer_building,
                    'customer_additional_info' => array_key_exists('customer_additional_info', $validated) ? $validated['customer_additional_info'] : $order->customer_additional_info,
                    'payment_method' => $validated['payment_method'] ?? $order->payment_method,
                    'payment_status' => $validated['payment_status'] ?? $order->payment_status,
                    'order_status' => $newStatus,
                    'notes' => $notes !== '' ? $notes : null,
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                    'discount_amount' => $discountAmount,
                    'force_free_shipping' => $forceFreeShipping,
                    'total' => $total,
                ]);

                $order->items()->delete();
                foreach ($preparedItems as $item) {
                    $order->items()->create([
                        'product_id' => $item['product']->id,
                        'product_variant_id' => $item['variant']?->id,
                        'product_name' => $item['product']->name,
                        'product_sku' => $item['variant'] ? $item['variant']->sku : $item['product']->sku,
                        'variant_values' => $item['variant_values'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'original_price' => $item['original_price'],
                        'discount_amount' => $item['discount_amount'],
                        'total' => $item['total'],
                    ]);

                    if ($newStatus !== 'cancelled') {
                        if ($item['variant']) {
                            $item['variant']->decrement('stock_quantity', $item['quantity']);
                        } else {
                            if (!$item['product']->variants()->exists()) {
                                $item['product']->decrement('stock_quantity', $item['quantity']);
                            }
                        }

                        $item['product']->increment('sales_count', $item['quantity']);
                        if ($item['product']->stock_status === 'stock_based') {
                            $item['product']->refresh();
                            $item['product']->in_stock = $item['product']->stock_quantity > 0;
                            $item['product']->save();
                        }
                    }
                }

                DB::commit();
                return response()->json([
                    'message' => 'Order updated successfully',
                    'data' => new OrderResource($order->load(['items.product']))
                ]);
            } catch (\Throwable $e) {
                DB::rollBack();
                Log::error('Error updating order deeply: ' . $e->getMessage(), [
                    'order_id' => $order->id,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
                return response()->json([
                    'message' => 'Failed to update order',
                    'error' => $e->getMessage(),
                ], 500);
            }
        }

        // If order is being cancelled and wasn't cancelled before, restore stock
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
            $this->restoreOrderStock($order);
        }

        // If order is being changed from cancelled to any other status, deduct stock
        if ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
            // Check stock availability first
            $stockCheck = $this->checkOrderStockAvailability($order);
            if (!$stockCheck['available']) {
                return response()->json([
                    'message' => $stockCheck['message']
                ], 400);
            }
            
            // Deduct stock
            $this->deductOrderStock($order);
        }

        $order->update($validated);

        return response()->json([
            'message' => 'Order updated successfully',
            'data' => new OrderResource($order->load(['items.product']))
        ]);
    }

    /**
     * Admin: Get new orders count
     */
    public function newOrdersCount(): JsonResponse
    {
        $count = Order::where('order_status', 'pending')
            ->where('created_at', '>=', now()->subDays(1))
            ->count();

        return response()->json([
            'count' => $count
        ]);
    }

    /**
     * Admin: Delete order
     */
    public function deleteOrder(Order $order): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Restore stock if order wasn't already cancelled
            if ($order->order_status !== 'cancelled') {
                $this->restoreOrderStock($order);
            }

            // Delete order items first (cascade should handle this, but being explicit)
            $order->items()->delete();
            
            // Delete the order
            $order->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore stock for all items in an order
     */
    private function calculateManualDiscountAmount(float $subtotal, ?string $discountType, float $discountValue): float
    {
        $subtotal = max(0, $subtotal);
        $discountValue = max(0, $discountValue);

        if (!$discountType || $discountValue <= 0 || $subtotal <= 0) {
            return 0.0;
        }

        if ($discountType === 'fixed') {
            return round(min($subtotal, $discountValue), 2);
        }

        if ($discountType === 'percentage') {
            $percentage = min(100, $discountValue);
            return round(min($subtotal, $subtotal * ($percentage / 100)), 2);
        }

        return 0.0;
    }

    private function normalizeVariantValues($values): array
    {
        if (is_string($values)) {
            $decoded = json_decode($values, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $values = $decoded;
            }
        }

        if (!is_array($values)) {
            return [];
        }

        $normalized = [];
        foreach ($values as $key => $value) {
            $normalizedKey = strtolower(trim((string) $key));
            $normalizedValue = strtolower(trim((string) $value));
            if ($normalizedKey === '' || $normalizedValue === '') {
                continue;
            }
            $normalized[$normalizedKey] = $normalizedValue;
        }
        ksort($normalized);

        return $normalized;
    }

    private function resolveOrderItemVariant(Product $product, ?int $variantId = null, $variantValues = null): ?ProductVariant
    {
        if ($variantId) {
            return ProductVariant::where('id', $variantId)
                ->where('product_id', $product->id)
                ->first();
        }

        if (!$product->variants()->exists()) {
            return null;
        }

        $targetValues = $this->normalizeVariantValues($variantValues);
        if (empty($targetValues)) {
            return null;
        }

        foreach ($product->variants()->get() as $variant) {
            if ($this->normalizeVariantValues($variant->variant_values) === $targetValues) {
                return $variant;
            }
        }

        return null;
    }

    private function restoreOrderStock(Order $order): void
    {
        $order->load('items.product');

        foreach ($order->items as $item) {
            // Regular Product
            if ($item->product_id) {
                $product = $item->product;
                if ($product) {
                    // Start restoration
                    $variant = $this->resolveOrderItemVariant(
                        $product,
                        $item->product_variant_id ? (int) $item->product_variant_id : null,
                        $item->variant_values
                    );

                    if ($variant) {
                        $variant->increment('stock_quantity', $item->quantity);
                    } else {
                        // Only increment product stock if it has no variants
                        if (!$product->variants()->exists()) {
                            $product->increment('stock_quantity', $item->quantity);
                        }
                    }
                    
                    $product->decrement('sales_count', $item->quantity);
                    
                    if ($product->stock_status === 'stock_based') {
                        $product->refresh();
                        $product->in_stock = $product->stock_quantity > 0;
                        $product->save();
                    }
                }
            } 
            // Bundle Offer
            elseif (str_starts_with($item->product_sku, 'BUNDLE-')) {
                $offerId = (int) str_replace('BUNDLE-', '', $item->product_sku);
                $offer = Offer::find($offerId);
                
                if ($offer) {
                    $offer->decrement('sold_count', $item->quantity);

                    if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                        foreach ($offer->bundle_items as $bundleItem) {
                            $product = Product::find($bundleItem['product_id']);
                            if ($product) {
                                $qtyToRestore = $bundleItem['quantity'] * $item->quantity;
                                $product->increment('stock_quantity', $qtyToRestore);
                                $product->decrement('sales_count', $qtyToRestore);

                                if ($product->stock_status === 'stock_based') {
                                    $product->refresh();
                                    $product->in_stock = $product->stock_quantity > 0;
                                    $product->save();
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if there's enough stock for all items in an order
     */
    private function checkOrderStockAvailability(Order $order): array
    {
        $order->load('items.product');

        foreach ($order->items as $item) {
            // Regular Product
            if ($item->product_id) {
                $product = $item->product;
                if (!$product) continue;

                $isAvailable = false;
                $variant = $this->resolveOrderItemVariant(
                    $product,
                    $item->product_variant_id ? (int) $item->product_variant_id : null,
                    $item->variant_values
                );
                if ($variant) {
                    $isAvailable = $variant && $variant->stock_quantity >= $item->quantity;
                } else {
                    if ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                        $isAvailable = true;
                    } else {
                        // For stock-based/out_of_stock states, trust actual quantity.
                        $isAvailable = $product->stock_quantity >= $item->quantity;
                    }
                }
                
                if (!$isAvailable) {
                    return [
                        'available' => false,
                        'message' => "عذراً، المنتج «{$product->name}» غير متوفر بالكمية المطلوبة"
                    ];
                }
            } 
            // Bundle Offer
            elseif (str_starts_with($item->product_sku, 'BUNDLE-')) {
                // ... (rest of bundle logic stays same as it uses Product::find)
                $offerId = (int) str_replace('BUNDLE-', '', $item->product_sku);
                $offer = Offer::find($offerId);
                
                if (!$offer) continue;

                if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                    foreach ($offer->bundle_items as $bundleItem) {
                        $product = Product::find($bundleItem['product_id']);
                        if (!$product) continue;

                        $requiredQuantity = $bundleItem['quantity'] * $item->quantity;
                        
                        $isAvailable = false;
                        if ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                            $isAvailable = true;
                        } else {
                            // For stock-based/out_of_stock states, trust actual quantity.
                            $isAvailable = $product->stock_quantity >= $requiredQuantity;
                        }

                        if (!$isAvailable) {
                            return [
                                'available' => false,
                                'message' => "Product {$product->name} in bundle is out of stock"
                            ];
                        }
                    }
                }
            }
        }

        return ['available' => true];
    }

    /**
     * Deduct stock for all items in an order
     */
    private function deductOrderStock(Order $order): void
    {
        $order->load('items.product');

        foreach ($order->items as $item) {
            // Regular Product
            if ($item->product_id) {
                $product = $item->product;
                if ($product) {
                    $variant = $this->resolveOrderItemVariant(
                        $product,
                        $item->product_variant_id ? (int) $item->product_variant_id : null,
                        $item->variant_values
                    );
                    if ($variant) {
                        $variant->decrement('stock_quantity', $item->quantity);
                    } else {
                        // Only decrement if it has no variants
                        if (!$product->variants()->exists()) {
                            $product->decrement('stock_quantity', $item->quantity);
                        }
                    }
                    
                    $product->increment('sales_count', $item->quantity);
                    
                    if ($product->stock_status === 'stock_based') {
                        $product->refresh();
                        $product->in_stock = $product->stock_quantity > 0;
                        $product->save();
                    }
                }
            } 
            // Bundle Offer
            elseif (str_starts_with($item->product_sku, 'BUNDLE-')) {
                $offerId = (int) str_replace('BUNDLE-', '', $item->product_sku);
                $offer = Offer::find($offerId);
                
                if ($offer) {
                    $offer->increment('sold_count', $item->quantity);

                    if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                        foreach ($offer->bundle_items as $bundleItem) {
                            $product = Product::find($bundleItem['product_id']);
                            if ($product) {
                                $qtyToDeduct = $bundleItem['quantity'] * $item->quantity;
                                $product->decrement('stock_quantity', $qtyToDeduct);
                                $product->increment('sales_count', $qtyToDeduct);

                                if ($product->stock_status === 'stock_based') {
                                    $product->refresh();
                                    $product->in_stock = $product->stock_quantity > 0;
                                    $product->save();
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Admin: Get all reviews
     */
    public function reviews(Request $request): JsonResponse
    {
        $query = QueryBuilder::for(Review::class)
            ->with(['product', 'user'])
            ->allowedFilters([
                'rating',
                'customer_name',
                'is_approved',
                'is_featured',
                AllowedFilter::exact('rating'),
                AllowedFilter::exact('is_approved'),
                AllowedFilter::exact('is_featured'),
                AllowedFilter::scope('date_range'),
            ])
            ->allowedSorts(['created_at', 'rating', 'is_approved'])
            ->defaultSort('-created_at');

        // Apply search filter
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('customer_name', 'like', '%' . $request->search . '%')
                  ->orWhere('comment', 'like', '%' . $request->search . '%')
                  ->orWhereHas('product', function ($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        $reviews = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => ReviewResource::collection($reviews),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]
        ]);
    }

    /**
     * Admin: Update review
     */
    public function updateReview(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            'is_approved' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
            'comment' => 'sometimes|string',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Review updated successfully',
            'data' => new ReviewResource($review->load(['product', 'user']))
        ]);
    }

    /**
     * Admin: Delete review
     */
    public function destroyReview(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully'
        ]);
    }

    /**
     * Admin: Store brand
     */
    public function storeBrand(Request $request): JsonResponse
    {
        // Convert is_active from string to boolean before validation if provided
        if ($request->has('is_active') && is_string($request->input('is_active'))) {
            $request->merge(['is_active' => filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:brands,slug',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'logo_file' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240',
            'website' => 'nullable|url',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        // Handle logo upload
        $logoPath = null;
        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $filename = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('brands', $filename, 'public');
            $logoPath = asset('storage/' . $path);
            Log::info('Logo file stored', [
                'filename' => $filename,
                'path' => $path,
                'logo_path' => $logoPath,
            ]);
        } elseif ($request->has('logo') && !empty($request->input('logo'))) {
            // Direct URL or base64 data URI provided
            $logoPath = $request->input('logo');
        }

        $brand = Brand::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'logo' => $logoPath,
            'website' => $validated['website'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ]);
        
        $brand->loadCount('products');

        return response()->json([
            'message' => 'Brand created successfully',
            'data' => new BrandResource($brand)
        ], 201);
    }

    /**
     * Admin: Update brand
     */
    public function updateBrand(Request $request, Brand $brand): JsonResponse
    {
        Log::info('Update brand request received', [
            'brand_id' => $brand->id,
            'has_file' => $request->hasFile('logo_file'),
            'has_logo' => $request->has('logo'),
            'logo_value' => $request->input('logo'),
            'all_inputs' => $request->except(['logo_file', '_method']),
        ]);

        // Convert is_active from string to boolean before validation
        if ($request->has('is_active') && is_string($request->input('is_active'))) {
            $request->merge(['is_active' => filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|unique:brands,slug,' . $brand->id,
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'logo_file' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240',
            'website' => 'nullable|url',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        // Handle logo upload
        if ($request->hasFile('logo_file')) {
            Log::info('Logo file detected', [
                'file_name' => $request->file('logo_file')->getClientOriginalName(),
                'file_size' => $request->file('logo_file')->getSize(),
                'mime_type' => $request->file('logo_file')->getMimeType(),
            ]);
            // Delete old logo if exists
            if ($brand->logo && strpos($brand->logo, 'storage/') !== false) {
                $oldPath = str_replace(asset('storage/'), '', $brand->logo);
                $oldPath = str_replace(asset(''), '', $oldPath);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            
            $file = $request->file('logo_file');
            $filename = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('brands', $filename, 'public');
            $validated['logo'] = asset('storage/' . $path);
        } elseif ($request->has('logo')) {
            // If logo is empty string, delete it
            if (empty($request->input('logo'))) {
                // Delete old logo if exists
                if ($brand->logo && strpos($brand->logo, 'storage/') !== false) {
                    $oldPath = str_replace(asset('storage/'), '', $brand->logo);
                    $oldPath = str_replace(asset(''), '', $oldPath);
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
                $validated['logo'] = null;
            } else {
                // Direct URL or base64 data URI provided
                $validated['logo'] = $request->input('logo');
            }
        }

        $brand->update($validated);
        $brand->loadCount('products');

        return response()->json([
            'message' => 'Brand updated successfully',
            'data' => new BrandResource($brand)
        ]);
    }

    /**
     * Admin: Delete brand
     */
    public function destroyBrand(Brand $brand): JsonResponse
    {
        $brand->delete();

        return response()->json([
            'message' => 'Brand deleted successfully'
        ]);
    }

    /**
     * Admin: Get all brands
     */
    public function brands(Request $request): JsonResponse
    {
        $query = QueryBuilder::for(Brand::query()->withCount('products'))
            ->allowedFilters([
                'name',
                'is_active',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'sort_order', 'created_at', 'products_count'])
            ->defaultSort('sort_order');

        // Apply search filter
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $brands = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => BrandResource::collection($brands),
            'meta' => [
                'current_page' => $brands->currentPage(),
                'last_page' => $brands->lastPage(),
                'per_page' => $brands->perPage(),
                'total' => $brands->total(),
            ]
        ]);
    }

    /**
     * Admin: Show specific brand
     */
    public function showBrand(Brand $brand): JsonResponse
    {
        $brand->loadCount('products');

        return response()->json([
            'data' => new BrandResource($brand)
        ]);
    }
}
