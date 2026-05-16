<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = Admin::with('roles')->get();
        
        return response()->json([
            'data' => $admins->map(function ($admin) {
                return [
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
                        ];
                    }),
                    'created_at' => $admin->created_at,
                ];
            })
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string',
            'avatar' => 'nullable|string',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $admin = Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['roles'])) {
            $admin->roles()->sync($validated['roles']);
        }

        return response()->json([
            'message' => 'Admin created successfully',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'avatar' => $admin->avatar,
                'is_active' => $admin->is_active,
                'roles' => $admin->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ];
                }),
            ]
        ], 201);
    }

    public function show(Admin $admin): JsonResponse
    {
        try {
            $admin->load('roles.permissions');
            
            return response()->json([
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'avatar' => $admin->avatar,
                    'is_active' => $admin->is_active,
                    'last_login_at' => $admin->last_login_at,
                    'roles' => $admin->roles ? $admin->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => $role->slug,
                            'permissions' => $role->permissions ? $role->permissions->map(function ($permission) {
                                return [
                                    'id' => $permission->id,
                                    'name' => $permission->name,
                                    'slug' => $permission->slug,
                                    'module' => $permission->module,
                                ];
                            }) : [],
                        ];
                    }) : [],
                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load admin',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Admin $admin): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('admins')->ignore($admin->id)],
            'password' => 'sometimes|string|min:8',
            'phone' => 'nullable|string',
            'avatar' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $updateData = collect($validated)->except(['roles'])->toArray();
        
        if (isset($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $admin->update($updateData);

        if (isset($validated['roles'])) {
            $admin->roles()->sync($validated['roles']);
        }

        return response()->json([
            'message' => 'Admin updated successfully',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'avatar' => $admin->avatar,
                'is_active' => $admin->is_active,
                'roles' => $admin->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ];
                }),
            ]
        ]);
    }

    public function destroy(Admin $admin): JsonResponse
    {
        $admin->delete();

        return response()->json([
            'message' => 'Admin deleted successfully'
        ]);
    }

    public function roles(): JsonResponse
    {
        try {
            $roles = Role::with('permissions')->get();
            
            return response()->json([
                'data' => $roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'description' => $role->description,
                        'is_active' => $role->is_active,
                        'permissions' => $role->permissions ? $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'slug' => $permission->slug,
                                'module' => $permission->module,
                            ];
                        }) : [],
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load roles',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();
        
        return response()->json([
            'data' => $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'slug' => $permission->slug,
                    'description' => $permission->description,
                    'module' => $permission->module,
                    'is_active' => $permission->is_active,
                ];
            })
        ]);
    }
}
