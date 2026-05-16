<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    /**
     * Get setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        if ($setting->type === 'json') {
            return json_decode($setting->value, true);
        }

        return $setting->value;
    }

    /**
     * Set setting value by key
     */
    public static function setValue(string $key, $value, string $type = 'text', string $group = 'header', string $description = null)
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value,
                'type' => $type,
                'group' => $group,
                'description' => $description,
            ]
        );

        return $setting;
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup(string $group)
    {
        return static::where('group', $group)->get()->mapWithKeys(function ($setting) {
            $value = $setting->value;
            if ($setting->type === 'json') {
                $value = json_decode($setting->value, true);
            }
            return [$setting->key => $value];
        });
    }

    /**
     * Get formatted value
     */
    public function getFormattedValueAttribute()
    {
        if ($this->type === 'json') {
            return json_decode($this->value, true);
        }
        return $this->value;
    }
}
