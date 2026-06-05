import { BarChart3, ContactRound, LayoutDashboard, MessageSquare, Settings2, ShieldCheck, Terminal, Users, UsersRound, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardPermission } from '@whatsapp-bot/shared';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { entranceTransition, hoverTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { BrandMark } from './BrandMark';

interface MenuItem {
    to?: string;
    label: string;
    icon: LucideIcon;
    permission: DashboardPermission;
    children?: MenuItem[];
}

const items: MenuItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { to: '/conversations', label: 'Percakapan', icon: MessageSquare, permission: 'conversations.view' },
    {
        label: 'Management',
        icon: ContactRound,
        permission: 'contacts.manage',
        children: [
            { to: '/contacts', label: 'Contacts', icon: ContactRound, permission: 'contacts.manage' },
            { to: '/groups', label: 'Groups', icon: UsersRound, permission: 'groups.manage' }
        ]
    },
    { to: '/config', label: 'Konfigurasi', icon: Settings2, permission: 'config.manage' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.view' },
    { to: '/logs', label: 'Log Sistem', icon: Terminal, permission: 'logs.view' },
    {
        label: 'Access Control',
        icon: ShieldCheck,
        permission: 'users.manage',
        children: [
            { to: '/users', label: 'Users', icon: Users, permission: 'users.manage' },
            { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles.manage' }
        ]
    }
];

export function Sidebar() {
    const hasPermission = useAuthStore((state) => state.hasPermission);
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

    const visibleItems = items.filter((item) => hasPermission(item.permission));

    // Flatten menu items for mobile - include children as separate items
    const flattenedItems = visibleItems.reduce<MenuItem[]>((acc, item) => {
        if (item.children) {
            // Add all children that user has permission for
            const visibleChildren = item.children.filter((child) => hasPermission(child.permission));
            return [...acc, ...visibleChildren];
        }
        // Add regular items
        return [...acc, item];
    }, []);

    const toggleMenu = (label: string) => {
        setExpandedMenus((prev) => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    const menuItemBase =
        'group flex min-w-[80px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-center text-xs font-medium transition-all sm:min-w-[90px] sm:text-xs lg:min-w-0 lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-2';

    const iconBase =
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors';

    const renderMenuItem = (item: MenuItem, depth: number = 0): React.ReactNode => {
        if (!hasPermission(item.permission)) return null;

        if (item.children) {
            const isExpanded = expandedMenus.has(item.label);
            return (
                <div key={item.label} className="mb-1">
                    <motion.button
                        type="button"
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                            menuItemBase,
                            'w-full lg:justify-between',
                            'text-slate-600 dark:text-slate-400',
                            'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40',
                            'hover:text-slate-900 dark:hover:text-slate-50'
                        )}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={entranceTransition}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                    >
                        <div className="flex items-center gap-2.5 lg:flex-1 lg:gap-2">
                            <div
                                className={cn(
                                    iconBase,
                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                                    'group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/50',
                                    'group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                            </div>
                            <span className="block truncate text-xs text-left font-medium">{item.label}</span>
                        </div>
                        <div
                            className={cn(
                                'transition-transform duration-150 ease-out',
                                isExpanded && 'rotate-180'
                            )}
                        >
                            <ChevronDown className="h-4 w-4 shrink-0 hidden lg:block flex-shrink-0" />
                        </div>
                    </motion.button>

                    {isExpanded ? (
                        <motion.div
                            className="mb-1 space-y-1 overflow-hidden lg:ml-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-3"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={entranceTransition}
                        >
                            {item.children.map((child) => renderMenuItem(child, depth + 1))}
                        </motion.div>
                    ) : null}
                </div>
            );
        }

        return (
            <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === '/'}
                className="mb-1 block"
            >
                {({ isActive }) => (
                    <motion.div
                        className={cn(
                            menuItemBase,
                            isActive
                                ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-slate-50'
                        )}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={entranceTransition}
                        whileHover={{ x: 3, scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                    >
                        <motion.div
                            className={cn(
                                iconBase,
                                isActive
                                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                            )}
                            whileHover={{ scale: 1.04 }}
                            transition={hoverTransition}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                        </motion.div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs">{item.label}</span>
                        </div>
                    </motion.div>
                )}
            </NavLink>
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-full shrink-0 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-50 backdrop-blur-sm sm:p-5 lg:h-[calc(100vh-132px)] lg:w-64 lg:max-w-64 lg:rounded-2xl lg:p-5 transition-colors overflow-hidden flex-col lg:overflow-hidden">
                {/* Header */}
                <motion.div
                    className="rounded-xl border border-emerald-100/70 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 flex-shrink-0"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={entranceTransition}
                >
                    <div className="flex items-center gap-2.5">
                        <div>
                            <BrandMark className="h-10 w-10 rounded-lg" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Control</p>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">WhatsApp AI</h2>
                        </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        Dashboard untuk memantau percakapan, analytics, dan konfigurasi bot.
                    </p>
                </motion.div>

                {/* Navigation */}
                <motion.nav
                    className="soft-scrollbar mx-0 mt-5 block overflow-y-auto flex-1 px-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={entranceTransition}
                >
                    {visibleItems.map((item) => renderMenuItem(item))}
                </motion.nav>

                {/* Footer Note */}
                <motion.div
                    className="mt-4 rounded-lg border border-emerald-100 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 flex-shrink-0 w-full overflow-hidden"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={entranceTransition}
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">Note</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 break-words">
                        Visual dashboard yang clean dan modern dengan fokus pada usability.
                    </p>
                </motion.div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <motion.nav
                className="fixed bottom-3 left-0 right-0 z-50 lg:hidden flex justify-center items-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={entranceTransition}
            >
                <div className="flex items-center justify-center gap-1.5 rounded-full border border-slate-800/50 dark:border-slate-700/50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl px-3 py-2.5 shadow-2xl">
                    {flattenedItems.map((item) => {
                        if (!item.to) return null;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                            >
                                {({ isActive }) => (
                                    <motion.div
                                        className={cn(
                                            'relative flex h-10 w-10 items-center justify-center rounded-full transition-all',
                                            isActive
                                                ? 'bg-white dark:bg-white shadow-lg'
                                                : 'bg-transparent'
                                        )}
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <item.icon
                                            className={cn(
                                                'h-[18px] w-[18px] transition-colors',
                                                isActive
                                                    ? 'text-slate-900 dark:text-slate-900'
                                                    : 'text-slate-400 dark:text-slate-500'
                                            )}
                                        />
                                    </motion.div>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </motion.nav>
        </>
    );
}
