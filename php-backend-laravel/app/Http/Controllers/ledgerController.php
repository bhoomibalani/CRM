<?php

namespace App\Http\Controllers;

use App\Models\Ledger;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ledgerController extends Controller
{
    /**
     * Get all ledger requests with optional filtering
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Ledger::with(['client', 'requester', 'uploader']);

            // Role-based filtering
            // Check if user wants to see all ledgers (for management view)
            $showAllLedgers = $request->has('all_ledgers') && $request->all_ledgers === true;
            
            if ($showAllLedgers && in_array($user->role, ['admin', 'manager', 'office'])) {
                // Admin, manager, and office can see all requests when explicitly requested
                // No additional filtering needed
            } else {
                // Apply role-based filtering for normal views
                if ($user->role === 'client') {
                    // Clients can only see their own requests
                    $query->where('client_id', $user->id);
                } elseif ($user->role === 'sales') {
                    // Sales can only see requests they made (as requester)
                    $query->where('requested_by', $user->id);
                } elseif ($user->role === 'office') {
                    // Office can see requests they made or are assigned to
                    $query->where(function ($q) use ($user) {
                        $q->where('requested_by', $user->id)
                          ->orWhere('client_id', $user->id);
                    });
                }
                // Admin and manager can see all requests by default
            }

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('request_details', 'like', "%{$searchTerm}%")
                      ->orWhere('additional_notes', 'like', "%{$searchTerm}%")
                      ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                          $clientQuery->where('name', 'like', "%{$searchTerm}%")
                                     ->orWhere('email', 'like', "%{$searchTerm}%");
                      });
                });
            }

            $ledgers = $query->orderBy('request_date', 'desc')->get();

            // Add formatted dates and file information to each ledger
            $ledgers->transform(function ($ledger) {
                $ledger->formatted_request_date = $ledger->formatted_request_date;
                $ledger->formatted_uploaded_date = $ledger->formatted_uploaded_date;
                $ledger->request_date_human = $ledger->request_date_human;
                $ledger->uploaded_date_human = $ledger->uploaded_date_human;
                
                // Add file information
                if ($ledger->file_name) {
                    $ledger->file_size_formatted = $this->formatFileSize($ledger->file_size);
                    $ledger->file_extension = pathinfo($ledger->file_name, PATHINFO_EXTENSION);
                    $ledger->file_exists = Storage::disk('public')->exists($ledger->file_path);
                }
                
                return $ledger;
            });

            return response()->json([
                'success' => true,
                'data' => $ledgers,
                'message' => 'Ledger requests fetched successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching ledger requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new ledger request
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            // Validate request
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:users,id',
                'request_details' => 'required|string|max:1000',
                'additional_notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check permissions
            if (!in_array($user->role, ['client', 'sales'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only clients and sales can request ledgers'
                ], 403);
            }

            // Generate unique request ID
            $requestId = 'LED-' . strtoupper(Str::random(6));

            // Create ledger request
            $ledger = Ledger::create([
                'request_id' => $requestId,
                'client_id' => $request->client_id,
                'request_details' => $request->request_details,
                'additional_notes' => $request->additional_notes,
                'status' => Ledger::STATUS_PENDING,
                'request_date' => now(),
                'requested_by' => $user->id,
            ]);

            $ledger->load(['client', 'requester']);

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'Ledger request created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating ledger request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific ledger request
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $ledger = Ledger::with(['client', 'requester', 'uploader'])->find($id);

            if (!$ledger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request not found'
                ], 404);
            }

            // Check permissions based on role
            if ($user->role === 'client' && $ledger->client_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            } elseif ($user->role === 'sales' && $ledger->requested_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            } elseif ($user->role === 'office' && $ledger->requested_by !== $user->id && $ledger->client_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            // Add formatted dates
            $ledger->formatted_request_date = $ledger->formatted_request_date;
            $ledger->formatted_uploaded_date = $ledger->formatted_uploaded_date;
            $ledger->request_date_human = $ledger->request_date_human;
            $ledger->uploaded_date_human = $ledger->uploaded_date_human;

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'Ledger request fetched successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching ledger request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update ledger request status
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $ledger = Ledger::find($id);

            if (!$ledger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request not found'
                ], 404);
            }

            // Check permissions based on role
            if ($user->role === 'client' && $ledger->client_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            } elseif ($user->role === 'sales' && $ledger->requested_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            } elseif ($user->role === 'office' && $ledger->requested_by !== $user->id && $ledger->client_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,uploaded,confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check permissions based on status change
            if ($request->status === 'uploaded' && !in_array($user->role, ['admin', 'manager', 'office'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only admin, manager, or office can upload ledgers'
                ], 403);
            }

            if ($request->status === 'confirmed' && $user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only clients can confirm ledger receipt'
                ], 403);
            }

            // Update ledger
            $updateData = ['status' => $request->status];
            
            if ($request->status === 'uploaded') {
                $updateData['uploaded_date'] = now();
                $updateData['uploaded_by'] = $user->id;
            }

            $ledger->update($updateData);
            $ledger->load(['client', 'requester', 'uploader']);

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'Ledger request updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating ledger request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload ledger file
     */
    public function upload(Request $request, $id)
    {
        try {
            $user = $request->user();
            $ledger = Ledger::find($id);

            if (!$ledger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request not found'
                ], 404);
            }

            // Check permissions
            if (!in_array($user->role, ['admin', 'manager', 'office'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only admin, manager, or office can upload ledgers'
                ], 403);
            }

            // Check if ledger can be uploaded
            if (!$ledger->canBeUploaded()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request is not in pending status'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:pdf,xlsx,xls,csv|max:10240', // 10MB max
            ]);

            if ($validator->fails()) { 
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Store file
            $file = $request->file('file');
            $fileName = 'ledger_' . $ledger->request_id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('ledgers', $fileName, 'public');

            // Update ledger
            $ledger->update([
                'status' => Ledger::STATUS_UPLOADED,
                'uploaded_date' => now(),
                'uploaded_by' => $user->id,
                'file_path' => $filePath,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
            ]);

            $ledger->load(['client', 'requester', 'uploader']);

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'Ledger file uploaded successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error uploading ledger file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download ledger file
     */
    public function download(Request $request, $id)
    {
        try {
            $user = $request->user();
            \Log::info("Download request for ledger ID: $id by user: " . $user->id);
            
            $ledger = Ledger::find($id);

            if (!$ledger) {
                \Log::warning("Ledger not found for ID: $id");
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request not found'
                ], 404);
            }

            // Check permissions
            if ($user->role === 'client' && $ledger->client_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            // Check if file can be downloaded
            if (!$ledger->canBeDownloaded()) {
                \Log::warning("Ledger $id cannot be downloaded - status: " . $ledger->status);
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger file is not available for download'
                ], 400);
            }

            \Log::info("Ledger $id file path: " . $ledger->file_path);
            
            if (!Storage::disk('public')->exists($ledger->file_path)) {
                \Log::error("File not found on server: " . $ledger->file_path);
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger file not found on server'
                ], 404);
            }

            // Get file info
            $filePath = Storage::disk('public')->path($ledger->file_path);
            $fileSize = filesize($filePath);
            $mimeType = mime_content_type($filePath);

            // Return file download with proper headers
            return response()->download($filePath, $ledger->file_name, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Content-Disposition' => 'attachment; filename="' . $ledger->file_name . '"',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error downloading ledger file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete ledger request
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $ledger = Ledger::find($id);

            if (!$ledger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ledger request not found'
                ], 404);
            }

            // Check permissions
            if (!in_array($user->role, ['admin', 'manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only admin or manager can delete ledger requests'
                ], 403);
            }

            // Delete file if exists
            if ($ledger->file_path && Storage::disk('public')->exists($ledger->file_path)) {
                Storage::disk('public')->delete($ledger->file_path);
            }

            $ledger->delete();

        return response()->json([
            'success' => true,
                'message' => 'Ledger request deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting ledger request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format file size in human readable format
     */
    private function formatFileSize($bytes)
    {
        if ($bytes == 0) return '0 Bytes';
        
        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }
}