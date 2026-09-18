<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('credit_limit', 10, 2)->default(0.00);
            $table->decimal('outstanding_balance', 10, 2)->default(0.00);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            $table->decimal('due_amount', 10, 2)->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['credit_limit', 'outstanding_balance']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'due_amount']);
        });
    }
};
