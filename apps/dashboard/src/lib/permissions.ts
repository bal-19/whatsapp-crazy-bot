import type { DashboardPermission } from '@whatsapp-bot/shared';

export interface DashboardNavItem {
  to: string;
  label: string;
  permission: DashboardPermission;
}

export const dashboardPermissions: DashboardPermission[] = [
  'dashboard.view',
  'conversations.view',
  'contacts.manage',
  'groups.manage',
  'config.manage',
  'analytics.view',
  'logs.view',
  'users.manage',
  'roles.manage',
  'bot.manage',
  'maintenance.manage',
];

export function canAccessPermission(permissions: DashboardPermission[], permission: DashboardPermission): boolean {
  return permissions.includes('*') || permissions.includes(permission);
}

export function firstAccessibleRoute(permissions: DashboardPermission[]): string {
  const entries: Array<{ to: string; permission: DashboardPermission }> = [
    { to: '/', permission: 'dashboard.view' },
    { to: '/conversations', permission: 'conversations.view' },
    { to: '/contacts', permission: 'contacts.manage' },
    { to: '/groups', permission: 'groups.manage' },
    { to: '/config', permission: 'config.manage' },
    { to: '/analytics', permission: 'analytics.view' },
    { to: '/logs', permission: 'logs.view' },
    { to: '/users', permission: 'users.manage' },
    { to: '/roles', permission: 'roles.manage' },
  ];

  return entries.find((entry) => canAccessPermission(permissions, entry.permission))?.to ?? '/login';
}
