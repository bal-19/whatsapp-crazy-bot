import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";

interface JwtPayload {
    sub: string; // User ID (UUID)
    username: string; // Username for debugging
    role: "admin";
}

/**
 * Verify login credentials against admin_users table in database
 * Supports bcrypt-hashed passwords for security
 *
 * @param username - Admin username
 * @param password - Plain text password to verify
 * @returns User ID if credentials are valid, null otherwise
 */
export async function verifyLogin(
    username: string,
    password: string,
): Promise<string | null> {
    try {
        if (!supabaseAdmin) {
            const fallbackMatch =
                username === env.DASHBOARD_USERNAME &&
                password === env.DASHBOARD_PASSWORD;
            return fallbackMatch ? "local-admin" : null;
        }

        const { data: user, error } = await supabaseAdmin
            .from("admin_users")
            .select("id, password_hash, is_active")
            .eq("username", username)
            .single();

        if (error || !user) {
            // User not found
            return null;
        }

        if (!user.is_active) {
            // User account is disabled
            return null;
        }

        // Verify password hash (bcrypt comparison)
        const isValid = await bcrypt.compare(password, user.password_hash);
        return isValid ? user.id : null;
    } catch (err) {
        // Log error but don't expose details
        console.error("[AUTH] Login verification error:", err);
        return null;
    }
}

/**
 * Hash password for secure storage
 * Used when creating or updating admin users
 *
 * @param password - Plain text password
 * @param rounds - Bcrypt rounds (default: 10)
 * @returns Bcrypt hashed password
 */
export async function hashPassword(
    password: string,
    rounds = 10,
): Promise<string> {
    return bcrypt.hash(password, rounds);
}

/**
 * Create JWT token for authenticated admin user
 * @param userId - User ID (UUID)
 * @param username - Username for reference
 * @returns JWT token (valid for 12 hours)
 */
export function signToken(userId: string, username: string): string {
    const payload: JwtPayload = { sub: userId, username, role: "admin" };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "12h" });
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
        ? header.slice("Bearer ".length)
        : null;

    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        jwt.verify(token, env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Unauthorized" });
    }
}
