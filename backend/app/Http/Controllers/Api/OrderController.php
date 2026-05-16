<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Mail\OrderPlacedMail;
use App\Models\Order;
use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Offer;
use App\Models\City;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Log\Logger;

class OrderController extends Controller
{
    private ?Logger $orderEmailLogger = null;

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        // Validate basic fields first
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => ['required', 'string', 'regex:/^05\d{8}$/'],
            'customer_city' => 'required|string|max:100',
            'customer_district' => 'required|string|max:100',
            'customer_street' => 'nullable|string|max:255',
            'customer_building' => 'nullable|string|max:100',
            'customer_additional_info' => 'nullable|string',
            'payment_method' => 'required|in:cod,credit_card,paypal',
            'notes' => 'nullable|string',
        ]);

        // Shipping must always be based on an active city selected at checkout.
        $selectedCity = City::where('name', $validated['customer_city'])
            ->where('is_active', true)
            ->first();

        if (!$selectedCity) {
            return response()->json([
                'message' => 'المدينة المختارة غير صالحة أو غير متاحة حالياً',
                'errors' => [
                    'customer_city' => ['يرجى اختيار مدينة صحيحة لحساب الشحن'],
                ],
            ], 422);
        }
        
        // Validate items separately if provided
        if ($request->has('items') && is_array($request->input('items'))) {
            $request->validate([
                'items' => 'array|min:1',
                'items.*.product_id' => 'required|integer',
                'items.*.product_variant_id' => 'nullable|integer',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
            ]);
        }

        // Get items from request or cart
        $requestItems = $request->input('items');
        $itemsFromRequest = !empty($requestItems) && is_array($requestItems) && count($requestItems) > 0;
        
        // If items are provided in request, use them; otherwise get from cart
        if (!$itemsFromRequest) {
            // Get items from cart
            $cartQuery = Cart::query()->with('product');
            
            if (Auth::check()) {
                $cartQuery->where('user_id', Auth::id());
            } else {
                $sessionId = $request->session()->getId();
                $cartQuery->where('session_id', $sessionId);
            }

            $cartItems = $cartQuery->get();

            if ($cartItems->isEmpty()) {
                return response()->json([
                    'message' => 'Cart is empty'
                ], 400);
            }

            // Convert cart items to order items format
            $items = $cartItems->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ];
            })->toArray();
        } else {
            // Use items from request
            $items = $requestItems;
        }
        
        // Ensure $items is an array
        if (!is_array($items)) {
            return response()->json([
                'message' => 'Invalid items format'
            ], 400);
        }

        // Check stock availability
        foreach ($items as $itemData) {
            $itemType = $itemData['type'] ?? 'product'; // 'product' or 'offer'

            if ($itemType === 'offer') {
                $offer = Offer::find($itemData['product_id']);
                
                if (!$offer || !$offer->isActive()) {
                    return response()->json([
                        'message' => "Offer not found or expired"
                    ], 400);
                }

                // Check stock for bundle items
                if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                    foreach ($offer->bundle_items as $bundleItem) {
                        $product = Product::find($bundleItem['product_id']);
                        if (!$product) {
                            return response()->json([
                                'message' => "Product in bundle not found"
                            ], 400);
                        }

                        $requiredQuantity = $bundleItem['quantity'] * $itemData['quantity'];
                        
                        // Check logic (same as product)
                        $isAvailable = false;
                        if ($product->stock_status === 'out_of_stock') {
                            $isAvailable = false;
                        } elseif ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                            $isAvailable = true;
                        } elseif ($product->stock_status === 'stock_based') {
                            $isAvailable = $product->stock_quantity >= $requiredQuantity;
                        }

                        if (!$isAvailable) {
                            return response()->json([
                                'message' => "Product {$product->name} in bundle is out of stock"
                            ], 400);
                        }
                    }
                }
            } else {
                // Regular Product Check
                $product = Product::find($itemData['product_id']);
                
                if (!$product) {
                    return response()->json([
                        'message' => "Product not found"
                    ], 400);
                }

                $isAvailable = false;
                if (isset($itemData['product_variant_id']) && $itemData['product_variant_id']) {
                    $variant = ProductVariant::find($itemData['product_variant_id']);
                    if (!$variant) {
                        return response()->json([
                            'message' => "Variant not found"
                        ], 400);
                    }
                    $isAvailable = ($product->stock_status === 'in_stock' || $variant->stock_quantity >= $itemData['quantity']);
                } else {
                    if ($product->stock_status === 'out_of_stock') {
                        $isAvailable = false;
                    } elseif ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
                        $isAvailable = true;
                    } elseif ($product->stock_status === 'stock_based') {
                        $isAvailable = $product->stock_quantity >= $itemData['quantity'];
                    }
                }

                if (!$isAvailable) {
                    return response()->json([
                        'message' => "عذراً، المنتج «{$product->name}» غير متوفر بالكمية المطلوبة"
                    ], 400);
                }
            }
        }

        DB::beginTransaction();

        try {
            // Calculate totals
            $subtotal = array_sum(array_map(function ($item) {
                return $item['price'] * $item['quantity'];
            }, $items));
            
            // Calculate shipping cost based on city and potential free shipping threshold
            $shippingCost = (float) $selectedCity->shipping_cost;
            if ($selectedCity->free_shipping_threshold > 0 && $subtotal >= (float) $selectedCity->free_shipping_threshold) {
                $shippingCost = 0;
            }
            
            $total = $subtotal + $shippingCost;

            // Create order
            $order = Order::create([
                'user_id' => Auth::id(),
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'],
                'customer_city' => $validated['customer_city'],
                'customer_district' => $validated['customer_district'],
                'customer_street' => $validated['customer_street'] ?? null,
                'customer_building' => $validated['customer_building'] ?? null,
                'customer_additional_info' => $validated['customer_additional_info'] ?? null,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'order_status' => 'pending',
                'payment_status' => 'pending',
            ]);

            // Create order items and update stock
            $subtotal = 0;
            $orderItems = [];

            foreach ($items as $itemData) {
                $itemType = $itemData['type'] ?? 'product';

                if ($itemType === 'offer') {
                    $offer = Offer::find($itemData['product_id']);
                    if (!$offer) continue;

                    $realPrice = $offer->discount_price > 0 ? $offer->discount_price : $offer->price;
                    $itemTotal = $realPrice * $itemData['quantity'];
                    $subtotal += $itemTotal;

                    $orderItems[] = [
                        'type' => 'offer',
                        'offer' => $offer,
                        'id' => $itemData['product_id'],
                        'quantity' => $itemData['quantity'],
                        'price' => $realPrice,
                        'total' => $itemTotal
                    ];

                    // Deduct stock for constituent products
                    if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                        foreach ($offer->bundle_items as $bundleItem) {
                            $product = Product::find($bundleItem['product_id']);
                            if ($product) {
                                $qtyToDeduct = $bundleItem['quantity'] * $itemData['quantity'];
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
                    $offer->increment('sold_count', $itemData['quantity']);

                } else {
                    // Regular Product
                    $product = Product::find($itemData['product_id']);
                    if (!$product) continue;

                    $variantId = $itemData['product_variant_id'] ?? null;
                    $variant = $variantId ? ProductVariant::find($variantId) : null;
                    
                    // Fetch REAL prices from DB
                    $basePrice = $variant ? $variant->price : $product->price;
                    $discountPct = $product->discount_percentage ?? 0;
                    
                    $realPrice = $discountPct > 0 
                        ? round($basePrice * (1 - $discountPct / 100), 2)
                        : $basePrice;

                    $itemTotal = $realPrice * $itemData['quantity'];
                    $subtotal += $itemTotal;

                    $originalPrice = $basePrice;
                    $discountAmount = max(0, $originalPrice - $realPrice) * $itemData['quantity'];

                    $orderItems[] = [
                        'type' => 'product',
                        'product' => $product,
                        'variant' => $variant,
                        'id' => $itemData['product_id'],
                        'variant_id' => $variantId,
                        'quantity' => $itemData['quantity'],
                        'price' => $realPrice,
                        'original_price' => $originalPrice,
                        'discount_amount' => $discountAmount,
                        'total' => $itemTotal,
                        'variant_values' => $itemData['variant_values'] ?? null
                    ];

                    // Update product/variant stock
                    if ($variant) {
                        $variant->decrement('stock_quantity', $itemData['quantity']);
                    } else {
                        if (!$product->variants()->exists()) {
                            $product->decrement('stock_quantity', $itemData['quantity']);
                        }
                    }
                    
                    $product->increment('sales_count', $itemData['quantity']);
                    
                    if ($product->stock_status === 'stock_based') {
                        $product->refresh();
                        $product->in_stock = $product->stock_quantity > 0;
                        $product->save();
                    }
                }
            }

            // Recalculate shipping following item collection (honoring thresholds)
            $shippingCost = (float) $selectedCity->shipping_cost;
            if ($selectedCity->free_shipping_threshold > 0 && $subtotal >= (float) $selectedCity->free_shipping_threshold) {
                $shippingCost = 0;
            }
            
            $total = $subtotal + $shippingCost;

            // Update oder records with RE-CALCULATED totals
            $order->update([
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
            ]);

            // Save order items
            foreach ($orderItems as $item) {
                if ($item['type'] === 'offer') {
                    $order->items()->create([
                        'product_id' => null,
                        'product_name' => $item['offer']->title ?? 'Bundle Offer',
                        'product_sku' => 'BUNDLE-' . $item['id'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'total' => $item['total'],
                    ]);
                } else {
                    $order->items()->create([
                        'product_id' => $item['id'],
                        'product_variant_id' => $item['variant_id'],
                        'product_name' => $item['product']->name,
                        'product_sku' => $item['variant'] ? $item['variant']->sku : $item['product']->sku,
                        'variant_values' => $item['variant_values'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'original_price' => $item['original_price'],
                        'discount_amount' => $item['discount_amount'],
                        'total' => $item['total'],
                    ]);
                }
            }

            // Clear cart if items were from cart (not from request)
            if (!$itemsFromRequest) {
                $query = Cart::query();
                if (Auth::check()) {
                    $query->where('user_id', Auth::id());
                } else {
                    $query->where('session_id', $request->session()->getId());
                }
                $query->delete();
            }

            DB::commit();

            $this->logOrderEmail('Order committed successfully', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_email' => $order->customer_email,
            ]);

            $order->load(['items.product.images', 'items.productVariant']);

            $this->logOrderEmail('Order relations loaded before email send', [
                'order_id' => $order->id,
                'items_count' => $order->items->count(),
            ]);

            $this->sendOrderEmails($order);
            $this->dispatchWhatsAppNotificationAfterResponse($order->id);

            return response()->json([
                'message' => 'Order created successfully',
                'data' => new OrderResource($order)
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            
            Log::error('Order creation failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            $this->logOrderEmail('Order creation failed before email stage', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 'error');
            
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Run slow notifications after the HTTP response is sent.
     */
    private function dispatchWhatsAppNotificationAfterResponse(int $orderId): void
    {
        app()->terminating(function () use ($orderId) {
            $order = Order::with(['items.product.images', 'items.productVariant'])->find($orderId);

            if (!$order) {
                return;
            }

            $this->sendWhatsAppNotification($order);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order): JsonResponse
    {
        // Check if user can view this order
        if (Auth::check() && $order->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => new OrderResource($order->load(['items.product', 'items.productVariant']))
        ]);
    }

    /**
     * Get user orders
     */
    public function userOrders(Request $request): JsonResponse
    {
        $orders = Order::with('items.product')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(15);

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

    /**
     * Update order status (admin only)
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => 'sometimes|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'sometimes|in:pending,paid,failed,refunded',
            'notes' => 'nullable|string',
        ]);

        // Check if order is being cancelled
        Log::info('Order Update Request', [
            'order_id' => $order->id,
            'current_status' => $order->order_status,
            'new_status' => $validated['order_status'] ?? null,
            'has_items' => $order->items->count()
        ]);

        if (isset($validated['order_status']) && $validated['order_status'] === 'cancelled' && $order->order_status !== 'cancelled') {
            Log::info('Entering cancellation logic');
            DB::beginTransaction();
            try {
                foreach ($order->items as $item) {
                     Log::info('Processing item for restoration', [
                        'item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'sku' => $item->product_sku,
                        'quantity' => $item->quantity
                    ]);

                    // Scenario 1: Regular Product (has product_id)
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            // Explicitly restore to variant if ID exists, otherwise restore to product
                            if ($item->product_variant_id) {
                                $variant = ProductVariant::find($item->product_variant_id);
                                if ($variant) {
                                    $variant->increment('stock_quantity', $item->quantity);
                                    Log::info('Restored stock to variant', ['variant_id' => $variant->id, 'qty' => $item->quantity]);
                                } else {
                                    Log::warning('Variant not found for restoration', ['variant_id' => $item->product_variant_id]);
                                }
                            } else {
                                // Only increment product stock if it was sold as a simple product (no variant)
                                if (!$product->variants()->exists()) {
                                    $product->increment('stock_quantity', $item->quantity);
                                    Log::info('Restored stock to product', ['product_id' => $product->id, 'qty' => $item->quantity]);
                                } else {
                                    Log::warning('Order item has no variant ID but product has variants. Skipping main stock restoration to avoid corruption.', ['product_id' => $product->id]);
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
                    // Scenario 2: Bundle Offer (no product_id, but SKU indicates Bundle)
                    elseif (str_starts_with($item->product_sku, 'BUNDLE-')) {
                        $offerId = (int) str_replace('BUNDLE-', '', $item->product_sku);
                        Log::info('Restoring bundle offer', ['offer_id' => $offerId]);
                        $offer = Offer::find($offerId);
                        
                        if ($offer) {
                            $offer->decrement('sold_count', $item->quantity);

                            if (!empty($offer->bundle_items) && is_array($offer->bundle_items)) {
                                foreach ($offer->bundle_items as $bundleItem) {
                                    $product = Product::find($bundleItem['product_id']);
                                    if ($product) {
                                        $qtyToRestore = $bundleItem['quantity'] * $item->quantity;
                                        Log::info('Restoring bundle product', [
                                            'product_id' => $product->id, 
                                            'qty' => $qtyToRestore
                                        ]);
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
                        } else {
                            Log::warning('Offer not found for restoration', ['offer_id' => $offerId]);
                        }
                    } else {
                         Log::warning('Unknown item type for restoration', ['item' => $item]);
                    }
                }
                
                $order->update($validated);
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to restore stock on order cancellation', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
                return response()->json([
                    'message' => 'Failed to cancel order and restore stock'
                ], 500);
            }
        } else {
            $order->update($validated);
        }

        return response()->json([
            'message' => 'Order updated successfully',
            'data' => new OrderResource($order->load('items.product'))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Restore stock before deleting, but ONLY if they haven't been restored by a cancellation
            if ($order->order_status !== 'cancelled') {
                foreach ($order->items as $item) {
                    Log::info('Restoring stock for deleted item', [
                        'order_id' => $order->id,
                        'item_id' => $item->id,
                        'sku' => $item->product_sku
                    ]);

                    // Scenario 1: Regular Product (has product_id)
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            // Explicitly restore to variant if ID exists, otherwise restore to product
                            if ($item->product_variant_id) {
                                $variant = ProductVariant::find($item->product_variant_id);
                                if ($variant) {
                                    $variant->increment('stock_quantity', $item->quantity);
                                    Log::info('Restored stock to variant (on destroy)', ['variant_id' => $variant->id, 'qty' => $item->quantity]);
                                } else {
                                    Log::warning('Variant not found for restoration (on destroy)', ['variant_id' => $item->product_variant_id]);
                                }
                            } else {
                                // Only increment product stock if it was sold as a simple product (no variant)
                                if (!$product->variants()->exists()) {
                                    $product->increment('stock_quantity', $item->quantity);
                                    Log::info('Restored stock to product (on destroy)', ['product_id' => $product->id, 'qty' => $item->quantity]);
                                } else {
                                    Log::warning('Order item has no variant ID but product has variants (on destroy). Skipping main stock restoration.', ['product_id' => $product->id]);
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
                    // Scenario 2: Bundle Offer (no product_id, but SKU indicates Bundle)
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

            $order->items()->delete();
            $order->delete();
            
            DB::commit();

            return response()->json([
                'message' => 'Order deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete order', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to delete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send WhatsApp notification for new order
     */
    private function sendWhatsAppNotification(Order $order): void
    {
        try {
            $whatsappNumber = SiteSetting::getValue('whatsapp_number');
            Log::info($whatsappNumber);
            if (!$whatsappNumber) {
                Log::info('WhatsApp number not configured, skipping notification');
                return;
            }

            // Clean phone number (remove non-numeric characters except +)
            $phoneNumber = preg_replace('/[^0-9+]/', '', $whatsappNumber);
            // Remove + if present for CallMeBot
            $phoneNumberClean = str_replace('+', '', $phoneNumber);
            
            // Build message
            $message = "🛒 طلب جديد!\n\n";
            $message .= "رقم الطلب: {$order->order_number}\n";
            $message .= "العميل: {$order->customer_name}\n";
            $message .= "الهاتف: {$order->customer_phone}\n";
            $message .= "المدينة: {$order->customer_city}\n";
            
            $message .= "\n📦 المنتجات:\n";
            foreach ($order->items as $index => $item) {
                $itemText = ($index + 1) . "- " . $item->product_name;
                if ($item->variant_values) {
                    $variantParts = [];
                    foreach ($item->variant_values as $k => $v) {
                        $variantParts[] = "{$k}: {$v}";
                    }
                    $itemText .= " (" . implode(', ', $variantParts) . ")";
                }
                $itemText .= " x{$item->quantity}\n";
                $message .= $itemText;
            }
            
            $message .= "\nالمجموع: {$order->total} شيكل\n";
            $message .= "طريقة الدفع: " . ($order->payment_method === 'cod' ? 'الدفع عند الاستلام' : $order->payment_method) . "\n";
            $message .= "\n";
            $message .= "عرض التفاصيل: " . url("/admin/orders/{$order->id}");

            // Try WhatsApp Business Cloud API first (if configured)
            $useCloudAPI = $this->sendViaWhatsAppCloudAPI($phoneNumberClean, $message, $order);
            
            if ($useCloudAPI) {
                return; // Successfully sent via Cloud API
            }

            // Fallback to CallMeBot (free service) if enabled
            $useCallMeBot = config('services.whatsapp.use_callmebot', false);
            if ($useCallMeBot) {
                $this->sendViaCallMeBot($phoneNumberClean, $message, $order);
            } else {
                // Log WhatsApp URL for manual sending
                $encodedMessage = urlencode($message);
                $whatsappUrl = "https://wa.me/{$phoneNumberClean}?text={$encodedMessage}";
                Log::info('WhatsApp notification URL (manual sending)', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'whatsapp_url' => $whatsappUrl
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send order confirmation emails to customer and configured admins.
     */
    private function sendOrderEmails(Order $order): void
    {
        $this->logOrderEmail('sendOrderEmails invoked', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'customer_email' => $order->customer_email,
        ]);

        if (filter_var($order->customer_email, FILTER_VALIDATE_EMAIL)) {
            try {
                Log::info('Sending customer order email', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                ]);
                $this->logOrderEmail('Sending customer order email', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                ]);

                Mail::to($order->customer_email)->send(new OrderPlacedMail($order, 'customer'));

                Log::info('Customer order email sent', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                ]);
                $this->logOrderEmail('Customer order email sent', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to send customer order email', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                    'error' => $e->getMessage(),
                ]);
                $this->logOrderEmail('Failed to send customer order email', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_email' => $order->customer_email,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ], 'error');
            }
        } else {
            Log::warning('Skipped customer order email due to invalid email', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_email' => $order->customer_email,
            ]);
            $this->logOrderEmail('Skipped customer order email due to invalid email', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_email' => $order->customer_email,
            ], 'warning');
        }

        try {
            $adminRecipientsRaw = SiteSetting::getValue('order_notification_admin_emails', []);
            if (!is_array($adminRecipientsRaw)) {
                $adminRecipientsRaw = [];
            }

            $adminRecipients = collect($adminRecipientsRaw)
                ->filter(fn ($email) => is_string($email) && filter_var(trim($email), FILTER_VALIDATE_EMAIL))
                ->map(fn ($email) => trim($email))
                ->unique()
                ->values()
                ->all();

            if (!empty($adminRecipients)) {
                Log::info('Sending admin order emails', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'admin_recipients' => $adminRecipients,
                ]);
                $this->logOrderEmail('Sending admin order emails', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'admin_recipients' => $adminRecipients,
                ]);

                Mail::to($adminRecipients)->send(new OrderPlacedMail($order, 'admin'));

                Log::info('Admin order emails sent', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'admin_recipients' => $adminRecipients,
                ]);
                $this->logOrderEmail('Admin order emails sent', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'admin_recipients' => $adminRecipients,
                ]);
            } else {
                Log::info('No admin order email recipients configured', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ]);
                $this->logOrderEmail('No admin order email recipients configured', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to send admin order emails', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
            $this->logOrderEmail('Failed to send admin order emails', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 'error');
        }
    }

    private function logOrderEmail(string $message, array $context = [], string $level = 'info'): void
    {
        try {
            if (!$this->orderEmailLogger) {
                $this->orderEmailLogger = Log::build([
                    'driver' => 'single',
                    'path' => storage_path('logs/order-email.log'),
                    'level' => 'debug',
                    'replace_placeholders' => true,
                ]);
            }

            $this->orderEmailLogger->{$level}($message, $context);
        } catch (\Throwable) {
            // Avoid breaking checkout if the diagnostic logger itself cannot write.
        }
    }

    /**
     * Send via WhatsApp Business Cloud API
     */
    private function sendViaWhatsAppCloudAPI(string $phoneNumber, string $message, Order $order): bool
    {
        try {
            $phoneNumberId = config('services.whatsapp.phone_number_id');
            $accessToken = config('services.whatsapp.access_token');
            
            // Check if both are configured and not empty
            if (empty($phoneNumberId) || empty(trim($phoneNumberId)) || empty($accessToken) || empty(trim($accessToken))) {
                Log::info('WhatsApp Cloud API not configured (missing phone_number_id or access_token)');
                return false; // Cloud API not configured
            }

            $url = "https://graph.facebook.com/v18.0/{$phoneNumberId}/messages";
            
            $response = Http::connectTimeout(2)
                ->timeout(5)
                ->withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $phoneNumber,
                'type' => 'text',
                'text' => [
                    'body' => $message
                ]
            ]);

            if ($response->successful()) {
                Log::info('WhatsApp message sent via Cloud API', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number
                ]);
                return true;
            } else {
                $errorResponse = $response->json();
                Log::warning('WhatsApp Cloud API failed', [
                    'order_id' => $order->id,
                    'error_code' => $errorResponse['error']['code'] ?? 'unknown',
                    'error_message' => $errorResponse['error']['message'] ?? 'unknown',
                    'response' => $response->body()
                ]);
                
                // If access token is invalid, don't try again
                if (isset($errorResponse['error']['code']) && $errorResponse['error']['code'] == 190) {
                    Log::error('WhatsApp Cloud API: Invalid Access Token. Please check your WHATSAPP_ACCESS_TOKEN in .env file');
                }
                
                return false;
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp Cloud API error', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send via CallMeBot (free WhatsApp API service)
     * Note: This requires the recipient to have CallMeBot API key set up
     * Visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/
     */
    private function sendViaCallMeBot(string $phoneNumber, string $message, Order $order): void
    {
        try {
            $apiKey = config('services.whatsapp.api_key');
            
            // Log the API key value for debugging
            Log::info('CallMeBot API Key Check', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'api_key_raw' => $apiKey,
                'api_key_type' => gettype($apiKey),
                'api_key_empty' => empty($apiKey),
                'api_key_trimmed_empty' => empty(trim($apiKey ?? '')),
                'api_key_length' => strlen($apiKey ?? '')
            ]);
            
            if (!$apiKey || empty(trim($apiKey))) {
                Log::warning('CallMeBot API key not configured', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'api_key_received' => $apiKey
                ]);
                
                // Fallback: Log WhatsApp URL for manual sending
                $encodedMessage = urlencode($message);
                $whatsappUrl = "https://wa.me/{$phoneNumber}?text={$encodedMessage}";
                Log::info('WhatsApp notification URL (CallMeBot API key missing)', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'whatsapp_url' => $whatsappUrl
                ]);
                return;
            }

            // CallMeBot API format: https://api.callmebot.com/whatsapp.php?phone=PHONE&text=MESSAGE&apikey=API_KEY
            // Note: Phone number should be in international format without + (e.g., 970592221555)
            //$callMeBotUrl = "https://api.callmebot.com/whatsapp.php?phone={$phoneNumber}&text=" . urlencode($message) . "&apikey={$apiKey}";
            $callMeBotUrl = "https://api.callmebot.com/whatsapp.php?phone={$phoneNumber}&text=" . urlencode($message) . "&apikey={$apiKey}"   ;

            Log::info('Attempting to send WhatsApp via CallMeBot', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'phone' => $phoneNumber
            ]);
            
            $response = Http::connectTimeout(2)->timeout(5)->get($callMeBotUrl);
            
            if ($response->successful()) {
                $responseBody = $response->body();
                Log::info('WhatsApp message sent via CallMeBot', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'response' => $responseBody
                ]);
            } else {
                Log::warning('CallMeBot API failed', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('CallMeBot error', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
