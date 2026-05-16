<?php

namespace App\Jobs;

use App\Models\ProductImport;
use App\Services\ProductImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessProductImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600;

    public int $tries = 1;

    public function __construct(public int $productImportId)
    {
    }

    public function handle(ProductImportService $importService): void
    {
        $productImport = ProductImport::find($this->productImportId);

        if (!$productImport) {
            return;
        }

        $importService->process($productImport);
    }

    public function failed(Throwable $exception): void
    {
        $productImport = ProductImport::find($this->productImportId);

        if (!$productImport) {
            return;
        }

        $productImport->update([
            'status' => 'failed',
            'stage' => 'failed',
            'progress' => 100,
            'message' => 'فشل تنفيذ مهمة الاستيراد في الخلفية.',
            'error_message' => $exception->getMessage(),
            'completed_at' => now(),
        ]);
    }
}
