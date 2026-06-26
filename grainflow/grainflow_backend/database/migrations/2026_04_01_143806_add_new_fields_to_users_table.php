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
        Schema::table('users', function (Blueprint $table) {
            // Add these new columns
            $table->string('phone')->nullable()->after('email');
            $table->string('store_address')->nullable()->after('store_name');
            $table->longText('logo_path')->nullable(); // Using longText for Base64 image strings
            $table->string('verification_code')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove the columns if we rollback the migration
            $table->dropColumn(['phone', 'store_address', 'logo_path', 'verification_code']);
        });
    }
};