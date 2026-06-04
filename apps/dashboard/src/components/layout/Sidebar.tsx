import { BarChart3, ContactRound, LayoutDashboard, MessageSquare, Settings2, Terminal } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/conversations', label: 'Percakapan', icon: MessageSquare },
    { to: '/contacts', label: 'Contacts', icon: ContactRound },
    { to: '/config', label: 'Konfigurasi', icon: Settings2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/logs', label: 'Log Sistem', icon: Terminal }
];

export function Sidebar() {
    return (
        <aside className="h-[calc(100vh-64px)] w-16 shrink-0 border-r bg-slate-950 p-3 text-white lg:w-60 dark:bg-slate-950">
            <nav className="space-y-1">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center justify-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:justify-start',
                                isActive && 'bg-slate-800 text-white'
                            )
                        }
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="hidden lg:inline">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
