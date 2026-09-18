<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['invoice_id', 'payment_method', 'amount'])]
class InvoicePayment extends Model
{
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }
}
