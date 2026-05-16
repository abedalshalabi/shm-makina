<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all permissions
        $allPermissions = \App\Models\Permission::all()->pluck('id')->toArray();
        
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'Full access to all system features',
                'permissions' => $allPermissions,
                'is_active' => true,
            ],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Administrative access to most features',
                'permissions' => \App\Models\Permission::whereIn('slug', [
                    'dashboard.view',
                    'analytics.view',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'categories.delete',
                    'brands.view',
                    'brands.create',
                    'brands.edit',
                    'brands.delete',
                    'orders.view',
                    'orders.edit',
                    'users.view',
                    'users.edit',
                    'reviews.view',
                    'reviews.edit',
                    'reviews.delete',
                ])->pluck('id')->toArray(),
                'is_active' => true,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Management access to products and orders',
                'permissions' => \App\Models\Permission::whereIn('slug', [
                    'dashboard.view',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'brands.view',
                    'brands.create',
                    'brands.edit',
                    'orders.view',
                    'orders.edit',
                    'users.view',
                    'reviews.view',
                    'reviews.edit',
                ])->pluck('id')->toArray(),
                'is_active' => true,
            ],
            [
                'name' => 'Editor',
                'slug' => 'editor',
                'description' => 'Content editing access',
                'permissions' => \App\Models\Permission::whereIn('slug', [
                    'dashboard.view',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'brands.view',
                    'brands.create',
                    'brands.edit',
                    'reviews.view',
                    'reviews.edit',
                ])->pluck('id')->toArray(),
                'is_active' => true,
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to most features',
                'permissions' => \App\Models\Permission::whereIn('slug', [
                    'dashboard.view',
                    'products.view',
                    'categories.view',
                    'brands.view',
                    'orders.view',
                    'users.view',
                    'reviews.view',
                ])->pluck('id')->toArray(),
                'is_active' => true,
            ],
        ];

        foreach ($roles as $roleData) {
            $permissions = $roleData['permissions'];
            unset($roleData['permissions']);
            
            $role = \App\Models\Role::create($roleData);
            $role->permissions()->sync($permissions);
        }
    }
}
