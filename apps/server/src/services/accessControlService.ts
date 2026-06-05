import type {
    AuthUser,
    CreateRoleRequest,
    CreateUserRequest,
    DashboardPermission,
    Role,
    UpdateRoleRequest,
    UpdateUserRequest,
    User,
} from "@whatsapp-bot/shared";
import { supabaseAdmin } from "../lib/supabase.js";
import { hashPassword } from "../auth/password.js";

interface RoleRow {
    id: string;
    name: string;
    permissions: DashboardPermission[] | null;
    created_at: string;
    updated_at: string;
}

interface UserRow {
    id: string;
    username: string;
    password_hash?: string;
    email?: string | null;
    is_active: boolean;
    role_id: string | null;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
    roles?: RoleRow | RoleRow[] | null;
}

export async function listRoles(): Promise<Role[]> {
    assertSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
        .from("roles")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to list roles: ${error.message}`);
    return ((data ?? []) as unknown as RoleRow[]).map(mapRoleRow);
}

export async function createRole(input: CreateRoleRequest): Promise<Role> {
    assertSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
        .from("roles")
        .insert({
            name: input.name.trim(),
            permissions: input.permissions,
        })
        .select("*")
        .single();

    if (error) throw new Error(`Failed to create role: ${error.message}`);
    return mapRoleRow(data as RoleRow);
}

export async function updateRole(
    roleId: string,
    input: UpdateRoleRequest,
): Promise<Role> {
    assertSupabaseAdmin();
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.permissions !== undefined) payload.permissions = input.permissions;

    const { data, error } = await supabaseAdmin!
        .from("roles")
        .update(payload)
        .eq("id", roleId)
        .select("*")
        .single();

    if (error) throw new Error(`Failed to update role: ${error.message}`);
    return mapRoleRow(data as RoleRow);
}

export async function deleteRole(roleId: string): Promise<void> {
    assertSupabaseAdmin();
    const { error } = await supabaseAdmin!
        .from("roles")
        .delete()
        .eq("id", roleId);

    if (error) throw new Error(`Failed to delete role: ${error.message}`);
}

export async function listUsers(): Promise<User[]> {
    assertSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
        .from("users")
        .select("id, username, email, is_active, role_id, last_login_at, created_at, updated_at, roles(*)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to list users: ${error.message}`);
    return ((data ?? []) as unknown as UserRow[]).map(mapUserRow);
}

export async function createUser(input: CreateUserRequest): Promise<User> {
    assertSupabaseAdmin();
    const passwordHash = await hashPassword(input.password);

    const { data, error } = await supabaseAdmin!
        .from("users")
        .insert({
            username: input.username.trim(),
            password_hash: passwordHash,
            email: input.email ?? null,
            role_id: input.role_id ?? null,
            is_active: input.is_active ?? true,
        })
        .select("id, username, email, is_active, role_id, last_login_at, created_at, updated_at, roles(*)")
        .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return mapUserRow(data as unknown as UserRow);
}

export async function updateUser(
    userId: string,
    input: UpdateUserRequest,
): Promise<User> {
    assertSupabaseAdmin();
    const payload: Record<string, unknown> = {};

    if (input.password) {
        payload.password_hash = await hashPassword(input.password);
    }
    if (input.email !== undefined) payload.email = input.email;
    if (input.role_id !== undefined) payload.role_id = input.role_id;
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const { data, error } = await supabaseAdmin!
        .from("users")
        .update(payload)
        .eq("id", userId)
        .select("id, username, email, is_active, role_id, last_login_at, created_at, updated_at, roles(*)")
        .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return mapUserRow(data as unknown as UserRow);
}

export async function deleteUser(userId: string): Promise<void> {
    assertSupabaseAdmin();
    const { error } = await supabaseAdmin!.from("users").delete().eq("id", userId);
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
}

export async function getAuthUserById(userId: string): Promise<AuthUser | null> {
    assertSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
        .from("users")
        .select("id, username, role_id, roles(*)")
        .eq("id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch auth user: ${error.message}`);
    if (!data) return null;

    const row = data as unknown as UserRow;
    const role = extractRole(row.roles);
    return {
        id: row.id,
        username: row.username,
        role_name: role?.name ?? null,
        permissions: role?.permissions ?? [],
    };
}

export async function verifyUserCredentials(
    username: string,
): Promise<{
    id: string;
    passwordHash: string;
    isActive: boolean;
    roleName: string | null;
    permissions: DashboardPermission[];
} | null> {
    assertSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
        .from("users")
        .select("id, password_hash, is_active, roles(*)")
        .eq("username", username)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch user credentials: ${error.message}`);
    if (!data) return null;

    const row = data as unknown as UserRow;
    const role = extractRole(row.roles);
    return {
        id: row.id,
        passwordHash: row.password_hash ?? "",
        isActive: row.is_active,
        roleName: role?.name ?? null,
        permissions: role?.permissions ?? [],
    };
}

export async function updateLastLoginAt(userId: string): Promise<void> {
    if (!supabaseAdmin) return;
    const { error } = await supabaseAdmin!
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);

    if (error) throw new Error(`Failed to update last_login_at: ${error.message}`);
}

function mapRoleRow(row: RoleRow): Role {
    return {
        id: row.id,
        name: row.name,
        permissions: row.permissions ?? [],
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapUserRow(row: UserRow): User {
    const role = extractRole(row.roles);
    return {
        id: row.id,
        username: row.username,
        email: row.email ?? null,
        is_active: row.is_active,
        role_id: row.role_id,
        role_name: role?.name ?? null,
        permissions: role?.permissions ?? [],
        last_login_at: row.last_login_at ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function extractRole(value: UserRow["roles"]): RoleRow | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
}

function assertSupabaseAdmin(): void {
    if (!supabaseAdmin) {
        throw new Error("Supabase admin client is not initialized");
    }
}
