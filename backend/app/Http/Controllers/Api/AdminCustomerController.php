<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AdminCustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount(['orders', 'cartItems', 'wishlistItems']);
        
        // Search by name, email, or phone
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        
        // Sort
        $sort = $request->get('sort', 'created_at');
        $order = $request->get('order', 'desc');
        $query->orderBy($sort, $order);
        
        $customers = $query->paginate($request->get('per_page', 20));
        
        return response()->json([
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ]
        ]);
    }

    /**
     * Display the specified customer details, including orders and abandoned cart.
     */
    public function show(User $user): JsonResponse
    {
        // Load relationships
        $user->load([
            'orders' => function($q) {
                $q->latest()->limit(50);
            },
            'orders.items.product',
            'cartItems.product',
            'cartItems.variant',
            'wishlistItems.product.brand',
            'wishlistItems.product.variants',
        ]);

        // Compute summary statistics
        $stats = [
            'total_orders'     => $user->orders->count(),
            'total_spent'      => (float) $user->orders->where('payment_status', 'paid')->sum('total'),
            'cart_items_count' => $user->cartItems->count(),
            'wishlist_items_count' => $user->wishlistItems->count(),
            'cart_total'       => (float) $user->cartItems->sum(function ($item) {
                $price = $item->variant
                    ? $item->variant->price
                    : ($item->product ? $item->product->price : 0);
                return $price * $item->quantity;
            }),
        ];

        return response()->json([
            'data' => array_merge($user->toArray(), ['stats' => $stats]),
        ]);
    }

    /**
     * Reset a customer's password from the admin dashboard.
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Customer password reset successfully.',
        ]);
    }
}
