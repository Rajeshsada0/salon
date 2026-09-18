<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'approved_by'])]
class LeaveRequest extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date'   => 'date',
        ];
    }

    /**
     * How many calendar days this leave spans.
     */
    public function getDaysCountAttribute(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }
}
