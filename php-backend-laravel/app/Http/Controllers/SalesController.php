<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sales;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SalesController extends Controller
{
    // Handle file upload for visit photos
    public function uploadPhoto(Request $request)
    {
        // Debug: Check authentication before getting user
        \Log::info('Upload method authentication debug', [
            'has_auth_header' => $request->hasHeader('Authorization'),
            'auth_header' => $request->header('Authorization') ? 'Present' : 'Missing',
            'sanctum_check' => \Auth::guard('sanctum')->check(),
            'user_id' => \Auth::guard('sanctum')->id(),
            'user_email' => \Auth::guard('sanctum')->user() ? \Auth::guard('sanctum')->user()->email : null,
            'user_role' => \Auth::guard('sanctum')->user() ? \Auth::guard('sanctum')->user()->role : null,
            'url' => $request->url(),
            'method' => $request->method()
        ]);

        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        // Try alternative authentication methods
        $authUserAlt = \Auth::user();
        $authUserGuard = \Auth::guard('sanctum')->user();
        
        \Log::info('Alternative authentication methods', [
            'request_user' => $authUser ? $authUser->id : null,
            'auth_user' => $authUserAlt ? $authUserAlt->id : null,
            'auth_guard_user' => $authUserGuard ? $authUserGuard->id : null,
            'all_same' => ($authUser && $authUserAlt && $authUserGuard) ? 
                ($authUser->id === $authUserAlt->id && $authUserAlt->id === $authUserGuard->id) : false
        ]);

        // Debug: Log user information
        \Log::info('Upload authentication check', [
            'user_id' => $authUser ? $authUser->id : null,
            'user_email' => $authUser ? $authUser->email : null,
            'user_role' => $authUser ? $authUser->role : null,
            'has_user' => $authUser ? true : false
        ]);

        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
            \Log::info('Using guard user instead', [
                'guard_user' => $authUser ? $authUser->id : null
            ]);
        }

        // Temporarily allow all authenticated users for debugging
        if (!$authUser) {
            \Log::warning('Upload forbidden - no user', [
                'has_user' => false
            ]);
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Log user details for debugging
        \Log::info('User attempting upload', [
            'user_id' => $authUser->id,
            'user_email' => $authUser->email,
            'user_role' => $authUser->role,
            'role_check' => in_array($authUser->role, ['admin', 'manager', 'sales', 'office'])
        ]);

        // Only sales personnel can upload photos for sales reports
        if ($authUser->role !== 'sales') {
            \Log::warning('Upload forbidden - not sales role', [
                'user_id' => $authUser->id,
                'user_role' => $authUser->role,
                'required_role' => 'sales'
            ]);
            return response()->json(['success' => false, 'message' => 'Only sales personnel can upload visit photos'], 403);
        }

        // Debug: Log the request
        \Log::info('Upload request received', [
            'has_file' => $request->hasFile('photo'),
            'file_size' => $request->hasFile('photo') ? $request->file('photo')->getSize() : null,
            'file_type' => $request->hasFile('photo') ? $request->file('photo')->getMimeType() : null
        ]);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        try {
            // Generate unique filename
            $filename = Str::uuid() . '.' . $request->file('photo')->getClientOriginalExtension();
            
            // Ensure the directory exists
            \Storage::makeDirectory('public/visit_photos');
            
            // Store the file using putFileAs method
            $path = \Storage::disk('public')->putFileAs('visit_photos', $request->file('photo'), $filename);
            
            // Return the relative path for database storage
            $relativePath = str_replace('public/', '', $path);

            \Log::info('File uploaded successfully', [
                'filename' => $filename,
                'path' => $path,
                'relative_path' => $relativePath
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'file_path' => $relativePath,
                'file_url' => asset('storage/' . $relativePath)
            ]);
        } catch (\Exception $e) {
            \Log::error('Upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload photo: ' . $e->getMessage()
            ], 500);
        }
    }
    // Get all sales reports with optional filters
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

        // Allow admin, manager, office, and sales to view reports
        if (!$authUser || !in_array($authUser->role, ['admin', 'manager', 'office', 'sales'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $query = Sales::with(['salesPerson', 'order']);

        // Apply filters
        if ($request->has('client_id') && $request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->where('visit_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->where('visit_date', '<=', $request->date_to);
        }

        if ($request->has('sales_person_id') && $request->sales_person_id) {
            $query->where('sales_person_id', $request->sales_person_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Role-based filtering
        if ($authUser->role === 'sales') {
            $query->where('sales_person_id', $authUser->id);
        }

        $reports = $query->orderBy('visit_date', 'desc')->get();

        $formattedReports = $reports->map(function ($report) {
            return [
                'id' => $report->id,
                'visit_date' => $report->visit_date ? $report->visit_date->format('Y-m-d') : null,
                'client_id' => $report->client_id,
                'client_name' => $report->client_name,
                'client_email' => $report->client_email,
                'client_phone' => $report->client_phone,
                'new_order' => $report->new_order,
                'order_value' => $report->order_value,
                'visit_photo' => $report->visit_photo,
                'visit_photo_url' => $report->visit_photo_url,
                'remarks' => $report->remarks,
                'sales_person_id' => $report->sales_person_id,
                'sales_person' => $report->sales_person_name,
                'order_id' => $report->order_id,
                'status' => $report->status,
                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'reports' => $formattedReports,
        ]);
    }

    // Get a single sales report
    public function show(Request $request, $id)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }

        // Allow admin, manager, office, and sales to view individual reports
        if (!$authUser || !in_array($authUser->role, ['admin', 'manager', 'office', 'sales'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $report = Sales::with(['salesPerson', 'order'])->find($id);

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not found'], 404);
        }

        // Role-based access control
        if ($authUser->role === 'sales' && $report->sales_person_id !== $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        return response()->json([
            'success' => true,
            'report' => [
                'id' => $report->id,
                'visit_date' => $report->visit_date ? $report->visit_date->format('Y-m-d') : null,
                'client_id' => $report->client_id,
                'client_name' => $report->client_name,
                'client_email' => $report->client_email,
                'client_phone' => $report->client_phone,
                'new_order' => $report->new_order,
                'order_value' => $report->order_value,
                'visit_photo' => $report->visit_photo,
                'visit_photo_url' => $report->visit_photo_url,
                'remarks' => $report->remarks,
                'sales_person_id' => $report->sales_person_id,
                'sales_person' => $report->sales_person_name,
                'order_id' => $report->order_id,
                'status' => $report->status,
                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    // Create a new sales report (secured)
    public function store(Request $request)
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

        // Only sales personnel can create sales reports
        if (!$authUser || $authUser->role !== 'sales') {
            return response()->json(['success' => false, 'message' => 'Only sales personnel can create sales reports'], 403);
        }

        // Normalize incoming payload before validation
        $normalized = $request->all();
        // Treat empty string order_id as null
        if (array_key_exists('order_id', $normalized) && ($normalized['order_id'] === '' || $normalized['order_id'] === null)) {
            unset($normalized['order_id']);
        }
        // If order_id is an order code like "ORD-001", resolve it to the numeric ID
        if (array_key_exists('order_id', $normalized)
            && is_string($normalized['order_id'])
            && preg_match('/^ORD-\d+$/', $normalized['order_id'])) {
            $byCode = Order::where('order_id', $normalized['order_id'])->first();
            $normalized['order_id'] = $byCode ? $byCode->id : null;
        }
        // sales_person_id: default to current user if missing/empty/invalid
        if (!array_key_exists('sales_person_id', $normalized) || $normalized['sales_person_id'] === '' || $normalized['sales_person_id'] === null) {
            $normalized['sales_person_id'] = $authUser->id;
        } else if (!is_numeric($normalized['sales_person_id']) || !User::find((int)$normalized['sales_person_id'])) {
            $normalized['sales_person_id'] = $authUser->id;
        }

        // Replace request data for validator
        $request->replace($normalized);

        $validated = $request->validate([
            'visit_date' => ['required', 'date'],
            'client_id' => ['nullable', 'integer'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['required', 'string', 'max:20'],
            'new_order' => ['required', 'boolean'],
            'order_value' => ['nullable', 'numeric', 'min:0'],
            'visit_photo' => ['required', 'string', 'max:255'], // Now expects file path, not base64
            'remarks' => ['nullable', 'string', 'max:2000'],
            'sales_person_id' => ['required', 'integer', 'exists:users,id'], // ensured above
            // Accept nullable numeric ID; we've already normalized order codes to IDs above
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'status' => ['nullable', 'in:pending,completed,cancelled'],
        ]);

        // Default values
        if (!isset($validated['sales_person_id'])) {
            $validated['sales_person_id'] = $authUser->id;
        }
        // As a safety net, ensure sales_person_id points to a real user
        if (!User::find($validated['sales_person_id'])) {
            $validated['sales_person_id'] = $authUser->id;
        }
        if (!isset($validated['status'])) {
            $validated['status'] = 'completed';
        }
        $validated['created_by'] = $authUser->id;

        // If marked as new order and order_value missing, but order_id provided, derive value
        if (($validated['new_order'] ?? false) && empty($validated['order_value']) && !empty($validated['order_id'])) {
            $order = Order::find($validated['order_id']);
            if ($order) {
                $validated['order_value'] = $order->total_amount;
            } else {
                // If provided order does not exist, unset to avoid FK failures
                unset($validated['order_id']);
            }
        }

        $sales = Sales::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sales report created successfully',
            'report' => [
                'id' => $sales->id,
                'visit_date' => $sales->visit_date ? $sales->visit_date->format('Y-m-d') : null,
                'client_name' => $sales->client_name,
                'new_order' => $sales->new_order,
                'order_value' => $sales->order_value,
                'visit_photo_url' => $sales->visit_photo_url,
                'remarks' => $sales->remarks,
                'sales_person' => $sales->sales_person_name,
                'status' => $sales->status,
                'created_at' => $sales->created_at->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    // Update an existing sales report
    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }

        // Only sales personnel can update sales reports
        if (!$authUser || $authUser->role !== 'sales') {
            return response()->json(['success' => false, 'message' => 'Only sales personnel can update sales reports'], 403);
        }

        $report = Sales::find($id);

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not found'], 404);
        }

        // Role-based access control
        if ($authUser->role === 'sales' && $report->sales_person_id !== $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        // Normalize incoming payload before validation
        $normalized = $request->all();
        // Treat empty string order_id as null
        if (array_key_exists('order_id', $normalized) && ($normalized['order_id'] === '' || $normalized['order_id'] === null)) {
            unset($normalized['order_id']);
        }
        // If order_id is an order code like "ORD-001", resolve it to the numeric ID
        if (array_key_exists('order_id', $normalized)
            && is_string($normalized['order_id'])
            && preg_match('/^ORD-\d+$/', $normalized['order_id'])) {
            $byCode = Order::where('order_id', $normalized['order_id'])->first();
            $normalized['order_id'] = $byCode ? $byCode->id : null;
        }
        // sales_person_id: default to current user if missing/empty/invalid
        if (!array_key_exists('sales_person_id', $normalized) || $normalized['sales_person_id'] === '' || $normalized['sales_person_id'] === null) {
            $normalized['sales_person_id'] = $authUser->id;
        } else if (!is_numeric($normalized['sales_person_id']) || !User::find((int)$normalized['sales_person_id'])) {
            $normalized['sales_person_id'] = $authUser->id;
        }

        // Replace request data for validator
        $request->replace($normalized);

        $validated = $request->validate([
            'visit_date' => ['required', 'date'],
            'client_id' => ['nullable', 'integer'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['required', 'string', 'max:20'],
            'new_order' => ['required', 'boolean'],
            'order_value' => ['nullable', 'numeric', 'min:0'],
            'visit_photo' => ['required', 'string', 'max:255'], // Now expects file path, not base64
            'remarks' => ['nullable', 'string', 'max:2000'],
            'sales_person_id' => ['required', 'integer', 'exists:users,id'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'status' => ['nullable', 'in:pending,completed,cancelled'],
        ]);

        // If marked as new order and order_value missing, but order_id provided, derive value
        if (($validated['new_order'] ?? false) && empty($validated['order_value']) && !empty($validated['order_id'])) {
            $order = Order::find($validated['order_id']);
            if ($order) {
                $validated['order_value'] = $order->total_amount;
            } else {
                unset($validated['order_id']);
            }
        }

        $report->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sales report updated successfully',
            'report' => [
                'id' => $report->id,
                'visit_date' => $report->visit_date ? $report->visit_date->format('Y-m-d') : null,
                'client_name' => $report->client_name,
                'new_order' => $report->new_order,
                'order_value' => $report->order_value,
                'visit_photo_url' => $report->visit_photo_url,
                'remarks' => $report->remarks,
                'sales_person' => $report->sales_person_name,
                'status' => $report->status,
                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    // Delete a sales report
    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }

        // Only sales personnel can delete sales reports
        if (!$authUser || $authUser->role !== 'sales') {
            return response()->json(['success' => false, 'message' => 'Only sales personnel can delete sales reports'], 403);
        }

        $report = Sales::find($id);

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not found'], 404);
        }

        // Role-based access control
        if ($authUser->role === 'sales' && $report->sales_person_id !== $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sales report deleted successfully',
        ]);
    }
}


