
import React, { useState, useMemo } from 'react';
import { GameStats } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, ComposedChart, Bar } from 'recharts';

interface DashboardProps {
  stats: GameStats;
  history: GameStats[];
}

type ViewMode = 'annually' | 'monthly' | 'turns';

const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: string }> = ({ label, value, color, icon }) => (
  <div className={`bg-slate-800/50 border-l-4 ${color} p-4 rounded-r-lg shadow-lg`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
          {viewMode === 'annually' ? `Year ${data.year}` : 
           viewMode === 'monthly' ? `Y${data.year} - Month ${data.month}` : 
           `Y${data.year} M${data.month} - T${5 - data.turnsRemaining}`}
        </p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium" style={{ color: item.color || item.fill }}>
                {item.name}:
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {item.name === 'Funds' 
                  ? `$${item.value.toLocaleString()}` 
                  : item.name === 'Pollution' || item.name === 'Public Approval'
                  ? `${item.value}%`
                  : item.name === 'Renewable'
                  ? `${item.value} GW`
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, history }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const processedHistory = useMemo(() => {
    if (viewMode === 'turns') return history;
    
    if (viewMode === 'monthly') {
      // Filter to keep only the state at the end of each month (month changes or it's the absolute last entry)
      return history.filter((h, i, arr) => {
        const next = arr[i + 1];
        const isLastOfCurrentMonth = next ? (next.month !== h.month || next.year !== h.year) : true;
        return isLastOfCurrentMonth;
      });
    }

    if (viewMode === 'annually') {
      // Filter to keep only the state at the end of each year
      return history.filter((h, i, arr) => {
        const next = arr[i + 1];
        const isLastOfCurrentYear = next ? next.year !== h.year : true;
        return isLastOfCurrentYear;
      });
    }

    return history;
  }, [history, viewMode]);

  const formatXAxis = (tickItem: any, index: number) => {
    const data = processedHistory[index];
    if (!data) return '';
    if (viewMode === 'annually') return `${data.year}`;
    if (viewMode === 'monthly') return `M${data.month}`;
    return `T${index % 50}`; // Simplified for turns
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Year / Month" value={`${stats.year} / ${monthNames[stats.month - 1]}`} color="border-blue-500" icon="📅" />
        <StatCard label="Turns" value={`${stats.turnsRemaining} / 5`} color="border-yellow-500" icon="⏳" />
        <StatCard label="Funds" value={`$${stats.cash.toLocaleString()}`} color="border-emerald-500" icon="💰" />
        <StatCard label="Pollution" value={`${stats.pollution}%`} color="border-red-500" icon="🌫️" />
        <StatCard label="Approval" value={`${stats.approval}%`} color="border-blue-400" icon="🤝" />
        <StatCard label="Refined" value={stats.refinedProducts} color="border-purple-500" icon="⛽" />
        <StatCard label="Knowledge" value={stats.knowledge} color="border-indigo-500" icon="🎓" />
        <StatCard label="Renewable" value={`${stats.renewableCapacity} GW`} color="border-green-400" icon="⚡" />
      </div>

      <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Data Analytics View</h3>
        <div className="flex gap-1">
          {(['annually', 'monthly', 'turns'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                viewMode === mode 
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              } capitalize`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Financial Performance */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-emerald-400">💰</span> Funds Liquidity
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  tickFormatter={formatXAxis}
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={viewMode === 'turns' ? 50 : 30}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorCash)" 
                  name="Funds" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Health */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <span className="text-blue-400">📊</span> Public & Intel Status
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  tickFormatter={formatXAxis}
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={viewMode === 'turns' ? 50 : 30}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                <Line 
                  type="monotone" 
                  dataKey="approval" 
                  stroke="#60a5fa" 
                  name="Public Approval" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="knowledge" 
                  stroke="#818cf8" 
                  name="Knowledge" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sustainability & Transition */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl lg:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-green-400">🌱</span> Energy Transition
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  tickFormatter={formatXAxis}
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={viewMode === 'turns' ? 50 : 30}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#4ade80" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#ef4444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                <Bar 
                  yAxisId="left" 
                  dataKey="renewableCapacity" 
                  fill="#4ade80" 
                  name="Renewable" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.6}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="pollution" 
                  stroke="#ef4444" 
                  name="Pollution" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
