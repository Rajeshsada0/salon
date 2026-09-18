<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $mobile
 * @property string|null $email
 * @property string|null $gender
 * @property \Illuminate\Support\Carbon|null $dob
 * @property string|null $address
 * @property string|null $notes
 * @property string|null $group
 * @property int $loyalty_points
 * @property float $wallet_balance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['name', 'mobile', 'email', 'gender', 'dob', 'address', 'notes', 'group', 'loyalty_points', 'wallet_balance', 'credit_limit', 'outstanding_balance'])]
class Customer extends Model
{
    /**
     * Get the credit payments made by this customer.
     */
    public function creditPayments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CreditPayment::class);
    }

    /**
     * Get all memberships for this customer.
     */
    public function memberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    /**
     * Get the currently active membership for this customer.
     */
    public function activeMembership(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CustomerMembership::class)
            ->where('status', 'active')
            ->where('expires_at', '>=', now()->toDateString())
            ->with('plan')
            ->latestOfMany();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'wallet_balance' => 'decimal:2',
            'loyalty_points' => 'integer',
            'credit_limit' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
        ];
    }
}
