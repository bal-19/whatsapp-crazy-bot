import { LogOut, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '@/stores/botStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge, Button, ThemeToggle } from '@/components/ui';
import { formatDuration } from '@/lib/utils';

export function Topbar() {
    const navigate = useNavigate();
    const { status, uptimeSeconds, restartBot } = useBotStore();
    const { logout, hasPermission } = useAuthStore();
    const canManageBot = hasPermission('bot.manage');
    const canManageConfig = hasPermission('config.manage');

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <header className="sticky top-0 z-30 border-b border-white/30 bg-white/85 dark:border-slate-700/50 dark:bg-slate-950/85 backdrop-blur-xl transition-all">
            <div className="mx-auto flex h-20 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-5 lg:px-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 dark:bg-white text-sm font-bold text-white dark:text-slate-950 shadow-sm">
                        WA
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Operations</p>
                        <p className="truncate text-base font-bold text-foreground">WhatsApp AI Bot</p>
                    </div>
                </div>

                <div className="hidden items-center gap-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-950/70 px-4 py-2 shadow-sm xl:flex">
                    <StatusBadge status={status} />
                    <div className="h-8 w-px bg-border/40" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Uptime</p>
                        <p className="text-sm font-semibold text-foreground">{formatDuration(uptimeSeconds)}</p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <ThemeToggle />
                    {canManageBot ? (
                        <Button variant="outline" size="icon" aria-label="Restart bot" onClick={() => void restartBot()} className="rounded-lg h-10 w-10 bg-white/80 dark:bg-slate-900">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    ) : null}
                    {canManageConfig ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Buka konfigurasi"
                            onClick={() => navigate('/config')}
                            className="rounded-lg h-10 w-10"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" aria-label="Keluar" onClick={handleLogout} className="rounded-lg h-10 w-10">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
