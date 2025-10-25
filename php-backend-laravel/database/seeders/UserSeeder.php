<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            ['email' => 'admin@rdcompany.com', 'name' => 'Admin User', 'role' => 'admin'],
            ['email' => 'manager@rdcompany.com', 'name' => 'Manager User', 'role' => 'manager'],
            ['email' => 'sales@rdcompany.com', 'name' => 'Sales User', 'role' => 'sales'],
            ['email' => 'office@rdcompany.com', 'name' => 'Office User', 'role' => 'office'],
            ['email' => 'client@rdcompany.com', 'name' => 'Client User', 'role' => 'client'],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'role' => $userData['role'],
                    'password' => Hash::make('password123'),
                ]
            );
        }
    }
}
