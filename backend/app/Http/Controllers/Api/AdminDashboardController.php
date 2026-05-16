<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Admin;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function dashboard(): JsonResponse
    {
        try {
            // Basic statistics
            $stats = [
                'total_products' => Product::count(),
                'active_products' => Product::where('is_active', true)->count(),
                'total_orders' => Order::count(),
                'pending_orders' => Order::where('order_status', 'pending')->count(),
                'completed_orders' => Order::where('order_status', 'delivered')->count(),
                'total_users' => User::count(),
                'total_categories' => Category::count(),
                'total_brands' => Brand::count(),
                'total_admins' => Admin::count(),
                'total_visits' => (int) (SiteSetting::where('key', 'total_visits')->value('value') ?? 0),
            ];

            // Revenue statistics
            $revenue = [
                'total_revenue' => Order::where('payment_status', 'paid')->sum('total') ?? 0,
                'monthly_revenue' => Order::where('payment_status', 'paid')
                    ->whereMonth('created_at', now()->month)
                    ->sum('total') ?? 0,
                'daily_revenue' => Order::where('payment_status', 'paid')
                    ->whereDate('created_at', now()->toDateString())
                    ->sum('total') ?? 0,
            ];

            // Recent orders
            $recent_orders = Order::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer_name' => $order->customer_name,
                        'total' => $order->total,
                        'status' => $order->order_status,
                        'payment_status' => $order->payment_status,
                        'created_at' => $order->created_at,
                    ];
                });

            // Top products - Calculate from actual order items (excluding cancelled orders)
            $top_products_query = OrderItem::select('product_id', 'product_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('AVG(price) as avg_price'))
                ->whereHas('order', function ($query) {
                    $query->where('order_status', '!=', 'cancelled');
                })
                ->groupBy('product_id', 'product_name')
                ->orderBy('total_sold', 'desc')
                ->limit(10);
            
            $top_products = $top_products_query->get()->map(function ($item) {
                // Get product details if product still exists
                $product = Product::find($item->product_id);
                return [
                    'id' => $item->product_id,
                    'name' => $item->product_name ?? 'منتج محذوف',
                    'sales_count' => (int) $item->total_sold,
                    'price' => $product ? $product->price : (float) $item->avg_price,
                ];
            });
            
            // If no products from orders, fallback to products with highest sales_count
            if ($top_products->isEmpty()) {
                $top_products = Product::where('is_active', true)
                    ->orderBy('sales_count', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function ($product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'sales_count' => $product->sales_count ?? 0,
                            'price' => $product->price,
                        ];
                    });
            }

            return response()->json([
                'stats' => $stats,
                'revenue' => $revenue,
                'recent_orders' => $recent_orders,
                'top_products' => $top_products,
                'message' => 'Dashboard data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve dashboard data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function analytics(): JsonResponse
    {
        // Sales analytics
        $sales_analytics = [
            'today' => Order::whereDate('created_at', now()->toDateString())
                ->where('payment_status', 'paid')
                ->sum('total'),
            'yesterday' => Order::whereDate('created_at', now()->subDay()->toDateString())
                ->where('payment_status', 'paid')
                ->sum('total'),
            'this_week' => Order::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->where('payment_status', 'paid')->sum('total'),
            'this_month' => Order::whereMonth('created_at', now()->month)
                ->where('payment_status', 'paid')
                ->sum('total'),
            'this_year' => Order::whereYear('created_at', now()->year)
                ->where('payment_status', 'paid')
                ->sum('total'),
        ];

        // Product analytics
        $product_analytics = [
            'total_products' => Product::count(),
            'active_products' => Product::where('is_active', true)->count(),
            'featured_products' => Product::where('is_featured', true)->count(),
            'out_of_stock' => Product::where('in_stock', false)->count(),
            'low_stock' => Product::where('stock_quantity', '<', 10)->count(),
        ];

        // User analytics
        $user_analytics = [
            'total_users' => User::count(),
            'new_users_this_month' => User::whereMonth('created_at', now()->month)->count(),
            'active_users' => User::whereHas('orders')->count(),
        ];

        return response()->json([
            'sales_analytics' => $sales_analytics,
            'product_analytics' => $product_analytics,
            'user_analytics' => $user_analytics,
        ]);
    }
}
