<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SiteSettingResource;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SiteSettingController extends Controller
{
    /**
     * Get all settings (for admin)
     */
    public function index(Request $request): JsonResponse
    {
        $group = $request->get('group', 'header');
        
        $settings = SiteSetting::where('group', $group)
            ->orderBy('key')
            ->get();

        return response()->json([
            'data' => SiteSettingResource::collection($settings),
        ]);
    }

    /**
     * Get public settings (for frontend)
     */
    public function public(Request $request): JsonResponse
    {
        $group = $request->get('group', 'header');
        
        $settings = SiteSetting::where('group', $group)
            ->get()
            ->mapWithKeys(function ($setting) {
                $value = $setting->value;
                if ($setting->type === 'json') {
                    $value = json_decode($setting->value, true);
                } elseif ($setting->type === 'boolean' || $setting->type === 'toggle') {
                    $value = ($setting->value === '1' || $setting->value === 1 || $setting->value === 'true' || $setting->value === true);
                }
                return [$setting->key => $value];
            });

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * Get single setting
     */
    public function show(string $key): JsonResponse
    {
        $setting = SiteSetting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            'data' => new SiteSettingResource($setting),
        ]);
    }

    /**
     * Update setting
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $setting = SiteSetting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'message' => 'Setting not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'value' => 'required',
            'type' => 'nullable|in:text,image,json,boolean,toggle',
            'group' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $value = $request->value;
        if ($request->type === 'json' || $setting->type === 'json') {
            if (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }

        $setting->update([
            'value' => $value,
            'type' => $request->type ?? $setting->type,
            'group' => $request->group ?? $setting->group,
            'description' => $request->description ?? $setting->description,
        ]);

        return response()->json([
            'message' => 'Setting updated successfully',
            'data' => new SiteSettingResource($setting),
        ]);
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updated = [];
        foreach ($request->settings as $settingData) {
            $setting = SiteSetting::where('key', $settingData['key'])->first();
            
            if ($setting) {
                $value = $settingData['value'] ?? null;
                
                // Handle file upload for image type settings
                if ($setting->type === 'image' && $request->hasFile("settings.{$settingData['key']}.file")) {
                    $file = $request->file("settings.{$settingData['key']}.file");
                    
                    // Validate image file
                    $fileValidator = Validator::make(
                        ['file' => $file],
                        ['file' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240']
                    );
                    
                    if ($fileValidator->fails()) {
                        continue; // Skip invalid files
                    }
                    
                    // Generate unique filename
                    $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                    
                    // Store the file
                    $path = $file->storeAs('settings', $filename, 'public');
                    
                    // Get relative path for frontend compatibility
                    $value = '/storage/' . $path;
                    
                    Log::info('Uploaded image for setting', [
                        'key' => $settingData['key'],
                        'path' => $path,
                        'url' => $value
                    ]);
                } elseif ($setting->type === 'json') {
                    // Handle JSON values
                    if (is_array($value)) {
                        $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                    }
                }
                
                // Update if value key exists in input (allows null/empty strings)
                if (array_key_exists('value', $settingData)) {
                    $setting->update(['value' => $value]);
                    $updated[] = $setting->key;
                }
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'updated' => $updated,
        ]);
    }
    
    /**
     * Upload image for setting
     */
    public function uploadImage(Request $request, string $key): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // For image uploads, we don't need to check if setting exists
        // It could be a temporary upload for array items
        $setting = SiteSetting::where('key', $key)->first();
        
        // If setting doesn't exist, create a temporary one or just upload the file
        // We'll upload the file and return the URL without saving to a setting

        $file = $request->file('image');
        
        // Generate unique filename
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        
        // Store the file
        $path = $file->storeAs('settings', $filename, 'public');
        
        // Get relative path
        $imageUrl = '/storage/' . $path;
        
        // Update setting if it exists and is an image type
        if ($setting && $setting->type === 'image') {
            $setting->update(['value' => $imageUrl]);
        }

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => [
                'key' => $setting ? $setting->key : $key,
                'value' => $imageUrl,
                'path' => $path,
            ],
        ]);
    }
    
    public function uploadImageGeneral(Request $request): JsonResponse
    {
        Log::info('uploadImageGeneral called', [
            'method' => $request->method(),
            'has_file' => $request->hasFile('image'),
        ]);
        
        $validator = Validator::make($request->all(), [
            'image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('image');
        
        // Generate unique filename
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        
        // Store the file
        $path = $file->storeAs('settings', $filename, 'public');
        
        // Get relative path
        $imageUrl = '/storage/' . $path;

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => [
                'value' => $imageUrl,
                'path' => $path,
            ],
        ]);
    }

    /**
     * Track and return total site visits
     */
    public function trackVisit(Request $request): JsonResponse
    {
        $setting = SiteSetting::firstOrCreate(
            ['key' => 'total_visits'],
            [
                'value' => '1000', // Start with a reasonable number
                'type' => 'text',
                'group' => 'analytics',
                'description' => 'إجمالي زيارات الموقع'
            ]
        );

        $count = (int)$setting->value;
        
        // Only increment if not requested otherwise
        if (!$request->has('no_increment')) {
            $count++;
            $setting->update(['value' => (string)$count]);
        }

        return response()->json([
            'count' => $count,
        ]);
    }
}
