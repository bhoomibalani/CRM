<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sales;
use App\Models\User;
use App\Models\Order;

class SalesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users for sales person and creator
        $adminUser = User::where('role', 'admin')->first();
        $salesUser = User::where('role', 'sales')->first();
        
        if (!$adminUser || !$salesUser) {
            return; // No users found, skip seeding
        }

        // Get some orders for reference
        $orders = Order::take(3)->get();

        $sampleSales = [
            [
                'visit_date' => '2024-01-15',
                'client_id' => 1,
                'client_name' => 'Client ABC',
                'client_email' => 'client.abc@example.com',
                'client_phone' => '1234567890',
                'new_order' => true,
                'order_value' => 15000.00,
                'visit_photo' => 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=Visit+1',
                'remarks' => 'Successful meeting, client interested in new product line. Discussed pricing and delivery terms.',
                'sales_person_id' => $salesUser->id,
                'order_id' => $orders->count() > 0 ? $orders[0]->id : null,
                'status' => 'completed',
                'created_by' => $adminUser->id,
            ],
            [
                'visit_date' => '2024-01-14',
                'client_id' => 2,
                'client_name' => 'Client XYZ',
                'client_email' => 'client.xyz@example.com',
                'client_phone' => '0987654321',
                'new_order' => false,
                'order_value' => null,
                'visit_photo' => 'https://via.placeholder.com/150x150/2196F3/FFFFFF?text=Visit+2',
                'remarks' => 'Follow-up visit for existing order. Client satisfied with current service.',
                'sales_person_id' => $salesUser->id,
                'order_id' => null,
                'status' => 'completed',
                'created_by' => $adminUser->id,
            ],
            [
                'visit_date' => '2024-01-13',
                'client_id' => 3,
                'client_name' => 'Client DEF',
                'client_email' => 'client.def@example.com',
                'client_phone' => '1122334455',
                'new_order' => true,
                'order_value' => 8500.00,
                'visit_photo' => 'https://via.placeholder.com/150x150/FF9800/FFFFFF?text=Visit+3',
                'remarks' => 'Initial meeting with new client. Showed product catalog and discussed requirements.',
                'sales_person_id' => $salesUser->id,
                'order_id' => $orders->count() > 1 ? $orders[1]->id : null,
                'status' => 'completed',
                'created_by' => $adminUser->id,
            ],
            [
                'visit_date' => '2024-01-12',
                'client_id' => 1,
                'client_name' => 'Client ABC',
                'client_email' => 'client.abc@example.com',
                'client_phone' => '1234567890',
                'new_order' => false,
                'order_value' => null,
                'visit_photo' => 'https://via.placeholder.com/150x150/9C27B0/FFFFFF?text=Visit+4',
                'remarks' => 'Regular follow-up visit. Client mentioned potential for future orders.',
                'sales_person_id' => $salesUser->id,
                'order_id' => null,
                'status' => 'completed',
                'created_by' => $adminUser->id,
            ],
            [
                'visit_date' => '2024-01-11',
                'client_id' => 4,
                'client_name' => 'Client GHI',
                'client_email' => 'client.ghi@example.com',
                'client_phone' => '5566778899',
                'new_order' => true,
                'order_value' => 22000.00,
                'visit_photo' => 'https://via.placeholder.com/150x150/607D8B/FFFFFF?text=Visit+5',
                'remarks' => 'Major client meeting. Secured large order for upcoming quarter.',
                'sales_person_id' => $salesUser->id,
                'order_id' => $orders->count() > 2 ? $orders[2]->id : null,
                'status' => 'completed',
                'created_by' => $adminUser->id,
            ],
        ];

        foreach ($sampleSales as $salesData) {
            Sales::create($salesData);
        }
    }
}