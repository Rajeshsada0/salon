<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'user_id', 'quantity', 'type', 'notes'])]
class InventoryLog extends Model
{
    /**
     * Get the product associated with the log entry.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user/staff member who initiated the log entry.
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
            'quantity' => 'integer',
        ];
    }
}
