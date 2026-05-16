<?php

namespace App\Exports;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Filter;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductImportTemplate implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'Products' => new ProductImportMainSheet(),
            'Categories' => new CategoryListSheet(),
            'Brands' => new BrandListSheet(),
            'StockStatuses' => new StockStatusSheet(),
            'Filter Mapping' => new FilterMappingSheet(),
            'ValidationLists' => new ProductImportValidationSheet(),
        ];
    }
}

class ProductImportMainSheet implements 
    \Maatwebsite\Excel\Concerns\WithHeadings, 
    \Maatwebsite\Excel\Concerns\WithTitle, 
    \Maatwebsite\Excel\Concerns\WithEvents, 
    \Maatwebsite\Excel\Concerns\ShouldAutoSize,
    \Maatwebsite\Excel\Concerns\FromCollection
{
    public function collection()
    {
        return new \Illuminate\Support\Collection([]);
    }

    public function title(): string
    {
        return 'Products Import';
    }

    public function headings(): array
    {
        $columns = [
            'sku', 'name', 'slug', 'description', 'short_description', 
            'price', 'original_price', 'cost_price', 'stock_quantity',
            'categories', 'brand_name_or_id', 'is_active', 'is_featured',
            'show_description', 'show_specifications',
            'image_urls', 'image_filenames', 
            'size_guide_image_urls', 'size_guide_image_filenames',
            'stock_status', 
            'variant_sku', 'variant_price', 'variant_stock', 'variant_image_urls', 'variant_image_filenames'
        ];

        $filters = Filter::orderBy('name')->get(['name']);
        foreach ($filters as $filter) {
            $columns[] = 'Filter: ' . $filter->name;
        }

        return [
            $columns,
            array_merge(
                array_fill(0, 9, 'Fill values below'),
                ['Pick names from list'],
                ['Pick brand from list'],
                array_fill(0, 4, 'Fill true/false'), // is_active, is_featured, show_desc, show_specs
                ['Main Image URLs (Comma separated)'],
                ['Main Image Filenames (Comma separated)'],
                ['Size Guide URLs (Comma separated)'],
                ['Size Guide Filenames (Comma separated)'],
                ['Stock Status (in_stock, out_of_stock, stock_based)'],
                ['Variant SKU (Unique)'],
                ['Variant Price (Empty = same as product)'],
                ['Variant Stock'],
                ['Variant Image URLs (Comma separated)'],
                ['Variant Image Filenames (Comma separated)'],
                $filters->map(fn($f) => "Value for variant")->toArray()
            )
        ];
    }

    public function registerEvents(): array
    {
        return [
            \Maatwebsite\Excel\Events\AfterSheet::class => function(\Maatwebsite\Excel\Events\AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Apply validations cell-by-cell. Range-level validation generation can produce
                // workbooks that Excel repairs on open with some PhpSpreadsheet versions.
                $this->applyListValidation($sheet, 'J', 3, 1000, "=ValidationLists!\$A\$2:\$A\$" . (Category::count() + 1), true, 'Pick category', 'Select one or type multiple names separated by comma.');
                $this->applyListValidation($sheet, 'K', 3, 1000, "=ValidationLists!\$B\$2:\$B\$" . (Brand::count() + 1), true, 'Pick brand');
                $this->applyListValidation($sheet, 'T', 3, 1000, "=ValidationLists!\$C\$2:\$C\$4", false, 'Pick stock status');

                // 4. Filters Columns (Z onwards)
                $filters = Filter::orderBy('name')->get();
                $startColIndex = 26; // Column Z (1-indexed)

                foreach ($filters as $index => $filter) {
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $index);
                    
                    if (!empty($filter->options) && is_array($filter->options)) {
                        $validationColLetter = Coordinate::stringFromColumnIndex($index + 4);
                        $optionsCount = count($filter->options) + 1;
                        $this->applyListValidation(
                            $sheet,
                            $colLetter,
                            3,
                            1000,
                            "=ValidationLists!\${$validationColLetter}\$2:\${$validationColLetter}\${$optionsCount}",
                            true
                        );
                    }

                    $mapColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 2);
                    $conditional = new \PhpOffice\PhpSpreadsheet\Style\Conditional();
                    $conditional->setConditionType(\PhpOffice\PhpSpreadsheet\Style\Conditional::CONDITION_EXPRESSION);
                    $formula = "SUMPRODUCT(ISNUMBER(SEARCH(\"|\" & TRIM('Filter Mapping'!\$A\$2:\$A\$200) & \"|\", \"|\" & SUBSTITUTE(SUBSTITUTE(TRIM(\$J3), \", \", \"|\"), \",\", \"|\") & \"|\")) * ('Filter Mapping'!" . $mapColLetter . "\$2:" . $mapColLetter . "\$200=1)) > 0";
                    $conditional->addCondition($formula);
                    $conditional->getStyle()->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
                    $conditional->getStyle()->getFill()->getStartColor()->setARGB('FFD9ead3');
                    $sheet->getStyle($colLetter . '3:' . $colLetter . '1000')->setConditionalStyles([$conditional]);
                }

                // Boolean dropdowns (Active/Featured/ShowDesc/ShowSpecs)
                foreach (['L', 'M', 'N', 'O'] as $col) {
                    $this->applyListValidation($sheet, $col, 3, 1000, '"true,false"', true);
                }
            },
        ];
    }

    private function applyListValidation(
        Worksheet $sheet,
        string $column,
        int $startRow,
        int $endRow,
        string $formula,
        bool $allowBlank = true,
        ?string $promptTitle = null,
        ?string $prompt = null
    ): void {
        $validation = new DataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
        $validation->setAllowBlank($allowBlank);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setShowDropDown(true);
        $validation->setFormula1($formula);

        if ($promptTitle) {
            $validation->setPromptTitle($promptTitle);
        }

        if ($prompt) {
            $validation->setPrompt($prompt);
        }

        for ($row = $startRow; $row <= $endRow; $row++) {
            $sheet->getCell($column . $row)->setDataValidation(clone $validation);
        }
    }
}

