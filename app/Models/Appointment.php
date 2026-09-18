<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $customer_id
 * @property int $staff_id
 * @property \Illuminate\Support\Carbon $date
 * @property string $start_time
 * @property string $end_time
 * @property string $status
 * @property float $total_amount
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['customer_id', 'staff_id', 'date', 'start_time', 'end_time', 'status', 'total_amount', 'notes'])]
class Appointment extends Model
{
    /**
     * Get the customer for the appointment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the staff member for the appointment.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get the services included in the appointment.
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'appointment_service')
                    ->withPivot('price');
    }

    /**
     * Get the invoice associated with the appointment.
     */
    public function invoice(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }
}
