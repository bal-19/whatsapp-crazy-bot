import type { Request } from "express";
import { getCurrentAuthUser } from "../auth/jwt.js";
import { logService } from "./logService.js";

export async function writeAdminAuditLog(
    req: Request,
    event: string,
    meta?: Record<string, unknown>,
): Promise<void> {
    const user = await getCurrentAuthUser(req);

    logService.write("info", event, {
        actorUserId: user?.id ?? null,
        actorUsername: user?.username ?? null,
        actorRoleName: user?.role_name ?? null,
        requestPath: req.path,
        requestMethod: req.method,
        ...(meta ?? {}),
    });
}
