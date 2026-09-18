<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'name',
        'plan',
        'is_active',
        'trial_ends_at',
        'storage_limit_mb',
        'data',
    ];

    /**
     * Get the custom columns that are stored as direct database columns instead of JSON fields.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'plan',
            'is_active',
            'trial_ends_at',
            'storage_limit_mb',
        ];
    }
}
