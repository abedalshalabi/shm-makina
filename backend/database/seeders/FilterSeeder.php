<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Filter;
use Illuminate\Database\Seeder;

class FilterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all();
        $filters_map = []; // key: name|type => id

        foreach ($categories as $cat) {
            $old_filters = $cat->filters;
            
            // In case it's still JSON string
            if (is_string($old_filters)) {
                $old_filters = json_decode($old_filters, true);
            }

            if (!$old_filters || !is_array($old_filters)) {
                continue;
            }

            $current_filter_ids = [];
            foreach ($old_filters as $f) {
                if (!isset($f['name']) || !isset($f['type'])) continue;

                $key = $f['name'] . '|' . $f['type'];

                if (!isset($filters_map[$key])) {
                    $filter = Filter::firstOrCreate([
                        'name' => $f['name'],
                        'type' => $f['type']
                    ], [
                        'options' => $f['options'] ?? [],
                        'required' => $f['required'] ?? false
                    ]);
                    $filters_map[$key] = $filter->id;
                }

                $current_filter_ids[] = $filters_map[$key];
            }

            if (!empty($current_filter_ids)) {
                $unique_ids = array_unique($current_filter_ids);
                $cat->filterEntities()->sync($unique_ids);
            }
        }
    }
}
