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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('category');
            $table->decimal('pricePerUnit', 10, 2); // Allows prices up to 99,999,999.99

            
            $table->decimal('sack_price', 10, 2)->nullable(); // Price for a full sack
            $table->decimal('tubo', 10, 2)->nullable();       // The markup per kg
            $table->boolean('is_archived')->default(false);   // To hide zero-stock items
           
            $table->integer('stockQuantity');
            $table->string('unit');
            $table->integer('reorderLevel');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
