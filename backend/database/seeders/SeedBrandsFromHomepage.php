<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Str;

class SeedBrandsFromHomepage extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Brands from homepage with their logos (base64 SVG)
        $brands = [
            [
                'name' => 'Samsung',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxNDI4NTciIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNBTVNVTkc8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'LG',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSIxNSIgZmlsbD0iI0E1MEUzNSIvPgo8dGV4dCB4PSI1MCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MRzwvdGV4dD4KPC9zdmc+Cg==',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Apple',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTUgOGMtMi41IDAtNC41IDItNC41IDQuNXMxLjUgNC41IDQgNC41YzIuNSAwIDQuNS0yIDQuNS00LjVTNTcuNSA4IDU1IDh6bS0zIDEwYy0xIDAtMiAxLTIgMnY4YzAgMSAxIDIgMiAyaDZjMSAwIDItMSAyLTJ2LThjMC0xLTEtMi0yLTJoLTZ6IiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXBwbGU8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Sony',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNPTlk8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Panasonic',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDU1QUEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBhbmFzb25pYzwvdGV4dD4KPC9zdmc+Cg==',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Philips',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDY2Q0MiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBISUxJUFM8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'Bosch',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNFNjAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJPU0NIPC90ZXh0Pgo8L3N2Zz4K',
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'name' => 'Whirlpool',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDY2OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldoaXJscG9vbDwvdGV4dD4KPC9zdmc+Cg==',
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'name' => 'Siemens',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNJRU1FTlM8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 9,
            ],
            [
                'name' => 'Electrolux',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVsZWN0cm9sdXg8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 10,
            ],
            [
                'name' => 'Haier',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDc3QkUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkhBSUVSPC90ZXh0Pgo8L3N2Zz4K',
                'is_active' => true,
                'sort_order' => 11,
            ],
            [
                'name' => 'Toshiba',
                'logo' => 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNEQzE0M0MiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRPU0hJQkE8L3RleHQ+Cjwvc3ZnPgo=',
                'is_active' => true,
                'sort_order' => 12,
            ],
        ];

        foreach ($brands as $brandData) {
            $brand = Brand::where('name', $brandData['name'])->first();
            
            if ($brand) {
                // Update existing brand with logo
                $brand->update([
                    'logo' => $brandData['logo'],
                    'is_active' => $brandData['is_active'],
                    'sort_order' => $brandData['sort_order'],
                ]);
                $this->command->info("Updated brand: {$brandData['name']}");
            } else {
                // Create new brand
                Brand::create([
                    'name' => $brandData['name'],
                    'slug' => Str::slug($brandData['name']),
                    'logo' => $brandData['logo'],
                    'is_active' => $brandData['is_active'],
                    'sort_order' => $brandData['sort_order'],
                ]);
                $this->command->info("Created brand: {$brandData['name']}");
            }
        }
        
        $this->command->info('Brands seeding completed!');
    }
}

