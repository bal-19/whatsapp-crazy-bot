import { BarChart3, ContactRound, LayoutDashboard, MessageSquare, Settings2, Terminal, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/conversations', label: 'Percakapan', icon: MessageSquare },
    { to: '/contacts', label: 'Contacts', icon: ContactRound },
    { to: '/groups', label: 'Groups', icon: UsersRound },
    { to: '/config', label: 'Konfigurasi', icon: Settings2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/logs', label: 'Log Sistem', icon: Terminal }
];

export function Sidebar() {
    return (
        <aside className="w-full shrink-0 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-50 backdrop-blur-sm sm:p-5 lg:h-[calc(100vh-132px)] lg:w-64 lg:rounded-2xl lg:p-5 transition-colors">
            <div className="hidden rounded-xl border border-emerald-100/70 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 lg:block">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 dark:bg-white text-xs font-bold text-white dark:text-slate-950 shadow-sm">
                        WA
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Control</p>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">WhatsApp AI</h2>
                    </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Dashboard untuk memantau percakapan, analytics, dan konfigurasi bot.
                </p>
            </div>

            <nav className="soft-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 lg:mx-0 lg:mt-5 lg:block lg:space-y-2 lg:overflow-visible lg:px-0">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                    >
                        {({ isActive }) => (
                            <div
                                className={cn(
                                    'group flex min-w-[80px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-center text-xs font-medium transition-all sm:min-w-[90px] sm:text-xs lg:min-w-0 lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-2.5',
                                    isActive
                                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-slate-50'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block truncate text-xs">{item.label}</span>
                                </div>
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-4 hidden rounded-lg border border-emerald-100 dark:border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 lg:block lg:mt-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Note</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Visual dashboard yang clean dan modern dengan fokus pada usability.
                </p>
            </div>
        </aside>
    );
}
