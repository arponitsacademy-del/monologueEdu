<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminRoleController extends Controller
{
    public function __construct()
    {
        Role::ensureSchema();
    }

    /**
     * List all custom roles with assigned users count.
     */
    public function index(): JsonResponse
    {
        Role::ensureSchema();

        $roles = Role::withCount('users')
            ->latest('id')
            ->get();

        return response()->json([
            'roles' => $roles,
            'permission_catalog' => Role::permissionCatalog(),
        ]);
    }

    /**
     * Get permission catalog matrix grouped by modules.
     */
    public function permissionCatalog(): JsonResponse
    {
        return response()->json([
            'catalog' => Role::permissionCatalog(),
        ]);
    }

    /**
     * Create a new custom role.
     */
    public function store(Request $request): JsonResponse
    {
        Role::ensureSchema();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:roles,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ], [
            'name.required' => 'রোলের নাম প্রদান করুন (যেমন: লাইব্রেরিয়ান, কোর্স ম্যানেজার)।',
            'permissions.required' => 'অন্তত একটি পারমিশন নির্বাচন করুন।',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        // Check unique slug fallback
        $originalSlug = $slug;
        $counter = 1;
        while (Role::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $role = Role::create([
            'name' => trim($validated['name']),
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'permissions' => array_values(array_unique($validated['permissions'])),
            'is_system' => false,
        ]);

        AuditLog::log('role_created', 'Role', $role->id, null, [
            'name' => $role->name,
            'slug' => $role->slug,
            'permissions_count' => count($role->permissions ?? []),
        ]);

        return response()->json([
            'message' => "কাস্টম রোল '{$role->name}' সফলভাবে তৈরি হয়েছে।",
            'role' => $role->loadCount('users'),
        ], 201);
    }

    /**
     * Get single role details.
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'role' => $role->loadCount('users'),
            'users' => $role->users()->select('id', 'name', 'email', 'phone', 'role', 'status')->get(),
        ]);
    }

    /**
     * Update custom role and its permissions.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        Role::ensureSchema();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:roles,slug,' . $role->id],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ]);

        $oldData = [
            'name' => $role->name,
            'permissions' => $role->permissions,
        ];

        $role->update([
            'name' => trim($validated['name']),
            'slug' => ! empty($validated['slug']) ? Str::slug($validated['slug']) : $role->slug,
            'description' => $validated['description'] ?? null,
            'permissions' => array_values(array_unique($validated['permissions'])),
        ]);

        AuditLog::log('role_updated', 'Role', $role->id, $oldData, [
            'name' => $role->name,
            'permissions_count' => count($role->permissions ?? []),
        ]);

        return response()->json([
            'message' => "রোল '{$role->name}' সফলভাবে আপডেট করা হয়েছে।",
            'role' => $role->fresh()->loadCount('users'),
        ]);
    }

    /**
     * Delete custom role.
     */
    public function destroy(Role $role): JsonResponse
    {
        $assignedUsersCount = $role->users()->count();

        if ($assignedUsersCount > 0) {
            return response()->json([
                'message' => "এই রোলে বর্তমানে {$assignedUsersCount} জন ইউজার নিয়োজিত রয়েছে। ডিলিট করার আগে তাদের রোল পরিবর্তন করুন।",
            ], 422);
        }

        $roleName = $role->name;
        $role->delete();

        AuditLog::log('role_deleted', 'Role', $role->id, ['name' => $roleName], null);

        return response()->json([
            'message' => "কাস্টম রোল '{$roleName}' সফলভাবে মুছে ফেলা হয়েছে।",
        ]);
    }
}
