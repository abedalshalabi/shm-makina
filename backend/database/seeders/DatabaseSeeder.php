<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed permissions first
        $this->call(PermissionSeeder::class);
        
        // Seed roles
        $this->call(RoleSeeder::class);
        
        // Seed admin users
        $this->call(AdminSeeder::class);
        
        // Seed categories
        $this->call(CategorySeeder::class);
        
        // Seed brands
        $this->call(BrandSeeder::class);
        
        // Seed products
        $this->call(ProductSeeder::class);

        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
