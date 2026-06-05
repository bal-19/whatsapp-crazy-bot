import { BarChart3, ContactRound, LayoutDashboard, MessageSquare, Settings2, ShieldCheck, Terminal, Users, UsersRound, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardPermission } from '@whatsapp-bot/shared';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center gap-2.5 lg:flex-1 lg:gap-2">
                            <motion.div
                                className={cn(
                                    iconBase,
                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                                    'group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/50',
                                    'group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                                )}
                                whileHover={{ rotate: 15 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                            </motion.div>
                            <span className="block truncate text-xs text-left font-medium">{item.label}</span>
                        </div>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <ChevronDown className="h-4 w-4 shrink-0 hidden lg:block flex-shrink-0" />
                        </motion.div>
                    </motion.button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="mb-1 space-y-1 lg:ml-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-3 overflow-hidden"
                            >
                                {item.children.map((child) => renderMenuItem(child, depth + 1))}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <motion.div
                            className={cn(
                                iconBase,
                                isActive
                                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                            )}
                            whileHover={{ rotate: 360 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
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
        <aside className="w-full shrink-0 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-50 backdrop-blur-sm sm:p-5 lg:h-[calc(100vh-132px)] lg:w-64 lg:max-w-64 lg:rounded-2xl lg:p-5 transition-colors overflow-hidden flex flex-col lg:flex-col lg:overflow-hidden">
            {/* Header */}
            <motion.div
                className="hidden rounded-xl border border-emerald-100/70 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 lg:block lg:flex-shrink-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
                <div className="flex items-center gap-2.5">
                    <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                        <BrandMark className="h-10 w-10 rounded-lg" />
                    </motion.div>
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
                className="soft-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 lg:mx-0 lg:mt-5 lg:block lg:overflow-y-auto lg:flex-1 lg:px-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                {visibleItems.map((item) => renderMenuItem(item))}
            </motion.nav>

            {/* Footer Note */}
            <motion.div
                className="mt-4 hidden rounded-lg border border-emerald-100 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 lg:block lg:flex-shrink-0 w-full overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
            >
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">Note</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 break-words">
                    Visual dashboard yang clean dan modern dengan fokus pada usability.
                </p>
            </motion.div>
        </aside>
    );
}
