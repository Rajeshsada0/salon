<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $appointment_id
 * @property int|null $customer_id
 * @property string $invoice_number
 * @property float $subtotal
 * @property float $discount_amount
 * @property float $tax_amount
 * @property float $total_amount
 * @property string|null $payment_method
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['appointment_id', 'customer_id', 'coupon_code_id', 'invoice_number', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'paid_amount', 'due_amount', 'payment_method', 'status', 'notes'])]
class Invoice extends Model
{
    /**
     * Get the appointment associated with the invoice.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the customer associated with the invoice.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the items for the invoice.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Get the payments registered for this invoice.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    /**
     * Get the coupon code used on this invoice.
     */
    public function couponCode(): BelongsTo
    {
        return $this->belongsTo(CouponCode::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
        ];
    }
}
