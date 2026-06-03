import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useBotStore } from '@/stores/botStore';
import { socket } from '@/lib/socket';

export function AppShell() {
    const { loadStatus, loadAnalytics } = useBotStore();

    useEffect(() => {
        void loadStatus();
        void loadAnalytics();
        socket.connect();
        const interval = window.setInterval(() => void loadStatus(), 30_000);
        return () => {
            window.clearInterval(interval);
            socket.disconnect();
        };
    }, [loadAnalytics, loadStatus]);

    return (
        <div className="min-h-screen bg-background">
            <Topbar />
            <div className="flex">
                <Sidebar />
                <main className="h-[calc(100vh-64px)] flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
