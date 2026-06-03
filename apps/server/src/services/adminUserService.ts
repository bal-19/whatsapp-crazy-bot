/**
 * Admin User Service
 * Handles CRUD operations for admin users stored in Supabase
 */

import { supabaseAdmin } from "../lib/supabase.js";
import { hashPassword } from "../auth/jwt.js";

export interface AdminUser {
    id: string;
    username: string;
    email?: string;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAdminUserInput {
    username: string;
    password: string;
    email?: string;
}

export interface UpdateAdminUserInput {
    password?: string;
    email?: string;
    is_active?: boolean;
}

/**
 * Create a new admin user
 * @param input - User creation data
 * @returns Created admin user (without password hash)
 */
export async function createAdminUser(
    input: CreateAdminUserInput,
): Promise<AdminUser> {
    const passwordHash = await hashPassword(input.password);

    const { data, error } = await supabaseAdmin
        .from("admin_users")
        .insert({
            username: input.username,
            password_hash: passwordHash,
            email: input.email,
        })
        .select(
            "id, username, email, is_active, last_login_at, created_at, updated_at",
        )
        .single();

    if (error) throw new Error(`Failed to create admin user: ${error.message}`);
    return data;
}

/**
 * Get admin user by username
 * @param username - Username to lookup
 * @returns Admin user data (without password hash)
 */
export async function getAdminUserByUsername(
    username: string,
): Promise<AdminUser | null> {
    const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select(
            "id, username, email, is_active, last_login_at, created_at, updated_at",
        )
        .eq("username", username)
        .single();

    if (error && error.code === "PGRST116") {
        // Not found
        return null;
    }

    if (error) throw new Error(`Failed to fetch admin user: ${error.message}`);
    return data || null;
}

/**
 * Update admin user (e.g., change password)
 * @param userId - User ID to update
 * @param input - Update data
 * @returns Updated admin user (without password hash)
 */
export async function updateAdminUser(
    userId: string,
    input: UpdateAdminUserInput,
): Promise<AdminUser> {
    const updates: Record<string, any> = {};

    if (input.password) {
        updates.password_hash = await hashPassword(input.password);
    }

    if (input.email !== undefined) {
        updates.email = input.email;
    }

    if (input.is_active !== undefined) {
        updates.is_active = input.is_active;
    }

    const { data, error } = await supabaseAdmin
        .from("admin_users")
        .update(updates)
        .eq("id", userId)
        .select(
            "id, username, email, is_active, last_login_at, created_at, updated_at",
        )
        .single();

    if (error) throw new Error(`Failed to update admin user: ${error.message}`);
    return data;
}

/**
 * Delete admin user by ID
 * @param userId - User ID to delete
 */
export async function deleteAdminUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("admin_users")
        .delete()
        .eq("id", userId);

    if (error) throw new Error(`Failed to delete admin user: ${error.message}`);
}

/**
 * List all admin users
 * @returns Array of admin users (without password hashes)
 */
export async function listAdminUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select(
            "id, username, email, is_active, last_login_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to list admin users: ${error.message}`);
    return data || [];
}

/**
 * Update last_login_at for an admin user
 * Called after successful login
 * @param userId - User ID to update
 */
export async function updateLastLoginAt(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);

    if (error)
        throw new Error(`Failed to update last_login_at: ${error.message}`);
}
