import React from 'react';
import { motion } from 'motion/react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { AlertTriangle, Info, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { CNVAnalysis } from '../types/genomics';

interface CNVDashboardProps {
  data: CNVAnalysis;
}

export const CNVDashboard: React.FC<CNVDashboardProps> = ({ data }) => {
  if (!data || !data.segments || data.segments.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800">
        <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">No Copy Number Variation (CNV) data detected in this sample.</p>
      </div>
    );
  }

  // Prepare data for the genome plot
  // We'll simplify by mapping chromosomes to a linear scale for visualization
  const chromOrder = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', 'X', 'Y'
  ];

  const plotData = data.segments.map((seg, index) => ({
    ...seg,
    id: index,
    chromIndex: chromOrder.indexOf(seg.chrom.replace('chr', '')) + 1,
    // Add a small jitter to position within chromosome for better visibility if multiple segments
    x: (chromOrder.indexOf(seg.chrom.replace('chr', '')) + 1) + (Math.random() * 0.4 - 0.2)
  })).filter(d => d.chromIndex > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs font-bold text-zinc-400 mb-1">chr{d.chrom}:{d.start}-{d.end}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-mono ${d.log2 > 0 ? 'text-rose-400' : d.log2 < 0 ? 'text-blue-400' : 'text-zinc-400'}`}>
              Log2: {d.log2.toFixed(3)}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              d.status === 'Amplification' ? 'bg-rose-500/20 text-rose-400' : 
              d.status === 'Deletion' ? 'bg-blue-500/20 text-blue-400' : 
              'bg-zinc-800 text-zinc-500'
            }`}>
              {d.status}
            </span>
          </div>
          {d.genes && d.genes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase mb-1">Overlapping Genes</p>
              <div className="flex flex-wrap gap-1">
                {d.genes.slice(0, 5).map((g: string) => (
                  <span key={g} className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-300">{g}</span>
                ))}
                {d.genes.length > 5 && <span className="text-[10px] text-zinc-500">+{d.genes.length - 5} more</span>}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex items-start gap-4">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Amplifications</p>
            <p className="text-2xl font-mono text-white">
              {data.segments.filter(s => s.status === 'Amplification').length}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingDown className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Deletions</p>
            <p className="text-2xl font-mono text-white">
              {data.segments.filter(s => s.status === 'Deletion').length}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex items-start gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Significant Genes</p>
            <p className="text-2xl font-mono text-white">
              {data.significantGenes?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Genome Plot */}
      <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 italic font-serif">
            <Layers className="w-4 h-4 text-zinc-400" />
            Genome-wide CNV Profile
          </h3>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> Amplification
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Deletion
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Chromosome" 
                domain={[0, 25]} 
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]}
                tickFormatter={(val) => {
                  if (val === 23) return 'X';
                  if (val === 24) return 'Y';
                  return val.toString();
                }}
                stroke="#52525b"
                fontSize={10}
              />
              <YAxis 
                type="number" 
                dataKey="log2" 
                name="Log2 Ratio" 
                domain={[-3, 3]} 
                stroke="#52525b"
                fontSize={10}
                label={{ value: 'Log2 Ratio', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }}
              />
              <ZAxis type="number" range={[50, 400]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />
              <ReferenceLine y={0.6} stroke="#ef4444" strokeDasharray="3 3" opacity={0.3} />
              <ReferenceLine y={-0.6} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.3} />
              <Scatter name="Segments" data={plotData}>
                {plotData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.log2 > 0 ? '#fb7185' : entry.log2 < 0 ? '#60a5fa' : '#71717a'} 
                    fillOpacity={0.6}
                    stroke={entry.log2 > 0 ? '#f43f5e' : entry.log2 < 0 ? '#3b82f6' : '#52525b'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Significant Genes Table */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="p-4 border-bottom border-zinc-800 bg-zinc-900/80">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            Significant Gene Alterations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/30 border-b border-zinc-800">
                <th className="px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500">Gene</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500">Type</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 text-center">Log2</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data.significantGenes?.map((gene, idx) => (
                <motion.tr 
                  key={gene.gene}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white font-mono">{gene.gene}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400">{gene.type}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-mono ${gene.log2 > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                      {gene.log2 > 0 ? '+' : ''}{gene.log2.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      gene.status === 'Amplification' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {gene.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {(!data.significantGenes || data.significantGenes.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-sm">
                    No significant gene alterations identified in detected CNV segments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
