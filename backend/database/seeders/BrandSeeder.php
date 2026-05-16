<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Brand;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Samsung',
                'slug' => 'samsung',
                'description' => 'شركة سامسونج الكورية الرائدة في التكنولوجيا',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'LG',
                'slug' => 'lg',
                'description' => 'شركة إل جي الكورية المتخصصة في الأجهزة المنزلية',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Sony',
                'slug' => 'sony',
                'description' => 'شركة سوني اليابانية الرائدة في الإلكترونيات',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Apple',
                'slug' => 'apple',
                'description' => 'شركة آبل الأمريكية الرائدة في التكنولوجيا',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Whirlpool',
                'slug' => 'whirlpool',
                'description' => 'شركة ويرلبول الأمريكية المتخصصة في الأجهزة المنزلية',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Bosch',
                'slug' => 'bosch',
                'description' => 'شركة بوش الألمانية المتخصصة في الأجهزة المنزلية',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'Panasonic',
                'slug' => 'panasonic',
                'description' => 'شركة باناسونيك اليابانية المتخصصة في الإلكترونيات',
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'name' => 'Philips',
                'slug' => 'philips',
                'description' => 'شركة فيليبس الهولندية المتخصصة في الإلكترونيات',
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'name' => 'Siemens',
                'slug' => 'siemens',
                'description' => 'شركة سيمنز الألمانية المتخصصة في التكنولوجيا',
                'is_active' => true,
                'sort_order' => 9,
            ],
            [
                'name' => 'Toshiba',
                'slug' => 'toshiba',
                'description' => 'شركة توشيبا اليابانية المتخصصة في الإلكترونيات',
                'is_active' => true,
                'sort_order' => 10,
            ],
        ];

        foreach ($brands as $brand) {
            Brand::create($brand);
        }
    }
}
