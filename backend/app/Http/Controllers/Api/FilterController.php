<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filter;
use App\Http\Resources\FilterResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FilterController extends Controller
{
    /**
     * Display a listing of global filters.
     */
    public function index(): JsonResponse
    {
        $filters = Filter::orderBy('sort_order')->orderBy('name')->get();
        return response()->json([
            'data' => FilterResource::collection($filters)
        ]);
    }

    /**
     * Store a new filter.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:select,checkbox,range,text',
            'options' => 'nullable|array',
            'required' => 'nullable|boolean',
            'show_in_frontend' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $filter = Filter::create($validated);

        return response()->json([
            'message' => 'Filter created successfully',
            'data' => new FilterResource($filter)
        ]);
    }

    /**
     * Update an existing filter.
     */
    public function update(Request $request, Filter $filter): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'nullable|in:select,checkbox,range,text',
            'options' => 'nullable|array',
            'required' => 'nullable|boolean',
            'show_in_frontend' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $filter->update($validated);

        return response()->json([
            'message' => 'Filter updated successfully',
            'data' => new FilterResource($filter)
        ]);
    }

    /**
     * Remove a filter.
     */
    public function destroy(Filter $filter): JsonResponse
    {
        $filter->delete();
        return response()->json([
            'message' => 'Filter deleted successfully'
        ]);
    }
}
