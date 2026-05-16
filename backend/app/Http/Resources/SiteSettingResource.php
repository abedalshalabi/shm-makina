<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $value = $this->value;
        if ($this->type === 'json') {
            $value = json_decode($this->value, true);
        }

        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => $value,
            'type' => $this->type,
            'group' => $this->group,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
