<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $service_category_id
 * @property string $name
 * @property string|null $description
 * @property float $price
 * @property int $duration_minutes
 * @property float $commission_percentage
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['service_category_id', 'name', 'description', 'price', 'duration_minutes', 'commission_percentage', 'is_active'])]
class Service extends Model
{
    /**
     * Get the category this service belongs to.
     */
    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    /**
     * Get the packages that include this service.
     */
    public function servicePackages(): BelongsToMany
    {
        return $this->belongsToMany(ServicePackage::class, 'package_service');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'commission_percentage' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
