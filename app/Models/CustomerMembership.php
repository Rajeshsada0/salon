<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['customer_id', 'membership_plan_id', 'started_at', 'expires_at', 'status'])]
class CustomerMembership extends Model
{
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'expires_at' => 'date',
        ];
    }

    /**
     * Check if this membership is currently active and not expired.
     */
    public function isCurrentlyActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }
}
