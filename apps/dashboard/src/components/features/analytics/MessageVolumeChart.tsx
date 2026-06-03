import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MessageVolumeChartProps {
  messagesToday: number;
}

export function MessageVolumeChart({ messagesToday }: MessageVolumeChartProps) {
  const data = Array.from({ length: 7 }, (_, index) => {
    const day = `H-${6 - index}`;
    const value = Math.max(0, Math.round((messagesToday / 7) * (0.65 + index * 0.08)));
    return { day: index === 6 ? 'Hari ini' : day, messages: value };
  });

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
          <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip />
          <Area type="monotone" dataKey="messages" stroke="#16a34a" fill="url(#messageVolume)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
