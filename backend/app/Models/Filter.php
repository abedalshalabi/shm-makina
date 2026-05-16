<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Filter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'options',
        'required',
        'show_in_frontend',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
        'show_in_frontend' => 'boolean',
    ];

    /**
     * Categories that use this filter.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_filter')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }
}
