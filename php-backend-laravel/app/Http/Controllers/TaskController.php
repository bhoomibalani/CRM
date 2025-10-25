<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    // Get all tasks (admin, office, sales, client)
    public function index(Request $request)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        \Log::info('TaskController index called', [
            'authUser' => $authUser ? $authUser->toArray() : null,
        ]);

        if (!$authUser || !in_array($authUser->role, ['admin', 'office', 'sales', 'client'])) {
            \Log::warning('Access denied for index', [
                'authUser' => $authUser ? $authUser->toArray() : null
            ]);
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $tasks = Task::with(['creator', 'assignee'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'due_date' => $task->due_date ? $task->due_date->format('Y-m-d') : null,
                    'assigned_to' => $task->assigned_to_name,
                    'created_by' => $task->creator ? $task->creator->name : 'Unknown',
                    'created_at' => $task->created_at->format('Y-m-d H:i:s'),
                ];
            });

        \Log::info('Tasks fetched successfully', ['count' => $tasks->count()]);

        return response()->json([
            'success' => true,
            'tasks' => $tasks,
        ]);
    }

    // Get users for assignment dropdown (admin, office)
    public function getUsers(Request $request)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }
        
        \Log::info('TaskController getUsers called', [
            'authUser' => $authUser ? $authUser->toArray() : null,
            'userRole' => $authUser ? $authUser->role : null,
            'headers' => $request->headers->all()
        ]);

        if (!$authUser || !in_array($authUser->role, ['admin', 'office'])) {
            \Log::warning('Access denied for getUsers', [
                'authUser' => $authUser ? $authUser->toArray() : null
            ]);
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $users = \App\Models\User::select('name', 'email', 'role')
            ->whereIn('role', ['admin', 'office', 'sales', 'client'])
            ->orderBy('name')
            ->get();

        \Log::info('Users fetched successfully', ['count' => $users->count()]);

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    // Create task (admin, office)
    public function store(Request $request)
    {
        $authUser = $request->user();
        
        // Use the guard user if request user is null
        if (!$authUser) {
            $authUser = \Auth::guard('sanctum')->user();
        }

        if (!$authUser || !in_array($authUser->role, ['admin', 'office'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:pending,done,completed'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'due_date' => ['nullable', 'date'],
            'assigned_to_name' => ['nullable', 'string', 'exists:users,name'],
        ]);

        $task = Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'priority' => $validated['priority'] ?? 'low',
            'due_date' => $validated['due_date'] ?? null,
            'assigned_to_name' => $validated['assigned_to_name'] ?? null,
            'created_by' => $authUser->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'task' => $task,
        ], 201);
    }
}


