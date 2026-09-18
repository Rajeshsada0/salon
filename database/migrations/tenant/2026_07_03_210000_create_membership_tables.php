<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Silver, Gold, Platinum
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('duration_months')->default(1);
            $table->decimal('discount_percentage', 5, 2)->default(0.00);
            $table->integer('loyalty_points_bonus')->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('customer_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained('membership_plans')->cascadeOnDelete();
            $table->date('started_at');
            $table->date('expires_at');
            $table->string('status')->default('active'); // active, expired, cancelled
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_memberships');
        Schema::dropIfExists('membership_plans');
    }
};
