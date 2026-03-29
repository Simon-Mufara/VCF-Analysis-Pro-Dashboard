import React from 'react';
import { motion } from 'motion/react';
import { 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Pill,
  Info
} from 'lucide-react';
import { ClinicianSummary as ClinicianSummaryType } from '../types/genomics';

interface ClinicianSummaryProps {
  summary: ClinicianSummaryType;
}

export const ClinicianSummary: React.FC<ClinicianSummaryProps> = ({ summary }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Primary Diagnosis Box */}
      <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Stethoscope className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-bold text-indigo-900 uppercase tracking-tight">Clinician Summary</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Primary Diagnosis</span>
            <p className="text-xl font-semibold text-indigo-950">{summary.diagnosis}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Key Findings</span>
              <ul className="space-y-2">
                {summary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-indigo-900/80">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {summary.contraindications.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Contraindications</span>
                  </div>
                  <ul className="space-y-1">
                    {summary.contraindications.map((item, i) => (
                      <li key={i} className="text-xs font-medium text-red-900">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Recommended Therapy</span>
                </div>
                <ul className="space-y-2">
                  {summary.drugRecommendations.map((rec, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-bold text-emerald-900 block">{rec.drug}</span>
                      <span className="text-emerald-700 italic">{rec.reasoning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Variants Table */}
      <div className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Actionable Variants</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gene</th>
                <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Variant</th>
                <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Clinical Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {summary.actionableVariants.map((v, i) => (
                <tr key={i} className="group hover:bg-zinc-50 transition-colors">
                  <td className="py-4">
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-900 text-[10px] font-bold rounded uppercase">
                      {v.gene}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-mono font-medium text-zinc-600">{v.variant}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Info className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs text-zinc-500">{v.clinicalSignificance}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
