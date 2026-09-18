<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description'])]
class ExpenseCategory extends Model
{
    /**
     * Get the expenses in this category.
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
