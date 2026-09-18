<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'day_of_week', 'start_time', 'end_time', 'is_off_day'])]
class StaffSchedule extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_off_day'  => 'boolean',
        ];
    }

    /**
     * Human-readable day label.
     */
    public function getDayLabelAttribute(): string
    {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$this->day_of_week] ?? '?';
    }
}
