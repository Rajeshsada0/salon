<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_category_id', 'brand_id', 'name', 'description', 'sku', 'cost_price', 'retail_price', 'stock_quantity', 'alert_quantity', 'is_active'])]
class Product extends Model
{
    /**
     * Get the category of the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    /**
     * Get the brand of the product.
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get the inventory adjustment logs for this product.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(InventoryLog::class);
    }

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'retail_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'alert_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
