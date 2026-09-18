<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['customer_id', 'user_id', 'amount', 'payment_method', 'notes'])]
class CreditPayment extends Model
{
    /**
     * Get the customer associated with the payment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the staff member who collected the payment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }
}
