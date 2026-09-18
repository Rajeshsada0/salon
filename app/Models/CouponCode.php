<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'type', 'value', 'expires_at', 'is_active', 'max_uses', 'uses_count'])]
class CouponCode extends Model
{
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'expires_at' => 'date',
            'is_active' => 'boolean',
            'max_uses' => 'integer',
            'uses_count' => 'integer',
        ];
    }

    /**
     * Check if the coupon code is valid to use.
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount for a given subtotal.
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($this->type === 'percentage') {
            return round($subtotal * ((float) $this->value / 100), 2);
        }

        return min($subtotal, (float) $this->value);
    }
}
