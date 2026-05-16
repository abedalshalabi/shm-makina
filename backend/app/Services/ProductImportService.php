<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Filter;
use App\Models\Product;
use App\Models\ProductImport;
use App\Support\ImageUploadOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ProductImportService
{
    /**
     * @var array<string, string>
     */
    private array $bulkImportStoredPathCache = [];

    public function process(ProductImport $productImport): void
    {
        $tempImportDir = null;
        $currentRowNumber = null;
        $currentSku = null;

        try {
            $this->bulkImportStoredPathCache = [];

            DB::beginTransaction();
            $this->updateImport($productImport, [
                'status' => 'processing',
                'stage' => 'preparing',
                'progress' => 5,
                'message' => 'جاري تجهيز ملف الاستيراد.',
                'started_at' => now(),
                'error_message' => null,
            ]);

            $fileMap = [];

            if ($productImport->images_zip_path) {
                $this->updateImport($productImport, [
                    'stage' => 'extracting_zip',
                    'progress' => 15,
                    'message' => 'جاري فك ضغط ملف الصور.',
                ]);

                ['map' => $zipFileMap, 'temp_dir' => $tempImportDir] = $this->extractBulkImportZip($productImport);
                $fileMap = array_merge($fileMap, $zipFileMap);
            }

            $this->updateImport($productImport, [
                'stage' => 'reading_file',
                'progress' => 25,
                'message' => 'جاري قراءة ملف المنتجات.',
            ]);

            $filePath = $this->resolveImportAssetPath($productImport->file_path);
            $rows = Excel::toArray(new \stdClass(), $filePath)[0] ?? [];

            if (empty($rows)) {
                throw new \RuntimeException('ملف الاستيراد فارغ.');
            }

            $headers = array_shift($rows);
            $totalRows = 0;

            foreach ($rows as $row) {
                $rowSku = trim(($row[0] ?? '') ?: '');
                if ($rowSku !== '' && !str_contains($rowSku, 'GUIDE')) {
                    $totalRows++;
                }
            }

            $this->updateImport($productImport, [
                'stage' => 'processing_rows',
                'progress' => 35,
                'message' => 'جاري معالجة صفوف المنتجات.',
                'total_rows' => $totalRows,
                'processed_rows' => 0,
                'created_count' => 0,
                'updated_count' => 0,
            ]);

            $rowCount = 0;
            $createdCount = 0;
            $updatedCount = 0;

            $normalize = function ($str) {
                $str = trim((string) $str);
                $str = preg_replace('/[أإآ]/u', 'ا', $str);
                $str = str_replace('ة', 'ه', $str);
                $str = preg_replace('/\s+/', '', $str);
                return mb_strtolower($str);
            };

            $allFilters = Filter::all();
            $filterMap = [];
            foreach ($allFilters as $filter) {
                $filterMap[$normalize($filter->name)] = $filter->name;
            }

            $brandCollection = Brand::all();
            $currentProduct = null;
            $lastSku = null;

            foreach ($rows as $rowIndex => $row) {
                $currentRowNumber = $rowIndex + 3;
                $data = [];

                foreach ($headers as $index => $header) {
                    $cleanHeader = trim((string) $header);
                    if ($cleanHeader === '') {
                        continue;
                    }
                    $data[$cleanHeader] = $row[$index] ?? null;
                }

                $sku = trim((string) ($data['sku'] ?? ''));
                $currentSku = $sku !== '' ? $sku : null;

                if (!$sku || str_contains($sku, 'GUIDE')) {
                    continue;
                }

                $rowCount++;

                if ($sku === $lastSku && $currentProduct) {
                    $this->processVariantRow($currentProduct, $data, $fileMap);

                    $parentFilters = $currentProduct->filter_values ?: [];
                    $rowFilters = $this->extractFiltersFromRow($data, $normalize, $filterMap);
                    $updated = false;

                    foreach ($rowFilters as $name => $value) {
                        if (!isset($parentFilters[$name])) {
                            $parentFilters[$name] = [trim($value)];
                            $updated = true;
                            continue;
                        }

                        $currentVals = (array) $parentFilters[$name];
                        if (!in_array(trim($value), $currentVals, true)) {
                            $currentVals[] = trim($value);
                            $parentFilters[$name] = $currentVals;
                            $updated = true;
                        }
                    }

                    if ($updated) {
                        $currentProduct->filter_values = $parentFilters;
                        $currentProduct->save();
                    }

                    $this->touchProgress($productImport, $rowCount, $createdCount, $updatedCount, $currentRowNumber, $sku, $totalRows);
                    continue;
                }

                $lastSku = $sku;
                $categoryIds = $this->resolveCategoryIds($data);
                $primaryCategoryId = !empty($categoryIds) ? $categoryIds[0] : null;
                $brandId = $this->resolveBrandId($data, $brandCollection, $normalize);
                $filterValues = $this->buildFilterValues($data, $normalize, $filterMap);

                $productData = [
                    'sku' => $sku,
                    'name' => trim((string) ($data['name'] ?? '')),
                    'slug' => trim((string) ($data['slug'] ?? Str::slug($data['name'] ?? ''))),
                    'description' => $data['description'] ?? null,
                    'short_description' => $data['short_description'] ?? null,
                    'price' => (float) ($data['price'] ?? 0),
                    'original_price' => isset($data['original_price']) ? (float) $data['original_price'] : null,
                    'cost_price' => isset($data['cost_price']) ? (float) $data['cost_price'] : null,
                    'stock_quantity' => (int) ($data['stock_quantity'] ?? 0),
                    'category_id' => $primaryCategoryId,
                    'brand_id' => $brandId,
                    'is_active' => filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'is_featured' => filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'show_description' => filter_var($data['show_description'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'show_specifications' => filter_var($data['show_specifications'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'filter_values' => $filterValues,
                    'stock_status' => !empty($data['stock_status'])
                        ? $data['stock_status']
                        : ((int) ($data['stock_quantity'] ?? 0) > 0 ? 'in_stock' : 'out_of_stock'),
                    'in_stock' => (int) ($data['stock_quantity'] ?? 0) > 0,
                ];

                $product = Product::updateOrCreate(['sku' => $sku], $productData);
                $currentProduct = $product;

                if ($product->wasRecentlyCreated) {
                    $createdCount++;
                } else {
                    $updatedCount++;
                }

                if (!empty($categoryIds)) {
                    $product->categories()->sync($categoryIds);
                }

                $this->processProductImages($product, $data, $fileMap);
                $this->handleBulkSizeGuideImages($product, $data, $fileMap);

                if (!empty($data['variant_sku']) || !empty($filterValues)) {
                    $this->processVariantRow($product, $data, $fileMap);
                }

                $this->touchProgress($productImport, $rowCount, $createdCount, $updatedCount, $currentRowNumber, $sku, $totalRows);
            }

            $summary = [
                'rows_processed' => $rowCount,
                'created' => $createdCount,
                'updated' => $updatedCount,
            ];

            $this->updateImport($productImport, [
                'status' => 'completed',
                'stage' => 'completed',
                'progress' => 100,
                'message' => 'اكتمل استيراد المنتجات بنجاح.',
                'processed_rows' => $rowCount,
                'created_count' => $createdCount,
                'updated_count' => $updatedCount,
                'row_number' => $currentRowNumber,
                'sku' => $currentSku,
                'summary' => $summary,
                'completed_at' => now(),
            ]);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Queued bulk import failed', [
                'import_uuid' => $productImport->uuid,
                'row_number' => $currentRowNumber,
                'sku' => $currentSku,
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->updateImport($productImport, [
                'status' => 'failed',
                'stage' => 'failed',
                'progress' => 100,
                'message' => 'فشل الاستيراد: ' . $e->getMessage(),
                'error_message' => $e->getMessage(),
                'row_number' => $currentRowNumber,
                'sku' => $currentSku,
                'completed_at' => now(),
            ]);

            throw $e;
        } finally {
            if ($tempImportDir) {
                File::deleteDirectory($tempImportDir);
            }
        }
    }

    private function touchProgress(
        ProductImport $productImport,
        int $rowCount,
        int $createdCount,
        int $updatedCount,
        ?int $rowNumber,
        ?string $sku,
        int $totalRows
    ): void {
        $shouldWrite = $rowCount === $totalRows || $rowCount === 1 || $rowCount % 10 === 0;

        if (!$shouldWrite) {
            return;
        }

        $progress = $totalRows > 0
            ? 35 + (int) floor(($rowCount / max($totalRows, 1)) * 60)
            : 95;

        $this->updateImport($productImport, [
            'stage' => 'processing_rows',
            'progress' => min($progress, 95),
            'message' => $totalRows > 0
                ? "جاري معالجة الصف {$rowCount} من {$totalRows}."
                : 'جاري معالجة المنتجات.',
            'processed_rows' => $rowCount,
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'row_number' => $rowNumber,
            'sku' => $sku,
        ]);
    }

    private function updateImport(ProductImport $productImport, array $attributes): void
    {
        $productImport->forceFill($attributes)->save();
        $productImport->refresh();
    }

    private function resolveCategoryIds(array $data): array
    {
        $categoryIds = [];
        $catInput = trim((string) ($data['categories'] ?? ''));

        if ($catInput === '') {
            return [];
        }

        $catNames = explode(',', $catInput);

        foreach ($catNames as $catName) {
            $catName = trim($catName);
            if ($catName === '') {
                continue;
            }

            if (is_numeric($catName)) {
                $categoryIds[] = (int) $catName;
                continue;
            }

            if (str_contains($catName, ' > ')) {
                $parts = explode(' > ', $catName);
                $childName = array_pop($parts);
                $parentName = array_pop($parts);

                $category = Category::where('name', $childName)
                    ->whereHas('parent', function ($query) use ($parentName) {
                        $query->where('name', $parentName);
                    })
                    ->first();
            } else {
                $category = Category::where('name', $catName)->first();
            }

            if ($category) {
                $categoryIds[] = $category->id;
            }
        }

        return array_values(array_unique($categoryIds));
    }

    private function resolveBrandId(array $data, $brands, callable $normalize): ?int
    {
        $brandInput = trim((string) ($data['brand_name_or_id'] ?? ''));

        if ($brandInput === '') {
            return null;
        }

        if (is_numeric($brandInput)) {
            return (int) $brandInput;
        }

        $normalizedBrand = $normalize($brandInput);
        $brand = $brands->first(fn ($item) => $normalize($item->name) === $normalizedBrand);

        return $brand?->id;
    }

    private function buildFilterValues(array $data, callable $normalize, array $filterMap): array
    {
        $filterValues = [];

        foreach ($data as $key => $value) {
            $keyString = (string) $key;
            if (!str_starts_with($keyString, 'Filter: ') || trim((string) $value) === '') {
                continue;
            }

            $rawName = str_replace('Filter: ', '', $keyString);
            $normName = $normalize($rawName);
            $officialName = $filterMap[$normName] ?? $rawName;
            $filterValues[$officialName] = [trim((string) $value)];
        }

        return $filterValues;
    }

    private function extractFiltersFromRow(array $data, callable $normalize, array $filterMap): array
    {
        $filters = [];

        foreach ($data as $key => $value) {
            $keyString = (string) $key;
            if (!str_starts_with($keyString, 'Filter: ') || trim((string) $value) === '') {
                continue;
            }

            $rawName = str_replace('Filter: ', '', $keyString);
            $normName = $normalize($rawName);
            $officialName = $filterMap[$normName] ?? $rawName;
            $filters[$officialName] = trim((string) $value);
        }

        return $filters;
    }

    private function processVariantRow(Product $product, array $data, array $fileMap = []): void
    {
        $variantValues = [];

        foreach ($data as $key => $value) {
            $keyString = (string) $key;
            if (!str_starts_with($keyString, 'Filter: ') || trim((string) $value) === '') {
                continue;
            }

            $filterName = str_replace('Filter: ', '', $keyString);
            $variantValues[$filterName] = trim((string) $value);
        }

        if (empty($variantValues) && empty($data['variant_sku'])) {
            return;
        }

        $variantImages = [];

        foreach (explode(',', (string) ($data['variant_image_urls'] ?? '')) as $url) {
            $url = trim($url);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $variantImages[] = ['image_url' => $url];
            }
        }

        foreach (explode(',', (string) ($data['variant_image_filenames'] ?? '')) as $fileName) {
            $fileName = trim($fileName);
            if ($fileName !== '' && isset($fileMap[$fileName])) {
                $path = $this->storeBulkImportFile($fileMap[$fileName], 'products/variants', 'variant');
                $variantImages[] = ['image_url' => '/storage/' . $path];
            }
        }

        $product->variants()->updateOrCreate(
            ['sku' => $data['variant_sku'] ?? ($product->sku . '-' . Str::random(5))],
            [
                'variant_values' => $variantValues,
                'price' => (isset($data['variant_price']) && trim((string) $data['variant_price']) !== '')
                    ? (float) $data['variant_price']
                    : $product->price,
                'stock_quantity' => isset($data['variant_stock']) ? (int) $data['variant_stock'] : 0,
                'images' => !empty($variantImages) ? $variantImages : null,
            ]
        );
    }

    private function processProductImages(Product $product, array $data, array $fileMap): void
    {
        $allImages = [];

        foreach (explode(',', (string) ($data['image_urls'] ?? '')) as $url) {
            $url = trim($url);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $allImages[] = [
                    'image_path' => $url,
                    'image_url' => $url,
                    'is_primary' => count($allImages) === 0,
                    'sort_order' => count($allImages),
                ];
            }
        }

        foreach (explode(',', (string) ($data['image_filenames'] ?? '')) as $fileName) {
            $fileName = trim($fileName);
            if ($fileName !== '' && isset($fileMap[$fileName])) {
                $path = $this->storeBulkImportFile($fileMap[$fileName], 'products', 'bulk');
                $allImages[] = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                    'is_primary' => count($allImages) === 0,
                    'sort_order' => count($allImages),
                ];
            }
        }

        if (!empty($allImages)) {
            $product->images = $allImages;
            if (isset($allImages[0]['image_url'])) {
                $product->cover_image = $allImages[0]['image_url'];
            }
            $product->save();
        }
    }

    private function handleBulkSizeGuideImages(Product $product, array $data, array $fileMap): void
    {
        $allGuideImages = [];

        foreach (explode(',', (string) ($data['size_guide_image_urls'] ?? '')) as $url) {
            $url = trim($url);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $allGuideImages[] = [
                    'image_path' => $url,
                    'image_url' => $url,
                ];
            }
        }

        foreach (explode(',', (string) ($data['size_guide_image_filenames'] ?? '')) as $fileName) {
            $fileName = trim($fileName);
            if ($fileName !== '' && isset($fileMap[$fileName])) {
                $path = $this->storeBulkImportFile($fileMap[$fileName], 'products/size-guides', 'bulk_sg');
                $allGuideImages[] = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                ];
            }
        }

        if (!empty($allGuideImages)) {
            $product->size_guide_images = $allGuideImages;
            $product->save();
        }
    }

    private function extractBulkImportZip(ProductImport $productImport): array
    {
        $zipPath = $this->resolveImportAssetPath($productImport->images_zip_path);
        $zip = new \ZipArchive();
        $opened = $zip->open($zipPath);

        if ($opened !== true) {
            throw new \RuntimeException('تعذر فتح ملف الصور المضغوط.');
        }

        $tempDir = storage_path('app/tmp/product-import-' . Str::uuid());
        File::ensureDirectoryExists($tempDir);

        $fileMap = [];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if (!$entryName || str_ends_with($entryName, '/')) {
                continue;
            }

            $basename = basename($entryName);
            if ($basename === '' || str_starts_with($basename, '.')) {
                continue;
            }

            $extension = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
            if (!in_array($extension, $allowedExtensions, true)) {
                continue;
            }

            $stream = $zip->getStream($entryName);
            if (!$stream) {
                Log::warning('Bulk import zip entry stream could not be opened', [
                    'import_uuid' => $productImport->uuid,
                    'zip_name' => $productImport->images_zip_name,
                    'entry_name' => $entryName,
                ]);
                continue;
            }

            $tempPath = $tempDir . DIRECTORY_SEPARATOR . Str::random(12) . '_' . $basename;
            $target = fopen($tempPath, 'wb');
            stream_copy_to_stream($stream, $target);
            fclose($stream);
            fclose($target);

            $fileMap[$basename] = [
                'source' => 'zip',
                'path' => $tempPath,
                'original_name' => $basename,
            ];
        }

        $zip->close();

        return ['map' => $fileMap, 'temp_dir' => $tempDir];
    }

    private function resolveImportAssetPath(?string $relativePath): string
    {
        $path = trim((string) $relativePath);
        if ($path === '') {
            throw new \RuntimeException('Ù…Ø³Ø§Ø± Ù…Ù„Ù Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯.');
        }

        return Storage::path(ltrim($path, '/'));
    }

    private function storeBulkImportFile(array $fileRef, string $directory, string $prefix): string
    {
        $originalName = $fileRef['original_name'] ?? 'image';
        $sourcePath = null;
        $sourceFile = null;

        if (($fileRef['source'] ?? null) === 'upload' && (($fileRef['file'] ?? null) instanceof UploadedFile)) {
            /** @var UploadedFile $sourceFile */
            $sourceFile = $fileRef['file'];
            $sourcePath = $sourceFile->getRealPath() ?: null;
        } else {
            $sourcePath = $fileRef['path'] ?? null;
        }
        if (!$sourcePath || !is_file($sourcePath)) {
            throw new \RuntimeException("ملف الصورة {$originalName} غير موجود بعد فك الضغط.");
        }

        $dedupKey = $this->buildBulkImportDedupKey($sourcePath, $directory);
        if ($dedupKey !== null && isset($this->bulkImportStoredPathCache[$dedupKey])) {
            return $this->bulkImportStoredPathCache[$dedupKey];
        }

        if ($sourceFile instanceof UploadedFile) {
            $storedPath = ImageUploadOptimizer::storeUploaded($sourceFile, $directory, $prefix);
        } else {
            $storedPath = ImageUploadOptimizer::storeFromLocalPath(
                $sourcePath,
                (string) $originalName,
                $directory,
                $prefix
            );
        }

        if ($dedupKey !== null) {
            $this->bulkImportStoredPathCache[$dedupKey] = $storedPath;
        }

        return $storedPath;
    }

    private function buildBulkImportDedupKey(string $sourcePath, string $directory): ?string
    {
        $hash = @hash_file('sha256', $sourcePath);
        if (!is_string($hash) || trim($hash) === '') {
            return null;
        }

        return trim($directory, '/') . '|' . $hash;
    }
}
