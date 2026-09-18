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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status')->default('pending'); // pending, confirmed, in_progress, completed, cancelled, no_show
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('appointment_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2); // Snapshot of service price at time of booking
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_service');
        Schema::dropIfExists('appointments');
    }
};
