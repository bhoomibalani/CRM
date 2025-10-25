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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->change();
            $table->string('customer_phone')->nullable()->change();
            $table->date('delivery_date')->nullable()->change();
            $table->text('notes')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable(false)->change();
            $table->string('customer_phone')->nullable(false)->change();
            $table->date('delivery_date')->nullable(false)->change();
            $table->text('notes')->nullable(false)->change();
        });
    }
};
