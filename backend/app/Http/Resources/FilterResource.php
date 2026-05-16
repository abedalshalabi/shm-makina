<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CategoryResource;

class FilterResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'options' => $this->options,
            'required' => $this->required,
            'show_in_frontend' => (bool) $this->show_in_frontend,
            'sort_order' => $this->sort_order,
            'pivot' => $this->whenPivotLoaded('category_filter', function () {
                return [
                    'sort_order' => $this->pivot->sort_order,
                ];
            }),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
