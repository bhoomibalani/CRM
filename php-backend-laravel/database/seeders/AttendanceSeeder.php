<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->command->info('No users found. Please run UserSeeder first.');
            return;
        }

        // Create attendance records for the last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            foreach ($users as $user) {
                // Skip weekends for some users
                if ($date->isWeekend() && $user->role === 'client') {
                    continue;
                }

                // Random attendance status
                $statuses = ['active', 'completed', 'not_started'];
                $status = $statuses[array_rand($statuses)];

                if ($status === 'completed') {
                    // Create completed attendance
                    $startTime = $date->copy()->setHour(9)->setMinute(rand(0, 30));
                    $endTime = $startTime->copy()->addHours(rand(7, 9))->addMinutes(rand(0, 59));
                    
                    Attendance::create([
                        'user_id' => $user->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'status' => 'completed',
                        'total_hours' => $startTime->diffInMinutes($endTime),
                        'notes' => null,
                    ]);
                } elseif ($status === 'active') {
                    // Create active attendance (started but not ended)
                    $startTime = $date->copy()->setHour(9)->setMinute(rand(0, 30));
                    
                    Attendance::create([
                        'user_id' => $user->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => null,
                        'status' => 'active',
                        'total_hours' => null,
                        'notes' => null,
                    ]);
                }
                // Skip 'not_started' status as we don't create records for it
            }
        }

        $this->command->info('Attendance records created successfully!');
    }
}