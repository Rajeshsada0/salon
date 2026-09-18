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
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('retail_price', 10, 2);
            $table->integer('stock_quantity')->default(0);
            $table->integer('alert_quantity')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('quantity'); // Change in quantity (+/-)
            $table->string('type'); // purchase, stock_in, stock_out, adjustment, transfer
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
        Schema::dropIfExists('products');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('product_categories');
    }
};
