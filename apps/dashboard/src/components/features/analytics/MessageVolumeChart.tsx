import type { AnalyticsSummary } from '@whatsapp-bot/shared';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MessageVolumeChartProps {
    data: AnalyticsSummary['daily_message_volume'];
}

export function MessageVolumeChart({ data }: MessageVolumeChartProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check if dark mode is enabled
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Watch for changes to the dark class
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
                    <defs>
                        <linearGradient id="messageVolume" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#475569' : '#e2e8f0'}
                    />
                    <XAxis
                        dataKey="label"
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        fontSize={12}
                    />
                    <YAxis
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        fontSize={12}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: isDark
                                ? '1px solid rgba(34, 197, 94, 0.5)'
                                : '1px solid rgba(209, 250, 229, 0.95)',
                            boxShadow: isDark
                                ? '0 18px 45px -24px rgba(0, 0, 0, 0.5)'
                                : '0 18px 45px -24px rgba(18, 57, 42, 0.35)',
                            backgroundColor: isDark
                                ? 'rgba(15, 23, 42, 0.96)'
                                : 'rgba(255, 255, 255, 0.96)',
                            color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                        labelStyle={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="messages" stroke="#16a34a" fill="url(#messageVolume)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
