<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 7-day weekly schedule per staff member
        Schema::create('staff_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->tinyInteger('day_of_week'); // 0=Sun, 1=Mon ... 6=Sat
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_off_day')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'day_of_week']);
        });

        // Daily attendance record per staff
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->string('status')->default('present'); // present, absent, half_day, leave
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });

        // Leave request workflow
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('leave_type')->default('casual'); // sick, casual, annual, other
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('attendance_logs');
        Schema::dropIfExists('staff_schedules');
    }
};
