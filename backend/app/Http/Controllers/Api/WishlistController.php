<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class WishlistController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Wishlist::with(['product.category', 'product.brand', 'product.images']);
        $visitor = $this->resolveVisitor($request);

        if ($visitor['user_id']) {
            $query->where('user_id', $visitor['user_id']);
        } else {
            $query->where('session_id', $visitor['session_id']);
        }

        $wishlistItems = $query->get();
        $products = $wishlistItems->pluck('product')->filter();

        return response()->json([
            'data' => ProductResource::collection($products),
            'ids' => $products->pluck('id')->unique()->values()->map(function ($id) {
                return (int) $id;
            })
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, $product): JsonResponse
    {
        $productModel = Product::findOrFail($product);

        $visitor = $this->resolveVisitor($request);
        $query = Wishlist::where('product_id', $productModel->id);

        if ($visitor['user_id']) {
            $query->where('user_id', $visitor['user_id']);
        } else {
            $query->where('session_id', $visitor['session_id']);
        }

        $existing = $query->first();

        if (!$existing) {
            Wishlist::create([
                'user_id' => $visitor['user_id'],
                'session_id' => $visitor['session_id'],
                'product_id' => $productModel->id,
            ]);
        }

        return response()->json([
            'message' => 'Product added to wishlist',
            'data' => [
                'product_id' => $productModel->id,
            ]
        ], 201);
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
    public function destroy(Request $request, $product): JsonResponse
    {
        $productModel = Product::findOrFail($product);
        $visitor = $this->resolveVisitor($request);

        $query = Wishlist::where('product_id', $productModel->id);

        if ($visitor['user_id']) {
            $query->where('user_id', $visitor['user_id']);
        } else {
            $query->where('session_id', $visitor['session_id']);
        }

        $query->delete();

        return response()->json([
            'message' => 'Product removed from wishlist',
            'data' => [
                'product_id' => $productModel->id,
            ]
        ]);
    }

    protected function resolveVisitor(Request $request): array
    {
        $user = Auth::guard('sanctum')->user();

        if ($user) {
            return [
                'user_id' => $user->id,
                'session_id' => null,
            ];
        }

        $cookieName = 'wishlist_session_id';
        $sessionId = $request->cookie($cookieName);

        if (!$sessionId) {
            $sessionId = (string) Str::uuid();
            Cookie::queue(Cookie::make($cookieName, $sessionId, 60 * 24 * 30, null, null, false, false, false, 'Lax'));
        }

        return [
            'user_id' => null,
            'session_id' => $sessionId,
        ];
    }
}
