<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SliderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminSliderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $sliderItems = SliderItem::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $sliderItems
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'background_color' => 'nullable|string|max:255',
            'text_color' => 'nullable|string|max:255',
            'button1_text' => 'nullable|string|max:255',
            'button1_link' => 'nullable|string|max:255',
            'button1_color' => 'nullable|string|max:255',
            'button2_text' => 'nullable|string|max:255',
            'button2_link' => 'nullable|string|max:255',
            'button2_color' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('slider', $filename, 'public');
            $validated['image'] = asset('storage/' . $path);
        }

        // Convert empty string to null for background_color
        if (isset($validated['background_color']) && $validated['background_color'] === '') {
            $validated['background_color'] = null;
        }
        
        $sliderItem = SliderItem::create($validated);
        
        // Refresh the model to get updated data
        $sliderItem->refresh();

        return response()->json([
            'message' => 'Slider item created successfully',
            'data' => $sliderItem
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SliderItem $sliderItem): JsonResponse
    {
        return response()->json([
            'data' => $sliderItem
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SliderItem $sliderItem): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'background_color' => 'nullable|string|max:255',
            'text_color' => 'nullable|string|max:255',
            'button1_text' => 'nullable|string|max:255',
            'button1_link' => 'nullable|string|max:255',
            'button1_color' => 'nullable|string|max:255',
            'button2_text' => 'nullable|string|max:255',
            'button2_link' => 'nullable|string|max:255',
            'button2_color' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($sliderItem->image) {
                // Handle both full URLs and relative paths
                $oldPath = $sliderItem->image;
                if (strpos($oldPath, 'storage/') !== false) {
                    // Extract path from full URL
                    $oldPath = str_replace(asset('storage/'), '', $oldPath);
                    $oldPath = str_replace(url('storage/'), '', $oldPath);
                    // Remove leading slash if exists
                    $oldPath = ltrim($oldPath, '/');
                    Storage::disk('public')->delete($oldPath);
                } else if (strpos($oldPath, '/') === 0) {
                    // Relative path starting with /
                    Storage::disk('public')->delete(ltrim($oldPath, '/'));
                }
            }

            $file = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('slider', $filename, 'public');
            $validated['image'] = asset('storage/' . $path);
        }
        
        // Convert empty string to null for background_color
        if (isset($validated['background_color']) && $validated['background_color'] === '') {
            $validated['background_color'] = null;
        }

        $sliderItem->update($validated);
        
        // Refresh the model to get updated data
        $sliderItem->refresh();

        return response()->json([
            'message' => 'Slider item updated successfully',
            'data' => $sliderItem
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SliderItem $sliderItem): JsonResponse
    {
        // Delete image if exists
        if ($sliderItem->image && strpos($sliderItem->image, 'storage/') !== false) {
            $oldPath = str_replace(asset('storage/'), '', $sliderItem->image);
            Storage::disk('public')->delete($oldPath);
        }

        $sliderItem->delete();

        return response()->json([
            'message' => 'Slider item deleted successfully'
        ]);
    }
}
