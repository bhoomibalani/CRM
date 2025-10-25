<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sales extends Model
{
    use HasFactory;

    protected $table = 'sales';

    protected $fillable = [
        'visit_date',
        'client_id',
        'client_name',
        'client_email',
        'client_phone',
        'new_order',
        'order_value',
        'visit_photo',
        'remarks',
        'sales_person_id',
        'order_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'new_order' => 'boolean',
        'order_value' => 'decimal:2',
    ];

    public function salesPerson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_person_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function getFormattedOrderValueAttribute(): string
    {
        return $this->order_value ? '₹' . number_format($this->order_value, 2) : 'N/A';
    }

    public function getSalesPersonNameAttribute(): string
    {
        return $this->salesPerson ? $this->salesPerson->name : 'Unknown';
    }

    public function getFormattedVisitDateAttribute(): string
    {
        return $this->visit_date ? $this->visit_date->format('d/m/Y') : 'N/A';
    }

    public function getVisitPhotoUrlAttribute(): string
    {
        if ($this->visit_photo) {
            if (filter_var($this->visit_photo, FILTER_VALIDATE_URL)) {
                return $this->visit_photo;
            }
            return asset('storage/' . $this->visit_photo);
        }
        return 'https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=No+Photo';
    }
}


