<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'admin_id',
        'status',
        'stage',
        'progress',
        'message',
        'file_path',
        'file_name',
        'images_zip_path',
        'images_zip_name',
        'total_rows',
        'processed_rows',
        'created_count',
        'updated_count',
        'row_number',
        'sku',
        'summary',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'summary' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
