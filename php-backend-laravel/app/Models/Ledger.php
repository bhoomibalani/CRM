<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ledger extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'client_id',
        'request_details',
        'additional_notes',
        'status',
        'request_date',
        'requested_by',
        'uploaded_date',
        'uploaded_by',
        'file_path',
        'file_name',
        'file_size',
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'uploaded_date' => 'datetime',
    ];

    // Date formatting accessors
    public function getFormattedRequestDateAttribute()
    {
        return $this->request_date ? $this->request_date->format('M d, Y H:i') : null;
    }

    public function getFormattedUploadedDateAttribute()
    {
        return $this->uploaded_date ? $this->uploaded_date->format('M d, Y H:i') : null;
    }

    public function getRequestDateHumanAttribute()
    {
        return $this->request_date ? $this->request_date->diffForHumans() : null;
    }

    public function getUploadedDateHumanAttribute()
    {
        return $this->uploaded_date ? $this->uploaded_date->diffForHumans() : null;
    }

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_UPLOADED = 'uploaded';
    const STATUS_CONFIRMED = 'confirmed';

    // Relationships
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    // Helper methods
    public function canBeUploaded()
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canBeConfirmed()
    {
        return $this->status === self::STATUS_UPLOADED;
    }

    public function canBeDownloaded()
    {
        return ($this->status === self::STATUS_UPLOADED || $this->status === self::STATUS_CONFIRMED) && !empty($this->file_path);
    }
}

