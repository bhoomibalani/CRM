<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'start_time',
        'end_time',
        'total_hours',
        'status',
        'notes'
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Get the user that owns the attendance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate total hours worked in minutes
     */
    public function calculateTotalHours(): int
    {
        if ($this->start_time && $this->end_time) {
            return $this->start_time->diffInMinutes($this->end_time);
        }
        return 0;
    }

    /**
     * Get formatted total hours (HH:MM format)
     */
    public function getFormattedTotalHoursAttribute(): string
    {
        $minutes = $this->total_hours ?? $this->calculateTotalHours();
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    /**
     * Check if attendance is currently active (started but not ended)
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->start_time && !$this->end_time;
    }

    /**
     * Check if attendance is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed' && $this->start_time && $this->end_time;
    }
}