class CategoryListSheet implements 
    \Maatwebsite\Excel\Concerns\FromCollection, 
    \Maatwebsite\Excel\Concerns\WithTitle, 
    \Maatwebsite\Excel\Concerns\WithHeadings
{
    public function title(): string
    {
        return 'Categories';
    }

    public function headings(): array
    {
        return ['Valid Category Names'];
    }

    public function collection()
    {
        return Category::with('parent')->get()->map(function($cat) {
            $name = $cat->name;
            $parent = $cat->parent;
            while ($parent) {
                $name = $parent->name . ' > ' . $name;
                $parent = $parent->parent;
            }
            return ['name' => $name];
        });
    }
}

class BrandListSheet implements 
    \Maatwebsite\Excel\Concerns\FromCollection, 
    \Maatwebsite\Excel\Concerns\WithTitle, 
    \Maatwebsite\Excel\Concerns\WithHeadings
{
    public function title(): string
    {
        return 'Brands';
    }

    public function headings(): array
    {
        return ['Valid Brand Names'];
    }

    public function collection()
    {
        return Brand::orderBy('name')->get(['name']);
    }
}

class FilterMappingSheet implements 
    \Maatwebsite\Excel\Concerns\FromCollection, 
    \Maatwebsite\Excel\Concerns\WithTitle, 
    \Maatwebsite\Excel\Concerns\WithHeadings
{
    public function title(): string
    {
        return 'Filter Mapping';
    }

    public function headings(): array
    {
        $headers = ['Category Path'];
        $filters = Filter::orderBy('name')->pluck('name')->toArray();
        return array_merge($headers, $filters);
    }

    public function collection()
    {
        $allFilters = Filter::orderBy('name')->get();
        $categories = Category::with(['parent', 'filterEntities'])->get();
        
        $rows = [];
        foreach ($categories as $cat) {
            $pathName = $cat->name;
            $p = $cat->parent;
            while ($p) {
                $pathName = $p->name . ' > ' . $pathName;
                $p = $p->parent;
            }

            $catFilters = $this->getAllCategoryFilters($cat);
            $filterIds = $catFilters->pluck('id')->toArray();

            $row = [$pathName];
            foreach ($allFilters as $filter) {
                $row[] = in_array($filter->id, $filterIds) ? 1 : 0;
            }
            $rows[] = $row;
        }

        return new \Illuminate\Support\Collection($rows);
    }

    private function getAllCategoryFilters($category)
    {
        if (!$category->relationLoaded('filterEntities')) {
            $category->load('filterEntities');
        }
        $filters = $category->filterEntities;
        if ($category->parent_id) {
            $parent = Category::find($category->parent_id);
            if ($parent) {
                $filters = $filters->merge($this->getAllCategoryFilters($parent));
            }
        }
        return $filters->unique('id');
    }
}

class StockStatusSheet implements 
    \Maatwebsite\Excel\Concerns\FromCollection, 
    \Maatwebsite\Excel\Concerns\WithTitle, 
    \Maatwebsite\Excel\Concerns\WithHeadings
{
    public function title(): string
    {
        return 'StockStatuses';
    }

    public function headings(): array
    {
        return ['Valid Statuses'];
    }

    public function collection()
    {
        return collect([
            ['in_stock'],
            ['out_of_stock'],
            ['stock_based'],
        ]);
    }
}

class ProductImportValidationSheet implements
    \Maatwebsite\Excel\Concerns\FromCollection,
    \Maatwebsite\Excel\Concerns\WithTitle,
    \Maatwebsite\Excel\Concerns\WithHeadings,
    \Maatwebsite\Excel\Concerns\WithEvents
{
    public function title(): string
    {
        return 'ValidationLists';
    }

    public function headings(): array
    {
        $headers = ['Categories', 'Brands', 'Stock Statuses'];

        foreach (Filter::orderBy('name')->pluck('name') as $filterName) {
            $headers[] = $filterName;
        }

        return $headers;
    }

    public function collection()
    {
        $categories = Category::with('parent')->get()->map(function ($cat) {
            $name = $cat->name;
            $parent = $cat->parent;

            while ($parent) {
                $name = $parent->name . ' > ' . $name;
                $parent = $parent->parent;
            }

            return $name;
        })->values();

        $brands = Brand::orderBy('name')->pluck('name')->values();
        $statuses = collect(['in_stock', 'out_of_stock', 'stock_based']);
        $filters = Filter::orderBy('name')->get(['name', 'options']);

        $columns = [
            $categories,
            $brands,
            $statuses,
        ];

        foreach ($filters as $filter) {
            $options = collect($filter->options ?? [])
                ->filter(fn ($option) => is_string($option) && trim($option) !== '')
                ->values();

            $columns[] = $options;
        }

        $maxRows = collect($columns)->map(fn (Collection $column) => $column->count())->max() ?: 0;
        $rows = [];

        for ($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++) {
            $row = [];

            foreach ($columns as $column) {
                $row[] = $column->get($rowIndex, null);
            }

            $rows[] = $row;
        }

        return collect($rows);
    }

    public function registerEvents(): array
    {
        return [
            \Maatwebsite\Excel\Events\AfterSheet::class => function (\Maatwebsite\Excel\Events\AfterSheet $event) {
                $event->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
            },
        ];
    }
}
