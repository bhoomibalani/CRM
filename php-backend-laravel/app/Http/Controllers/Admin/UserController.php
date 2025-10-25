<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
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
        
        if (! $authUser || !in_array($authUser->role, ['admin', 'manager', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => 'active', // Default status for now
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('User creation request received', [
                'request_data' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            $authUser = $request->user();
            
            // Use the guard user if request user is null
            if (!$authUser) {
                $authUser = \Auth::guard('sanctum')->user();
            }
            
            \Log::info('Authenticated user', [
                'user_id' => $authUser ? $authUser->id : null,
                'user_role' => $authUser ? $authUser->role : null
            ]);

            if (! $authUser || !in_array($authUser->role, ['admin', 'manager', 'office'])) {
                \Log::warning('Unauthorized user creation attempt', [
                    'user_id' => $authUser ? $authUser->id : null,
                    'user_role' => $authUser ? $authUser->role : null
                ]);
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', Password::min(8)],
                // Align roles with frontend options and seeders
                'role' => ['required', 'in:admin,manager,sales,office,client'],
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
            ]);

            \Log::info('User created successfully', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in user creation', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating user', [
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

    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        if (! $authUser || !in_array($authUser->role, ['admin', 'manager', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        // Prevent admin from deleting themselves
        if ($user->id === $authUser->id) {
            return response()->json(['success' => false, 'message' => 'Cannot delete your own account'], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}


