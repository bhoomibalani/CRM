<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\User;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user to assign as creator
        $adminUser = User::where('role', 'admin')->first();
        
        if (!$adminUser) {
            return; // No admin user found, skip seeding
        }

        $sampleOrders = [
            [
                'order_id' => 'ORD-001',
                'customer_name' => 'Client ABC',
                'customer_email' => 'client.abc@example.com',
                'customer_phone' => '1234567890',
                'product_name' => 'Product A',
                'quantity' => 50,
                'unit_price' => 25.00,
                'total_amount' => 1250.00,
                'order_date' => '2024-01-15',
                'delivery_date' => '2024-01-20',
                'status' => 'pending',
                'notes' => 'Custom packaging required',
                'created_by' => $adminUser->id,
            ],
            [
                'order_id' => 'ORD-002',
                'customer_name' => 'Client XYZ',
                'customer_email' => 'client.xyz@example.com',
                'customer_phone' => '0987654321',
                'product_name' => 'Product C',
                'quantity' => 100,
                'unit_price' => 18.00,
                'total_amount' => 1800.00,
                'order_date' => '2024-01-14',
                'delivery_date' => '2024-01-19',
                'status' => 'confirmed',
                'notes' => 'Custom labeling required',
                'created_by' => $adminUser->id,
            ],
            [
                'order_id' => 'ORD-003',
                'customer_name' => 'Client DEF',
                'customer_email' => 'client.def@example.com',
                'customer_phone' => '5555555555',
                'product_name' => 'Product D',
                'quantity' => 75,
                'unit_price' => 30.00,
                'total_amount' => 2250.00,
                'order_date' => '2024-01-13',
                'delivery_date' => '2024-01-18',
                'status' => 'processing',
                'notes' => 'Bulk order',
                'created_by' => $adminUser->id,
            ],
            [
                'order_id' => 'ORD-004',
                'customer_name' => 'Client ABC',
                'customer_email' => 'client.abc@example.com',
                'customer_phone' => '1234567890',
                'product_name' => 'Product F',
                'quantity' => 200,
                'unit_price' => 22.50,
                'total_amount' => 4500.00,
                'order_date' => '2024-01-10',
                'delivery_date' => '2024-01-15',
                'status' => 'delivered',
                'notes' => 'Urgent delivery',
                'created_by' => $adminUser->id,
            ],
            [
                'order_id' => 'ORD-005',
                'customer_name' => 'Client XYZ',
                'customer_email' => 'client.xyz@example.com',
                'customer_phone' => '0987654321',
                'product_name' => 'Product G',
                'quantity' => 150,
                'unit_price' => 18.67,
                'total_amount' => 2800.50,
                'order_date' => '2024-01-12',
                'delivery_date' => '2024-01-17',
                'status' => 'pending',
                'notes' => 'Special handling required',
                'created_by' => $adminUser->id,
            ],
        ];

        foreach ($sampleOrders as $orderData) {
            Order::create($orderData);
        }
    }
}
