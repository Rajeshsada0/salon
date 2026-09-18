<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'price', 'duration_months', 'discount_percentage', 'loyalty_points_bonus', 'description', 'is_active'])]
class MembershipPlan extends Model
{
    public function customerMemberships(): HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    public function activeSubscribers(): HasMany
    {
        return $this->hasMany(CustomerMembership::class)->where('status', 'active');
    }

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'loyalty_points_bonus' => 'integer',
            'duration_months' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
