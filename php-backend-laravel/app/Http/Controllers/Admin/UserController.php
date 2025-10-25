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
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        if (! $authUser || !in_array($authUser->role, ['admin', 'manager', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            // Align roles with frontend options and seeders
            'role' => ['required', 'in:admin,manager,sales,office,client'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

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


