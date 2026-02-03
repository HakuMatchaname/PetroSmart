
import React, { useState, useMemo } from 'react';
import { GameStats } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts';

interface DashboardProps {
  stats: GameStats;
  history: GameStats[];
}

type ViewMode = 'annually' | 'monthly' | 'turns';

const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: string }> = ({ label, value, color, icon }) => (
  <div className={`bg-slate-800/50 border-l-4 ${color} p-4 rounded-r-lg shadow-lg transition-all duration-500 hover:bg-slate-800`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
  </div>
);

const PulsingDot = (props: any) => {
  const { cx, cy, fill } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={fill} className="animate-ping opacity-20" />
      <circle cx={cx} cy={cy} r={6} fill={fill} className="animate-pulse opacity-40" />
      <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, viewMode, lang }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur-md ring-1 ring-white/10">
        <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
          {viewMode === 'annually' ? (lang === 'ID' ? `Tahun ${data.year}` : `Year ${data.year}`) : 
           viewMode === 'monthly' ? (lang === 'ID' ? `Thn ${data.year} - Bln ${data.month}` : `Y${data.year} - Month ${data.month}`) : 
           (lang === 'ID' ? `Thn ${data.year} Bln ${data.month} - Aksi ${5 - data.turnsRemaining}` : `Y${data.year} M${data.month} - T${5 - data.turnsRemaining}`)}
        </p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium" style={{ color: item.color || item.fill }}>
                {item.name}:
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {item.name === 'Modal' || item.name === 'Funds' 
                  ? `$${item.value.toLocaleString()}` 
                  : item.name.includes('Harga') || item.name.includes('Index') || item.name.includes('Demand')
                  ? `${item.value.toFixed(1)}`
                  : item.name === 'Polusi' || item.name === 'Pollution' || item.name === 'Kepercayaan' || item.name === 'Public Approval'
                  ? `${item.value}%`
                  : item.name === 'Energi Hijau' || item.name === 'Renewable'
                  ? `${item.value.toFixed(1)} GW`
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
  const monthNamesEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNamesID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthNames = stats.language === 'ID' ? monthNamesID : monthNamesEN;

  const marketHistory = useMemo(() => {
    return history.map((h, idx) => {
      const yearFactor = (h.year - 2024);
      const monthFactor = (h.month / 12);
      const timeOffset = yearFactor + monthFactor;
      
      const crudePrice = 75 + (Math.sin(timeOffset * 2.5) * 15) - (yearFactor * 2);
      const renewableIndex = 20 + (yearFactor * 15) + (h.knowledge * 0.5);
      const refinedDemand = 100 - (yearFactor * 3) + (Math.cos(timeOffset * 1.5) * 8);

      return {
        ...h,
        crudePrice,
        renewableIndex,
        refinedDemand
      };
    });
  }, [history]);

  const processedHistory = useMemo(() => {
    const data = marketHistory;
    if (viewMode === 'turns') return data;
    
    if (viewMode === 'monthly') {
      return data.filter((h, i, arr) => {
        const next = arr[i + 1];
        const isLastOfCurrentMonth = next ? (next.month !== h.month || next.year !== h.year) : true;
        return isLastOfCurrentMonth;
      });
    }

    if (viewMode === 'annually') {
      return data.filter((h, i, arr) => {
        const next = arr[i + 1];
        const isLastOfCurrentYear = next ? next.year !== h.year : true;
        return isLastOfCurrentYear;
      });
    }

    return data;
  }, [marketHistory, viewMode]);

  const formatXAxis = (tickItem: any, index: number) => {
    const data = processedHistory[index];
    if (!data) return '';
    if (viewMode === 'annually') return `${data.year}`;
    if (viewMode === 'monthly') return `B${data.month}`;
    return `A${index % 50}`;
  };

  const currentCrudeTrend = useMemo(() => {
    const last = marketHistory[marketHistory.length - 1]?.crudePrice || 0;
    const prev = marketHistory[marketHistory.length - 6]?.crudePrice || last;
    if (stats.language === 'ID') return last > prev ? 'Naik' : 'Stabil';
    return last > prev ? 'Rising' : 'Cooling';
  }, [marketHistory, stats.language]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={stats.language === 'ID' ? "Tahun / Bulan" : "Year / Month"} value={`${stats.year} / ${monthNames[stats.month - 1]}`} color="border-blue-500" icon="📅" />
        <StatCard label={stats.language === 'ID' ? "Aksi" : "Turns"} value={`${stats.turnsRemaining} / 5`} color="border-yellow-500" icon="⏳" />
        <StatCard label={stats.language === 'ID' ? "Kas Perusahaan" : "Funds"} value={`$${stats.cash.toLocaleString()}`} color="border-emerald-500" icon="💰" />
        <StatCard label={stats.language === 'ID' ? "Polusi" : "Pollution"} value={`${stats.pollution}%`} color="border-red-500" icon="🌫️" />
        <StatCard label={stats.language === 'ID' ? "Kepercayaan" : "Approval"} value={`${stats.approval}%`} color="border-blue-400" icon="🤝" />
        <StatCard label={stats.language === 'ID' ? "Produk Olahan" : "Refined"} value={stats.refinedProducts} color="border-purple-500" icon="⛽" />
        <StatCard label={stats.language === 'ID' ? "Wawasan" : "Knowledge"} value={stats.knowledge} color="border-indigo-500" icon="🎓" />
        <StatCard label={stats.language === 'ID' ? "Energi Hijau" : "Renewable"} value={`${stats.renewableCapacity.toFixed(1)} GW`} color="border-green-400" icon="⚡" />
      </div>

      <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
            {stats.language === 'ID' ? 'Analitik Data Operasional' : 'Data Analytics View'}
          </h3>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              {stats.language === 'ID' ? `Pasar: ${currentCrudeTrend}` : `Market: ${currentCrudeTrend}`}
            </span>
          </div>
        </div>
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
              {mode === 'annually' ? (stats.language === 'ID' ? 'Tahunan' : 'Annually') : 
               mode === 'monthly' ? (stats.language === 'ID' ? 'Bulanan' : 'Monthly') : 
               (stats.language === 'ID' ? 'Per Aksi' : 'Turns')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Finance */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl group transition-all duration-300 hover:border-slate-600 min-w-0 overflow-hidden">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 group-hover:animate-pulse">💰</span> 
              {stats.language === 'ID' ? 'Likuiditas Modal' : 'Funds Liquidity'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">USD MILLIONS</span>
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={processedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
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
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}rb`} />
                <Tooltip content={<CustomTooltip viewMode={viewMode} lang={stats.language} />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorCash)" 
                  name={stats.language === 'ID' ? "Modal" : "Funds"} 
                  strokeWidth={3}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  activeDot={<PulsingDot fill="#10b981" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Global Market Trends */}
        <div className="bg-slate-900/60 p-6 rounded-xl border border-amber-500/20 shadow-xl group transition-all duration-300 hover:border-amber-500/40 min-w-0 overflow-hidden ring-1 ring-amber-500/5">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 group-hover:animate-bounce">🌐</span> 
              {stats.language === 'ID' ? 'Tren Pasar Global' : 'Global Market Pulse'}
            </div>
            <span className="text-[10px] text-amber-500/50 font-mono">LIVE COMMODITIES</span>
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip viewMode={viewMode} lang={stats.language} />} cursor={{ stroke: '#f59e0b', strokeWidth: 1 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="crudePrice" 
                  stroke="#f59e0b" 
                  name={stats.language === 'ID' ? "Harga Minyak ($/bbl)" : "Crude Price ($/bbl)"} 
                  strokeWidth={2} 
                  dot={false}
                  animationDuration={2000}
                  activeDot={<PulsingDot fill="#f59e0b" />}
                />
                <Line 
                  type="monotone" 
                  dataKey="renewableIndex" 
                  stroke="#4ade80" 
                  name={stats.language === 'ID' ? "Permintaan Hijau" : "Renewable Demand Index"} 
                  strokeWidth={2} 
                  dot={false}
                  strokeDasharray="5 5"
                  animationDuration={2500}
                  activeDot={<PulsingDot fill="#4ade80" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Reputation & Knowledge */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl group transition-all duration-300 hover:border-slate-600 min-w-0 overflow-hidden">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <span className="text-blue-400 group-hover:animate-pulse">📊</span> 
             {stats.language === 'ID' ? 'Status Reputasi & Riset' : 'Public & Intel Status'}
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                <Tooltip content={<CustomTooltip viewMode={viewMode} lang={stats.language} />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="approval" 
                  stroke="#60a5fa" 
                  name={stats.language === 'ID' ? "Kepercayaan Publik" : "Public Approval"} 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  activeDot={<PulsingDot fill="#60a5fa" />}
                />
                <Line 
                  type="monotone" 
                  dataKey="knowledge" 
                  stroke="#818cf8" 
                  name={stats.language === 'ID' ? "Wawasan" : "Knowledge"} 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  activeDot={<PulsingDot fill="#818cf8" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Green Energy Trends & Pollution */}
        <div className="bg-slate-900/60 p-6 rounded-xl border border-green-500/20 shadow-xl group transition-all duration-300 hover:border-green-500/40 min-w-0 overflow-hidden ring-1 ring-green-500/5">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <span className="text-green-400 group-hover:animate-pulse">🌬️</span> 
             {stats.language === 'ID' ? 'Transisi Energi & Ekologi' : 'Green Transition & Ecology'}
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                <Tooltip content={<CustomTooltip viewMode={viewMode} lang={stats.language} />} cursor={{ stroke: '#22c55e', strokeWidth: 2 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="renewableCapacity" 
                  stroke="#22c55e" 
                  name={stats.language === 'ID' ? "Energi Hijau" : "Green Energy"} 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  activeDot={<PulsingDot fill="#22c55e" />}
                />
                <Line 
                  type="monotone" 
                  dataKey="pollution" 
                  stroke="#ef4444" 
                  name={stats.language === 'ID' ? "Polusi" : "Pollution"} 
                  strokeWidth={3} 
                  dot={false}
                  strokeDasharray="3 3"
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  activeDot={<PulsingDot fill="#ef4444" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
