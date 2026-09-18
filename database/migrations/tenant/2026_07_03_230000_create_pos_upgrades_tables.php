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
        Schema::create('coupon_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type'); // percentage, fixed
            $table->decimal('value', 10, 2);
            $table->date('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('max_uses')->nullable();
            $table->integer('uses_count')->default(0);
            $table->timestamps();
        });

        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('payment_method'); // cash, card, wallet, credit
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('coupon_code_id')->nullable()->constrained('coupon_codes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['coupon_code_id']);
            $table->dropColumn('coupon_code_id');
        });

        Schema::dropIfExists('invoice_payments');
        Schema::dropIfExists('coupon_codes');
    }
};
