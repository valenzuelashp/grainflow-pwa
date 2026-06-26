<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            
            $table->decimal('quantity', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->string('payment_method');
            $table->string('customer_name')->nullable(); 
            
            // NEW COLUMNS FOR UTANG & DISCOUNTS
            $table->string('status')->default('paid'); // Can be 'paid', 'utang', or 'cancelled'
            $table->decimal('discount_applied', 10, 2)->default(0); // Tracks automatic discounts
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};