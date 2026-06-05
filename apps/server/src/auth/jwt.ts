import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser, DashboardPermission } from "@whatsapp-bot/shared";
import { env } from "../config/env.js";
import {
    getAuthUserById,
    verifyUserCredentials,
} from "../services/accessControlService.js";
import { hasAnyPermission } from "./permissions.js";
import { hashPassword, verifyPassword } from "./password.js";

export interface JwtPayload {
    sub: string; // User ID (UUID)
    username: string; // Username for debugging
    roleName: string | null;
    permissions: DashboardPermission[];
}

export interface AuthenticatedRequest extends Request {
    auth?: JwtPayload;
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
): Promise<AuthUser | null> {
    try {
        if (env.SUPABASE_URL === "" || env.SUPABASE_SERVICE_ROLE_KEY === "") {
            const fallbackMatch =
                username === env.DASHBOARD_USERNAME &&
                password === env.DASHBOARD_PASSWORD;
            return fallbackMatch
                ? {
                      id: "local-admin",
                      username,
                      role_name: "Admin",
                      permissions: ["*"],
                  }
                : null;
        }

        const user = await verifyUserCredentials(username);
        if (!user || !user.isActive) {
            return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
            id: user.id,
            username,
            role_name: user.roleName,
            permissions: user.permissions,
        };
    } catch (err) {
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
/**
 * Create JWT token for authenticated admin user
 * @param userId - User ID (UUID)
 * @param username - Username for reference
 * @returns JWT token (valid for 12 hours)
 */
export function signToken(user: AuthUser): string {
    const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        roleName: user.role_name,
        permissions: user.permissions,
    };
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
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        (req as AuthenticatedRequest).auth = payload;
        next();
    } catch {
        res.status(401).json({ message: "Unauthorized" });
    }
}

export function requirePermission(...permissions: DashboardPermission[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const auth = (req as AuthenticatedRequest).auth;
        if (!auth) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (hasAnyPermission(auth.permissions, permissions)) {
            next();
            return;
        }

        res.status(403).json({ message: "Forbidden" });
    };
}

export async function getCurrentAuthUser(
    req: Request,
): Promise<AuthUser | null> {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) return null;

    if (auth.sub === "local-admin") {
        return {
            id: auth.sub,
            username: auth.username,
            role_name: auth.roleName,
            permissions: auth.permissions,
        };
    }

    const dbUser = await getAuthUserById(auth.sub);
    return (
        dbUser ?? {
            id: auth.sub,
            username: auth.username,
            role_name: auth.roleName,
            permissions: auth.permissions,
        }
    );
}
