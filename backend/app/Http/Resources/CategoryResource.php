<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class CategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => MediaUrl::publicUrl($this->image),
            'color' => $this->color,
            'is_active' => $this->is_active,
            'show_in_slider' => $this->show_in_slider,
            'sort_order' => $this->sort_order,
            'parent_id' => $this->parent_id,
            'level' => $this->level,
            'filters' => $this->relationLoaded('filterEntities') 
                ? FilterResource::collection($this->filterEntities) 
                : ($this->filters ?? []),
            'has_children' => $this->children()->count() > 0,
            'parent' => $this->whenLoaded('parent', function () {
                return $this->parent ? [
                    'id' => $this->parent->id,
                    'name' => $this->parent->name,
                    'slug' => $this->parent->slug,
                ] : null;
            }),
            'children' => $this->whenLoaded('children', function () {
                return CategoryResource::collection($this->children);
            }),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'products_count' => $this->products_count ?? 0,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
