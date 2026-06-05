import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useBotStore } from '@/stores/botStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { socket } from '@/lib/socket';

export function AppShell() {
    const { loadStatus, loadAnalytics } = useBotStore();
    const { theme } = useUIStore();
    const hasPermission = useAuthStore((state) => state.hasPermission);

    useEffect(() => {
        if (hasPermission('dashboard.view') || hasPermission('bot.manage')) {
            void loadStatus();
        }
        if (hasPermission('dashboard.view') || hasPermission('analytics.view')) {
            void loadAnalytics();
        }
        socket.connect();
        const interval = window.setInterval(() => {
            if (hasPermission('dashboard.view') || hasPermission('bot.manage')) {
                void loadStatus();
            }
        }, 30_000);
        return () => {
            window.clearInterval(interval);
            socket.disconnect();
        };
    }, [hasPermission, loadAnalytics, loadStatus]);

    // Apply theme on component mount and theme change
    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', isDark);
        } else {
            root.classList.toggle('dark', theme === 'dark');
        }
    }, [theme]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-background dark:bg-slate-950 transition-colors">
            <div className="pointer-events-none absolute inset-0">
                <motion.div
                    className="absolute left-[-10rem] top-[-6rem] h-72 w-72 rounded-full bg-emerald-300/15 dark:bg-emerald-600/10 blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut'
                    }}
                />
                <motion.div
                    className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-amber-200/15 dark:bg-orange-600/10 blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                        delay: 1
                    }}
                />
                <motion.div
                    className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-lime-200/10 dark:bg-green-600/10 blur-3xl"
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                        delay: 2
                    }}
                />
            </div>

            <Topbar />
            <div className="relative mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 pb-6 pt-4 sm:gap-5 sm:px-5 sm:pb-7 sm:pt-5 lg:flex-row lg:gap-5 lg:px-5 lg:pb-8 lg:pt-5">
                <Sidebar />
                <motion.main
                    className="soft-scrollbar min-h-0 flex-1 overflow-auto rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/50 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:h-[calc(100vh-132px)] lg:rounded-2xl lg:p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
                >
                    <Outlet />
                </motion.main>
            </div>
        </div>
    );
}
