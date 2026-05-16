<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $validated['email'])
            ->where('is_active', true)
            ->with('roles')
            ->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login
        $admin->update(['last_login_at' => now()]);

        $token = $admin->createToken('admin_token', ['admin'])->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'avatar' => $admin->avatar,
                'roles' => $admin->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ];
                }),
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $admin = $request->user();
        
        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'avatar' => $admin->avatar,
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'roles' => $admin->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'permissions' => $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'slug' => $permission->slug,
                                'module' => $permission->module,
                            ];
                        }),
                    ];
                }),
            ]
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $admin = $request->user();

        if (!Hash::check($validated['current_password'], $admin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $admin->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }
}
