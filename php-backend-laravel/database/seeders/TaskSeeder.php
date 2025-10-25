<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to assign tasks to
        $admin = User::where('email', 'admin@rdcompany.com')->first();
        $office = User::where('email', 'office@rdcompany.com')->first();
        $sales = User::where('email', 'sales@rdcompany.com')->first();

        $tasks = [
            [
                'title' => 'Follow up with Client ABC',
                'description' => 'Call client to discuss pending order and provide updates on delivery timeline',
                'status' => 'pending',
                'priority' => 'high',
                'due_date' => now()->addDays(7),
                'assigned_to_name' => $sales ? $sales->name : 'Sales User',
                'created_by' => $admin ? $admin->id : 1,
            ],
            [
                'title' => 'Prepare monthly report',
                'description' => 'Compile sales data and create comprehensive monthly performance report',
                'status' => 'done',
                'priority' => 'medium',
                'due_date' => now()->addDays(3),
                'assigned_to_name' => $office ? $office->name : 'Office User',
                'created_by' => $admin ? $admin->id : 1,
            ],
            [
                'title' => 'Update product catalog',
                'description' => 'Review and update product information in the system with latest pricing',
                'status' => 'completed',
                'priority' => 'low',
                'due_date' => now()->addDays(5),
                'assigned_to_name' => $sales ? $sales->name : 'Sales User',
                'created_by' => $admin ? $admin->id : 1,
            ],
        ];

        foreach ($tasks as $taskData) {
            Task::create($taskData);
        }
    }
}
