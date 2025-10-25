<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClientPayment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ClientPaymentController extends Controller
{
    /**
     * Get all client payments with filtering
     */
    public function index(Request $request)
    {
        $authUser = $request->user();
        
        if (!$authUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = ClientPayment::with(['client', 'salesPerson', 'approver']);

        // Role-based filtering
        if ($authUser->role === 'client') {
            $query->where('client_id', $authUser->id);
        } elseif (in_array($authUser->role, ['admin', 'manager', 'office'])) {
            // Admin, manager, and office can see all payments
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        // Status filtering
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    /**
     * Create a new client payment report
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        
        if (!$authUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Only clients can create payment reports
        if ($authUser->role !== 'client') {
            return response()->json(['success' => false, 'message' => 'Only clients can report payments'], 403);
        }

        try {
            $validated = $request->validate([
                'sales_person_id' => ['required', 'integer', 'exists:users,id'],
                'amount' => ['required', 'numeric', 'min:0.01'],
                'payment_method' => ['required', 'string', 'in:cash,bank_transfer,cheque,upi,other'],
                'transaction_reference' => ['nullable', 'string', 'max:255'],
                'payment_date' => ['required', 'date'],
                'description' => ['nullable', 'string', 'max:1000'],
            ]);

            // Verify the sales person exists and has sales role
            $salesPerson = User::where('id', $validated['sales_person_id'])
                ->where('role', 'sales')
                ->first();

            if (!$salesPerson) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Invalid sales person selected'
                ], 400);
            }

            $payment = ClientPayment::create([
                'client_id' => $authUser->id,
                'sales_person_id' => $validated['sales_person_id'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $validated['transaction_reference'],
                'payment_date' => $validated['payment_date'],
                'description' => $validated['description'],
                'status' => 'pending',
            ]);

            Log::info('Client payment report created', [
                'payment_id' => $payment->id,
                'client_id' => $authUser->id,
                'sales_person_id' => $validated['sales_person_id'],
                'amount' => $validated['amount'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment report submitted successfully',
                'payment' => $payment->load(['client', 'salesPerson']),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Client payment validation failed', [
                'errors' => $e->errors(),
                'user_id' => $authUser->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Client payment creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $authUser->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment report',
            ], 500);
        }
    }

    /**
     * Update payment status (approve/reject) - Admin only
     */
    public function updateStatus(Request $request, $id)
    {
        $authUser = $request->user();
        
        if (!$authUser) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Only admin, manager, and office can approve/reject payments
        if (!in_array($authUser->role, ['admin', 'manager', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        try {
            $validated = $request->validate([
                'status' => ['required', 'string', 'in:approved,rejected'],
                'admin_notes' => ['nullable', 'string', 'max:1000'],
            ]);

            $payment = ClientPayment::findOrFail($id);

            if ($payment->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment has already been processed'
                ], 400);
            }

            $payment->update([
                'status' => $validated['status'],
                'approved_by' => $authUser->id,
                'approved_at' => now(),
                'admin_notes' => $validated['admin_notes'],
            ]);

            Log::info('Client payment status updated', [
                'payment_id' => $payment->id,
                'status' => $validated['status'],
                'approved_by' => $authUser->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment status updated successfully',
                'payment' => $payment->load(['client', 'salesPerson', 'approver']),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Client payment status update failed', [
                'error' => $e->getMessage(),
                'user_id' => $authUser->id,
                'payment_id' => $id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status',
            ], 500);
        }
    }

    /**
     * Get sales persons for client to select from
     */
    public function getSalesPersons()
    {
        $salesPersons = User::where('role', 'sales')
            ->select('id', 'name', 'email')
            ->get();

        return response()->json([
            'success' => true,
            'sales_persons' => $salesPersons,
        ]);
    }
}
