<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class AdminCityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = QueryBuilder::for(City::class)
            ->allowedFilters([
                'name',
                'is_active',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'sort_order', 'created_at'])
            ->defaultSort('sort_order');

        // Apply search filter
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('name_en', 'like', '%' . $request->search . '%');
            });
        }

        $cities = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $cities->items(),
            'meta' => [
                'current_page' => $cities->currentPage(),
                'last_page' => $cities->lastPage(),
                'per_page' => $cities->perPage(),
                'total' => $cities->total(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'shipping_cost' => 'required|numeric|min:0',
            'delivery_time_days' => 'required|integer|min:1',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'free_shipping_threshold' => 'nullable|numeric|min:0',
        ]);

        $city = City::create($validated);

        return response()->json([
            'message' => 'City created successfully',
            'data' => $city
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(City $city): JsonResponse
    {
        return response()->json([
            'data' => $city
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, City $city): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'shipping_cost' => 'sometimes|numeric|min:0',
            'delivery_time_days' => 'sometimes|integer|min:1',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'free_shipping_threshold' => 'nullable|numeric|min:0',
        ]);

        $city->update($validated);

        return response()->json([
            'message' => 'City updated successfully',
            'data' => $city
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(City $city): JsonResponse
    {
        $city->delete();

        return response()->json([
            'message' => 'City deleted successfully'
        ]);
    }
}
