import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, ShieldCheck, ShieldAlert, ShieldX, 
  BarChart3, Gauge, Layers, Target, Info
} from 'lucide-react';
import { QCMetrics } from '../types/genomics';
import { motion } from 'framer-motion';

interface QCDashboardProps {
  metrics: QCMetrics;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ metrics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'WARN': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'FAIL': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-zinc-500 bg-zinc-50 border-zinc-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <ShieldCheck className="w-5 h-5" />;
      case 'WARN': return <ShieldAlert className="w-5 h-5" />;
      case 'FAIL': return <ShieldX className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  // Q30 Gauge Data
  const q30Data = [
    { name: 'Q30', value: metrics.q30Score },
    { name: 'Remaining', value: 100 - metrics.q30Score }
  ];
  const q30Colors = [
    metrics.q30Score > 85 ? '#10b981' : metrics.q30Score > 75 ? '#f59e0b' : '#ef4444',
    '#f4f4f5'
  ];

  return (
    <div className="space-y-8">
      {/* Header with Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 leading-none mb-1">Sequencing Quality Control</h3>
            <p className="text-sm text-zinc-500">Real-time validation of sequencing metrics</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${getStatusColor(metrics.status)}`}>
          {getStatusIcon(metrics.status)}
          <span>{metrics.status}</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Coverage Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mean Coverage</span>
            <Target className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900">{metrics.coverage.toFixed(1)}</span>
            <span className="text-sm font-bold text-zinc-400">x</span>
          </div>
          <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${Math.min(100, (metrics.coverage / 100) * 100)}%` }} 
            />
          </div>
        </motion.div>

        {/* Mapping Rate Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mapping Rate</span>
            <Layers className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900">{(metrics.mappingRate * 100).toFixed(1)}</span>
            <span className="text-sm font-bold text-zinc-400">%</span>
          </div>
          <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${metrics.mappingRate * 100}%` }} 
            />
          </div>
        </motion.div>

        {/* Duplication Rate Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Duplication Rate</span>
            <Activity className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900">{(metrics.duplicationRate * 100).toFixed(1)}</span>
            <span className="text-sm font-bold text-zinc-400">%</span>
          </div>
          <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${metrics.duplicationRate > 0.2 ? 'bg-red-500' : 'bg-amber-500'}`} 
              style={{ width: `${metrics.duplicationRate * 100}%` }} 
            />
          </div>
        </motion.div>

        {/* Uniformity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uniformity</span>
            <Gauge className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-zinc-900">{(metrics.uniformityScore * 100).toFixed(1)}</span>
            <span className="text-sm font-bold text-zinc-400">%</span>
          </div>
          <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${metrics.uniformityScore * 100}%` }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coverage Distribution Plot */}
        <div className="lg:col-span-2 p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-zinc-900">Coverage Distribution</h4>
              <p className="text-xs text-zinc-500">Depth of coverage across target regions</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.coverageDistribution || []}>
                <defs>
                  <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="depth" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}x`}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Bases at depth']}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDepth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Q30 Gauge */}
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h4 className="font-bold text-zinc-900">Q30 Quality Score</h4>
            <p className="text-xs text-zinc-500">Percentage of bases with Q ≥ 30</p>
          </div>
          <div className="relative w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={q30Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {q30Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={q30Colors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-4xl font-black text-zinc-900">{metrics.q30Score}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Score</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 w-full">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                A Q30 score of {metrics.q30Score} indicates that {metrics.q30Score}% of bases have a base call accuracy of 99.9%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning / Insights */}
      {metrics.reasoning && (
        <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl">
              <Info className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">QC Insights & Recommendations</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {metrics.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
