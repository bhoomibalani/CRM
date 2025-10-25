<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    /**
     * Start attendance timer for the authenticated user
     */
    public function start(Request $request)
    {
        $user = $request->user();
        
        // Use the guard user if request user is null
        if (!$user) {
            $user = \Auth::guard('sanctum')->user();
        }
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $today = Carbon::today('Asia/Kolkata');
        $currentTime = Carbon::now('Asia/Kolkata');
        
        // Check if current time is before 9:30 AM
        $cutoffTime = Carbon::createFromTime(9, 30, 0, 'Asia/Kolkata');
        if ($currentTime->gt($cutoffTime)) {
            return response()->json([
                'success' => false, 
                'message' => 'Attendance can only be marked before 9:30 AM. Current time: ' . $currentTime->format('H:i A')
            ], 400);
        }
        
        // Check if user already has an active attendance for today
        $existingAttendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existingAttendance) {
            if ($existingAttendance->isActive()) {
                return response()->json([
                    'success' => false, 
                    'message' => 'You have already started your attendance for today'
                ], 400);
            }
            
            if ($existingAttendance->isCompleted()) {
                return response()->json([
                    'success' => false, 
                    'message' => 'You have already completed your attendance for today'
                ], 400);
            }
        }

        // Create new attendance record or update existing one
        $attendance = Attendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'date' => $today,
            ],
            [
                'start_time' => Carbon::now('Asia/Kolkata'),
                'end_time' => null,
                'status' => 'active',
                'total_hours' => null,
            ]
        );

        Log::info('Attendance started', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'start_time' => $attendance->start_time,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance started successfully',
            'attendance' => [
                'id' => $attendance->id,
                'start_time' => $attendance->start_time->format('Y-m-d H:i:s'),
                'status' => $attendance->status,
            ]
        ]);
    }

    /**
     * End attendance timer for the authenticated user
     */
    public function end(Request $request)
    {
        $user = $request->user();
        
        // Use the guard user if request user is null
        if (!$user) {
            $user = \Auth::guard('sanctum')->user();
        }
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $today = Carbon::today('Asia/Kolkata');
        
        // Find active attendance for today
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->whereNotNull('start_time')
            ->whereNull('end_time')
            ->first();

        if (!$attendance) {
            return response()->json([
                'success' => false, 
                'message' => 'No active attendance found. Please start your attendance first.'
            ], 400);
        }

        $endTime = Carbon::now('Asia/Kolkata');
        $totalMinutes = $attendance->start_time->diffInMinutes($endTime);

        // Update attendance record
        $attendance->update([
            'end_time' => $endTime,
            'total_hours' => $totalMinutes,
            'status' => 'completed',
        ]);

        Log::info('Attendance ended', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'start_time' => $attendance->start_time,
            'end_time' => $attendance->end_time,
            'total_hours' => $attendance->formatted_total_hours,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance ended successfully',
            'attendance' => [
                'id' => $attendance->id,
                'start_time' => $attendance->start_time->format('Y-m-d H:i:s'),
                'end_time' => $attendance->end_time->format('Y-m-d H:i:s'),
                'total_hours' => $attendance->formatted_total_hours,
                'status' => $attendance->status,
            ]
        ]);
    }

    /**
     * Get current attendance status for the authenticated user
     */
    public function status(Request $request)
    {
        $user = $request->user();
        
        // Use the guard user if request user is null
        if (!$user) {
            $user = \Auth::guard('sanctum')->user();
        }
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $today = Carbon::today('Asia/Kolkata');
        
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json([
                'success' => true,
                'status' => 'not_started',
                'message' => 'No attendance record for today'
            ]);
        }

        $response = [
            'success' => true,
            'status' => $attendance->status,
            'attendance' => [
                'id' => $attendance->id,
                'date' => $attendance->date->format('Y-m-d'),
                'start_time' => $attendance->start_time ? $attendance->start_time->format('Y-m-d H:i:s') : null,
                'end_time' => $attendance->end_time ? $attendance->end_time->format('Y-m-d H:i:s') : null,
                'total_hours' => $attendance->formatted_total_hours,
                'status' => $attendance->status,
            ]
        ];

        // If attendance is active, calculate current elapsed time
        if ($attendance->isActive()) {
            $elapsedMinutes = $attendance->start_time->diffInMinutes(Carbon::now('Asia/Kolkata'));
            $elapsedHours = floor($elapsedMinutes / 60);
            $elapsedMins = $elapsedMinutes % 60;
            $response['current_elapsed_time'] = sprintf('%02d:%02d', $elapsedHours, $elapsedMins);
        }

        return response()->json($response);
    }

    /**
     * Get attendance history for the authenticated user
     */
    public function history(Request $request)
    {
        $user = $request->user();
        
        // Use the guard user if request user is null
        if (!$user) {
            $user = \Auth::guard('sanctum')->user();
        }
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $limit = (int) $request->get('limit', 0); // 0 = no explicit limit
        $from = $request->query('from'); // YYYY-MM-DD
        $to = $request->query('to');     // YYYY-MM-DD

        // Normalize to Asia/Kolkata and default range if missing, with validation
        $fromDate = null;
        $toDate = null;
        if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            try {
                $fromDate = Carbon::createFromFormat('Y-m-d', $from, 'Asia/Kolkata')->toDateString();
            } catch (\Exception $e) {
                $fromDate = null;
            }
        }
        if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            try {
                $toDate = Carbon::createFromFormat('Y-m-d', $to, 'Asia/Kolkata')->toDateString();
            } catch (\Exception $e) {
                $toDate = null;
            }
        }
        if (!$fromDate || !$toDate) {
            $toDate = Carbon::today('Asia/Kolkata')->toDateString();
            $fromDate = Carbon::today('Asia/Kolkata')->subDays(29)->toDateString();
        }

        $query = Attendance::where('user_id', $user->id)
            ->when($fromDate && $toDate, function ($q) use ($fromDate, $toDate) {
                $q->whereBetween('date', [$fromDate, $toDate]);
            })
            ->orderBy('date', 'desc');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $attendances = $query->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'date' => $attendance->date->format('Y-m-d'),
                    'start_time' => $attendance->start_time ? $attendance->start_time->format('H:i:s') : null,
                    'end_time' => $attendance->end_time ? $attendance->end_time->format('H:i:s') : null,
                    'total_hours' => $attendance->formatted_total_hours,
                    'status' => $attendance->status,
                ];
            });

        return response()->json([
            'success' => true,
            'attendances' => $attendances,
        ]);
    }

    /**
     * Get all attendance records (for admin/manager roles)
     */
    public function all(Request $request)
    {
        $user = $request->user();
        
        // Use the guard user if request user is null
        if (!$user) {
            $user = \Auth::guard('sanctum')->user();
        }
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Check if user has permission to view all attendance records
        if (!in_array($user->role, ['admin', 'manager', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Insufficient permissions'], 403);
        }

        $limit = (int) $request->get('limit', 0); // 0 = no explicit limit
        $from = $request->query('from'); // YYYY-MM-DD
        $to = $request->query('to');     // YYYY-MM-DD

        // Normalize to Asia/Kolkata and default range if missing, with validation
        $fromDate = null;
        $toDate = null;
        if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            try {
                $fromDate = Carbon::createFromFormat('Y-m-d', $from, 'Asia/Kolkata')->toDateString();
            } catch (\Exception $e) {
                $fromDate = null;
            }
        }
        if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            try {
                $toDate = Carbon::createFromFormat('Y-m-d', $to, 'Asia/Kolkata')->toDateString();
            } catch (\Exception $e) {
                $toDate = null;
            }
        }
        if (!$fromDate || !$toDate) {
            $toDate = Carbon::today('Asia/Kolkata')->toDateString();
            $fromDate = Carbon::today('Asia/Kolkata')->subDays(29)->toDateString();
        }

        $query = Attendance::with('user')
            ->when($fromDate && $toDate, function ($q) use ($fromDate, $toDate) {
                $q->whereBetween('date', [$fromDate, $toDate]);
            })
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $attendances = $query->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'user_id' => $attendance->user_id,
                    'user_name' => $attendance->user->name,
                    'date' => $attendance->date->format('Y-m-d'),
                    'start_time' => $attendance->start_time ? $attendance->start_time->format('H:i:s') : null,
                    'end_time' => $attendance->end_time ? $attendance->end_time->format('H:i:s') : null,
                    'total_hours' => $attendance->formatted_total_hours,
                    'status' => $attendance->status,
                    'notes' => $attendance->notes,
                ];
            });

        return response()->json([
            'success' => true,
            'attendances' => $attendances,
        ]);
    }
}
