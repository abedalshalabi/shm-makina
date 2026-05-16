<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'description' => 'View admin dashboard', 'module' => 'dashboard'],
            ['name' => 'View Analytics', 'slug' => 'analytics.view', 'description' => 'View analytics and reports', 'module' => 'dashboard'],
            
            // Products
            ['name' => 'View Products', 'slug' => 'products.view', 'description' => 'View products list', 'module' => 'products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'description' => 'Create new products', 'module' => 'products'],
            ['name' => 'Edit Products', 'slug' => 'products.edit', 'description' => 'Edit existing products', 'module' => 'products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'description' => 'Delete products', 'module' => 'products'],
            
            // Categories
            ['name' => 'View Categories', 'slug' => 'categories.view', 'description' => 'View categories list', 'module' => 'categories'],
            ['name' => 'Create Categories', 'slug' => 'categories.create', 'description' => 'Create new categories', 'module' => 'categories'],
            ['name' => 'Edit Categories', 'slug' => 'categories.edit', 'description' => 'Edit existing categories', 'module' => 'categories'],
            ['name' => 'Delete Categories', 'slug' => 'categories.delete', 'description' => 'Delete categories', 'module' => 'categories'],
            
            // Brands
            ['name' => 'View Brands', 'slug' => 'brands.view', 'description' => 'View brands list', 'module' => 'brands'],
            ['name' => 'Create Brands', 'slug' => 'brands.create', 'description' => 'Create new brands', 'module' => 'brands'],
            ['name' => 'Edit Brands', 'slug' => 'brands.edit', 'description' => 'Edit existing brands', 'module' => 'brands'],
            ['name' => 'Delete Brands', 'slug' => 'brands.delete', 'description' => 'Delete brands', 'module' => 'brands'],
            
            // Orders
            ['name' => 'View Orders', 'slug' => 'orders.view', 'description' => 'View orders list', 'module' => 'orders'],
            ['name' => 'Edit Orders', 'slug' => 'orders.edit', 'description' => 'Edit order status', 'module' => 'orders'],
            ['name' => 'Delete Orders', 'slug' => 'orders.delete', 'description' => 'Delete orders', 'module' => 'orders'],
            
            // Users
            ['name' => 'View Users', 'slug' => 'users.view', 'description' => 'View users list', 'module' => 'users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'description' => 'Edit user information', 'module' => 'users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'description' => 'Delete users', 'module' => 'users'],
            
            // Admin Users
            ['name' => 'View Admin Users', 'slug' => 'admin_users.view', 'description' => 'View admin users list', 'module' => 'admin_users'],
            ['name' => 'Create Admin Users', 'slug' => 'admin_users.create', 'description' => 'Create new admin users', 'module' => 'admin_users'],
            ['name' => 'Edit Admin Users', 'slug' => 'admin_users.edit', 'description' => 'Edit admin users', 'module' => 'admin_users'],
            ['name' => 'Delete Admin Users', 'slug' => 'admin_users.delete', 'description' => 'Delete admin users', 'module' => 'admin_users'],
            
            // Roles & Permissions
            ['name' => 'View Roles', 'slug' => 'roles.view', 'description' => 'View roles list', 'module' => 'roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'description' => 'Create new roles', 'module' => 'roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'description' => 'Edit existing roles', 'module' => 'roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'description' => 'Delete roles', 'module' => 'roles'],
            
            // Reviews
            ['name' => 'View Reviews', 'slug' => 'reviews.view', 'description' => 'View reviews list', 'module' => 'reviews'],
            ['name' => 'Edit Reviews', 'slug' => 'reviews.edit', 'description' => 'Edit reviews', 'module' => 'reviews'],
            ['name' => 'Delete Reviews', 'slug' => 'reviews.delete', 'description' => 'Delete reviews', 'module' => 'reviews'],
            
            // Settings
            ['name' => 'View Settings', 'slug' => 'settings.view', 'description' => 'View system settings', 'module' => 'settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'description' => 'Edit system settings', 'module' => 'settings'],
        ];

        foreach ($permissions as $permission) {
            \App\Models\Permission::create($permission);
        }
    }
}
