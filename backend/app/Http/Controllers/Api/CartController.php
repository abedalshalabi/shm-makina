<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cart::with(['product.category', 'product.brand', 'product.images', 'variant']);

        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('session_id', $request->session()->getId());
        }

        $cartItems = $query->get();
        $total = $cartItems->sum('total');

        return response()->json([
            'data' => CartResource::collection($cartItems),
            'meta' => [
                'total_items' => $cartItems->count(),
                'total_amount' => $total,
                'shipping_cost' => $total > 500 ? 0 : 25,
                'final_total' => $total + ($total > 500 ? 0 : 25),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('Cart addition attempt', [
            'payload' => $request->all(),
            'user' => Auth::guard('sanctum')->user()?->id,
            'token' => $request->bearerToken() ? 'Present' : 'Missing'
        ]);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'variant_values' => 'nullable|array',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        
        // Validation: if product has variants, a variant must be selected
        if ($product->variants()->exists() && empty($validated['product_variant_id'])) {
            return response()->json([
                'message' => 'يرجى اختيار خيارات المنتج أولاً'
            ], 400);
        }

        $variant = null;
        if (!empty($validated['product_variant_id'])) {
            $variant = \App\Models\ProductVariant::where('product_id', $product->id)
                ->where('id', $validated['product_variant_id'])
                ->firstOrFail();
        }

        // Check stock availability based on stock_status
        $isAvailable = false;
        if ($product->stock_status === 'out_of_stock') {
            $isAvailable = false;
        } elseif ($product->stock_status === 'in_stock' || $product->stock_status === 'on_backorder') {
            $isAvailable = true;
        } elseif ($product->stock_status === 'stock_based') {
            if ($variant) {
                $isAvailable = $variant->stock_quantity >= $validated['quantity'];
            } else {
                $isAvailable = $product->stock_quantity >= $validated['quantity'];
            }
        }

        if (!$isAvailable) {
            return response()->json([
                'message' => 'المنتج غير متوفر بالكمية المطلوبة'
            ], 400);
        }

        // Find existing item with same product AND same variant
        $query = Cart::where('product_id', $validated['product_id'])
            ->where('product_variant_id', $validated['product_variant_id'] ?? null);

        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('session_id', $request->session()->getId());
        }

        $existingItem = $query->first();
        $unitPrice = $variant ? $variant->price : $product->price;

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $validated['quantity'];
            
            if ($product->stock_status === 'stock_based') {
                $stockQty = $variant ? $variant->stock_quantity : $product->stock_quantity;
                if ($newQuantity > $stockQty) {
                    return response()->json([
                        'message' => 'الكمية الإجمالية في السلة تتجاوز المخزون المتوفر'
                    ], 400);
                }
            }

            $existingItem->update([
                'quantity' => $newQuantity,
                'price' => $unitPrice,
            ]);
            $cartItem = $existingItem;
        } else {
            $cartItem = Cart::create([
                'user_id' => $user ? $user->id : null,
                'session_id' => $user ? null : $request->session()->getId(),
                'product_id' => $validated['product_id'],
                'product_variant_id' => $validated['product_variant_id'] ?? null,
                'variant_values' => $validated['variant_values'] ?? null,
                'quantity' => $validated['quantity'],
                'price' => $unitPrice,
            ]);
        }

        return response()->json([
            'message' => 'تمت إضافة المنتج للسلة بنجاح',
            'data' => new CartResource($cartItem->load(['product.category', 'product.brand', 'product.images', 'variant']))
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cart $cart): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::guard('sanctum')->user();
        if ($user) {
            if ($cart->user_id !== $user->id) abort(403);
        } else {
            if ($cart->session_id !== $request->session()->getId()) abort(403);
        }

        $product = $cart->product;
        $variant = $cart->variant;

        if ($product->stock_status === 'stock_based') {
            $stockQty = $variant ? $variant->stock_quantity : $product->stock_quantity;
            if ($validated['quantity'] > $stockQty) {
                return response()->json([
                    'message' => 'الكمية تتجاوز المخزون المتوفر'
                ], 400);
            }
        }

        $cart->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'message' => 'تم تحديث الكمية بنجاح',
            'data' => new CartResource($cart->load(['product.category', 'product.brand', 'product.images', 'variant']))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Cart $cart): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            if ($cart->user_id !== $user->id) abort(403);
        } else {
            if ($cart->session_id !== $request->session()->getId()) abort(403);
        }

        $cart->delete();

        return response()->json([
            'message' => 'تم حذف المنتج من السلة بنجاح'
        ]);
    }

    /**
     * Remove all items from cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            Cart::where('user_id', $user->id)->delete();
        } else {
            Cart::where('session_id', $request->session()->getId())->delete();
        }

        return response()->json([
            'message' => 'تم إفراغ السلة بنجاح'
        ]);
    }

    /**
     * Get cart summary.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $count = Cart::where('user_id', $user->id)->count();
            $total = Cart::get()->where('user_id', $user->id)->sum('total');
        } else {
            $count = Cart::where('session_id', $request->session()->getId())->count();
            $total = Cart::get()->where('session_id', $request->session()->getId())->sum('total');
        }

        return response()->json([
            'data' => [
                'count' => $count,
                'total' => $total,
            ]
        ]);
    }
}
