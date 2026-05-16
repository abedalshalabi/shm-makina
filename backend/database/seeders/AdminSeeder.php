<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        $superAdmin = \App\Models\Admin::create([
            'name' => 'Super Admin',
            'email' => 'admin@abozaina.com',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'phone' => '+970591234567',
            'is_active' => true,
        ]);

        // Assign Super Admin role
        $superAdminRole = \App\Models\Role::where('slug', 'super_admin')->first();
        if ($superAdminRole) {
            $superAdmin->roles()->attach($superAdminRole->id);
        }

        // Create Admin
        $admin = \App\Models\Admin::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'phone' => '+970591234568',
            'is_active' => true,
        ]);

        // Assign Admin role
        $adminRole = \App\Models\Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $admin->roles()->attach($adminRole->id);
        }

        // Create Manager
        $manager = \App\Models\Admin::create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'phone' => '+970591234569',
            'is_active' => true,
        ]);

        // Assign Manager role
        $managerRole = \App\Models\Role::where('slug', 'manager')->first();
        if ($managerRole) {
            $manager->roles()->attach($managerRole->id);
        }
    }
}
