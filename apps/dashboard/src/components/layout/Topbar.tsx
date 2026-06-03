import { LogOut, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '../../stores/botStore';
import { StatusBadge } from '../ui';
import { Button } from '../ui';
import { formatDuration } from '../../lib/utils';

export function Topbar() {
    const navigate = useNavigate();
    const { status, uptimeSeconds, restartBot } = useBotStore();

    function handleLogout() {
        localStorage.removeItem('auth_token');
        navigate('/login');
    }

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">WA</div>
                <div>
                    <p className="text-sm font-semibold text-foreground">WhatsApp AI Bot</p>
                    <p className="text-xs text-muted-foreground">Uptime {formatDuration(uptimeSeconds)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <StatusBadge status={status} />
                <Button variant="outline" size="icon" aria-label="Restart bot" onClick={() => void restartBot()}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Buka konfigurasi" onClick={() => navigate('/config')}>
                    <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Keluar" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
