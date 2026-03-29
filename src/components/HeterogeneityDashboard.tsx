import React from 'react';
import { motion } from 'framer-motion';
import { ClonalArchitecture } from '../types/genomics';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { GitBranch, Info, Activity, Layers, Share2 } from 'lucide-react';

interface HeterogeneityDashboardProps {
  architecture: ClonalArchitecture;
}

export const HeterogeneityDashboard: React.FC<HeterogeneityDashboardProps> = ({ architecture }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const scatterData = architecture.clusters.map(cluster => ({
    x: cluster.meanVaf * 100,
    y: cluster.prevalence * 100,
    z: cluster.variantCount,
    name: `Cluster ${cluster.clusterId}`,
    isClonal: cluster.isClonal,
    genes: cluster.genes.join(', '),
    clusterId: cluster.clusterId
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VAF vs Prevalence Scatter Plot */}
        <div className="lg:col-span-2 p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-xl font-semibold">Subclonal Architecture</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">VAF vs. Cellular Prevalence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Size = Variant Count</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="VAF" 
                  unit="%" 
                  domain={[0, 100]}
                  label={{ value: 'Variant Allele Frequency (%)', position: 'bottom', offset: 0, fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Prevalence" 
                  unit="%" 
                  domain={[0, 100]}
                  label={{ value: 'Cellular Prevalence (%)', angle: -90, position: 'left', fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Variants" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-xl max-w-xs">
                          <p className="text-xs font-bold text-zinc-900 mb-1">{data.name}</p>
                          <div className="space-y-1 mb-3">
                            <p className="text-[10px] text-zinc-500 flex justify-between">
                              <span>Mean VAF:</span>
                              <span className="font-mono font-bold text-zinc-900">{data.x.toFixed(1)}%</span>
                            </p>
                            <p className="text-[10px] text-zinc-500 flex justify-between">
                              <span>Prevalence:</span>
                              <span className="font-mono font-bold text-zinc-900">{data.y.toFixed(1)}%</span>
                            </p>
                            <p className="text-[10px] text-zinc-500 flex justify-between">
                              <span>Variants:</span>
                              <span className="font-mono font-bold text-zinc-900">{data.z}</span>
                            </p>
                          </div>
                          {data.genes && (
                            <div className="pt-2 border-t border-zinc-100">
                              <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Key Genes</p>
                              <p className="text-[10px] text-zinc-600 leading-tight">{data.genes}</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Subclones" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolutionary Model & Insight */}
        <div className="space-y-6">
          <div className="p-8 bg-zinc-900 text-white rounded-3xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <GitBranch className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="px-2 py-0.5 bg-indigo-500 text-[10px] font-bold rounded uppercase tracking-widest">
                  {architecture.evolutionaryModel} Model
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 leading-tight">Clonal Evolution Insight</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {architecture.evolutionaryInsight}
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-800">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Clusters</p>
                  <p className="text-2xl font-bold">{architecture.clusters.length}</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Clonal Status</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {architecture.clusters.some(c => c.isClonal) ? 'Detected' : 'Mixed'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-4 h-4 text-zinc-400" />
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Phylogenetic Inference</h4>
            </div>
            {architecture.phylogeny ? (
              <div className="space-y-4">
                {architecture.phylogeny.nodes.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${node.isClonal ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                        <span className="text-xs font-bold">{node.id}</span>
                      </div>
                      {i < architecture.phylogeny!.nodes.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-zinc-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{node.label}</p>
                      <p className="text-[10px] text-zinc-500">Prevalence: {(node.prevalence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-zinc-400 italic">Complex phylogeny detected. See full report for details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clusters Table */}
      <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <Layers className="w-6 h-6 text-zinc-400" />
          <h3 className="text-xl font-semibold">Subclone Cluster Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID</th>
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mean VAF</th>
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prevalence</th>
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Variants</th>
                <th className="pb-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Key Driver Genes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {architecture.clusters.map((cluster, i) => (
                <tr key={cluster.clusterId} className="group hover:bg-zinc-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                        {cluster.clusterId}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    {cluster.isClonal ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-tighter">Clonal</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-tighter">Subclonal</span>
                    )}
                  </td>
                  <td className="py-4 font-mono text-xs font-bold">{(cluster.meanVaf * 100).toFixed(1)}%</td>
                  <td className="py-4 font-mono text-xs font-bold">{(cluster.prevalence * 100).toFixed(1)}%</td>
                  <td className="py-4 font-mono text-xs text-zinc-500">{cluster.variantCount}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {cluster.genes.map(gene => (
                        <span key={gene} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-medium rounded">
                          {gene}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
