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
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('request_id')->unique();
            $table->unsignedBigInteger('client_id');
            $table->text('request_details');
            $table->text('additional_notes')->nullable();
            $table->enum('status', ['pending', 'uploaded', 'confirmed'])->default('pending');
            $table->datetime('request_date');
            $table->unsignedBigInteger('requested_by');
            $table->datetime('uploaded_date')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['status', 'request_date']);
            $table->index('client_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledgers');
    }
};
