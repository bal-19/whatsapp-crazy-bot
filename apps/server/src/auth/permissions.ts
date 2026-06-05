import type { DashboardPermission } from "@whatsapp-bot/shared";

export const DASHBOARD_PERMISSIONS: DashboardPermission[] = [
    "dashboard.view",
    "conversations.view",
    "contacts.manage",
    "groups.manage",
    "config.manage",
    "analytics.view",
    "logs.view",
    "users.manage",
    "roles.manage",
    "bot.manage",
    "maintenance.manage",
];

export function hasPermission(
    permissions: DashboardPermission[],
    required: DashboardPermission,
): boolean {
    return permissions.includes("*") || permissions.includes(required);
}

export function hasAnyPermission(
    permissions: DashboardPermission[],
    required: DashboardPermission[],
): boolean {
    return required.some((permission) => hasPermission(permissions, permission));
}
