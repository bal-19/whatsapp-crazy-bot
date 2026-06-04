import type { AnalyticsSummary } from '@whatsapp-bot/shared';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MessageVolumeChartProps {
  data: AnalyticsSummary['daily_message_volume'];
}

export function MessageVolumeChart({ data }: MessageVolumeChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid rgba(209, 250, 229, 0.95)',
              boxShadow: '0 18px 45px -24px rgba(18, 57, 42, 0.35)',
              backgroundColor: 'rgba(255,255,255,0.96)'
            }}
          />
          <Area type="monotone" dataKey="messages" stroke="#16a34a" fill="url(#messageVolume)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
