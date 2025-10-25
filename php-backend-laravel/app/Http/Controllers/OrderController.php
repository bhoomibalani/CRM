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
        $orders = Order::with(['creator', 'items'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $productCount = $order->items->count();
                $orderDetails = $productCount > 1 
                    ? "{$productCount} products" 
                    : $order->quantity . ' units of ' . $order->product_name;
                
                return [
                    'id' => $order->id,
                    'order_id' => $order->order_id,
                    'client_name' => $order->customer_name,
                    'order_details' => $orderDetails,
                    'status' => strtoupper($order->status),
                    'created_date' => $order->created_at->format('d/m/Y'),
                    'total_amount' => $order->total_amount,
                    'product_count' => $productCount,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product_name,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total_amount' => $item->total_amount,
                        ];
                    }),
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
        try {
            \Log::info('Order creation request received', [
                'request_data' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            $authUser = $request->user();
            
            // Use the guard user if request user is null
            if (!$authUser) {
                $authUser = \Auth::guard('sanctum')->user();
            }
            
            \Log::info('Authenticated user for order creation', [
                'user_id' => $authUser ? $authUser->id : null,
                'user_role' => $authUser ? $authUser->role : null
            ]);
            
            // Check if user has permission to create orders
            if (!$authUser || !in_array($authUser->role, ['admin', 'client', 'sales', 'office'])) {
                \Log::warning('Unauthorized order creation attempt', [
                    'user_id' => $authUser ? $authUser->id : null,
                    'user_role' => $authUser ? $authUser->role : null
                ]);
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }

            $validated = $request->validate([
                'customer_name' => ['required', 'string', 'max:255'],
                'customer_email' => ['nullable', 'email', 'max:255'],
                'customer_phone' => ['nullable', 'string', 'max:20'],
                'products' => ['required', 'array', 'min:1', 'max:15'],
                'products.*.product_name' => ['required', 'string', 'max:255'],
                'products.*.quantity' => ['required', 'integer', 'min:1'],
                'products.*.unit_price' => ['required', 'numeric', 'min:0'],
                'total_amount' => ['required', 'numeric', 'min:0'],
                'order_date' => ['required', 'date'],
                'delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
                'status' => ['required', 'in:pending,confirmed,processing,shipped,delivered,cancelled'],
                'notes' => ['nullable', 'string', 'max:1000'],
            ]);

            \Log::info('Order validation passed', ['validated_data' => $validated]);

            // Calculate total amount from products
            $calculatedTotal = 0;
            foreach ($validated['products'] as $product) {
                $calculatedTotal += $product['quantity'] * $product['unit_price'];
            }

            // Generate unique order ID
            $orderNumber = Order::count() + 1;
            $orderId = 'ORD-' . str_pad($orderNumber, 3, '0', STR_PAD_LEFT);
            
            // Create order in database
            $order = Order::create([
                'order_id' => $orderId,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'product_name' => $validated['products'][0]['product_name'], // Keep first product for backward compatibility
                'quantity' => $validated['products'][0]['quantity'],
                'unit_price' => $validated['products'][0]['unit_price'],
                'total_amount' => $calculatedTotal,
                'order_date' => $validated['order_date'],
                'delivery_date' => $validated['delivery_date'] ?? null,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => $authUser->id,
            ]);

            // Create order items
            foreach ($validated['products'] as $product) {
                \App\Models\OrderItem::create([
                    'order_id' => $order->id,
                    'product_name' => $product['product_name'],
                    'quantity' => $product['quantity'],
                    'unit_price' => $product['unit_price'],
                    'total_amount' => $product['quantity'] * $product['unit_price'],
                ]);
            }

            \Log::info('Order created successfully', ['order_id' => $order->id, 'order_number' => $order->order_id]);

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

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in order creation', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
