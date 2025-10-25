<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Order;

class OrderController extends Controller
{

    //show order
    public function index(Request $request)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        // Check if user has permission to view orders
        if (!$authUser || !in_array($authUser->role, ['admin', 'client', 'sales', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        // Get orders from database
        $orders = Order::with('creator')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_id' => $order->order_id,
                    'client_name' => $order->customer_name,
                    'order_details' => $order->quantity . ' units of ' . $order->product_name,
                    'status' => strtoupper($order->status),
                    'created_date' => $order->created_at->format('d/m/Y'),
                    'total_amount' => $order->total_amount,
                ];
            });

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }
//create order
    public function store(Request $request)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        // Check if user has permission to create orders
        if (!$authUser || !in_array($authUser->role, ['admin', 'client', 'sales', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'product_name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'order_date' => ['required', 'date'],
            'delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'status' => ['required', 'in:pending,confirmed,processing,shipped,delivered,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // Calculate total amount if not provided
        if (!isset($validated['total_amount']) || $validated['total_amount'] == 0) {
            $validated['total_amount'] = $validated['quantity'] * $validated['unit_price'];
        }


        // Generate unique order ID
        $orderNumber = Order::count() + 1;
        $orderId = 'ORD-' . str_pad($orderNumber, 3, '0', STR_PAD_LEFT);
        
        // Create order in database
        $order = Order::create([
            'order_id' => $orderId,
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'product_name' => $validated['product_name'],
            'quantity' => $validated['quantity'],
            'unit_price' => $validated['unit_price'],
            'total_amount' => $validated['total_amount'],
            'order_date' => $validated['order_date'],
            'delivery_date' => $validated['delivery_date'] ?? null,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => $authUser->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'order' => [
                'id' => $order->id,
                'order_id' => $order->order_id,
                'client_name' => $order->customer_name,
                'order_details' => $order->quantity . ' units of ' . $order->product_name,
                'status' => strtoupper($order->status),
                'created_date' => $order->created_at->format('d/m/Y'),
                'total_amount' => $order->total_amount,
            ],
        ], 201);
    }
}
