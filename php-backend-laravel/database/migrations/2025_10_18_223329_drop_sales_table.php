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
        Schema::dropIfExists('sales');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the sales table if needed
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->date('visit_date');
            $table->unsignedBigInteger('client_id')->nullable();
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->boolean('new_order')->default(false);
            $table->decimal('order_value', 12, 2)->nullable();
            $table->string('visit_photo')->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('sales_person_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->foreign('sales_person_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['visit_date', 'sales_person_id']);
            $table->index(['client_id', 'visit_date']);
            $table->index('status');
        });
    }
};
