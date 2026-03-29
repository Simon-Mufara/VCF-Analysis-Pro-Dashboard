import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, Pill, ShieldAlert, ListChecks, Database, FileSearch, ExternalLink, Microscope, FlaskConical, BrainCircuit, CheckCircle2, AlertTriangle, Settings2, AlertCircle, Info, Link2, BookOpen, Target, Cpu, TrendingUp, Table, FileText, Download, ShieldCheck, Stethoscope, Network, Share2 } from 'lucide-react';
import { PredictionResult } from '../services/geminiService';
import { motion } from 'framer-motion';
import { ClinicianSummary } from './ClinicianSummary';
import { PathwayVisualization } from './PathwayVisualization';
import { QCDashboard } from './QCDashboard';
import { HeterogeneityDashboard } from './HeterogeneityDashboard';
import { CNVDashboard } from './CNVDashboard';
import { ClinVarDetails } from './ClinVarDetails';
import { DrugInteractionAnalysis } from './DrugInteractionAnalysis';

interface DashboardProps {
  result: PredictionResult;
  isLoading: boolean;
  dataSummary: string | null;
  analysisMode?: 'individual' | 'paired' | 'single' | 'cohort' | null;
  selectedSampleName?: string | null;
  onTrainClassifier?: () => void;
  isTraining?: boolean;
  trainingResult?: string | null;
  cumulativeCount?: number;
  onShowReport?: () => void;
}

export const PredictionDashboard: React.FC<DashboardProps> = ({ 
  result, 
  isLoading, 
  dataSummary, 
  analysisMode, 
  selectedSampleName,
  onTrainClassifier,
  isTraining,
  trainingResult,
  cumulativeCount = 0,
  onShowReport
}) => {
  const [tuningParams, setTuningParams] = useState(result?.aiModelTuning || []);

  React.useEffect(() => {
    if (result?.aiModelTuning) {
      setTuningParams(result.aiModelTuning);
    }
  }, [result]);

  if (isLoading || !result) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-zinc-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  const chartData = result.recommendedDrugs.map(d => ({
    name: d.name,
    confidence: d.confidence * 100,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const handleTune = (index: number, val: number) => {
    const newParams = [...tuningParams];
    newParams[index] = { ...newParams[index], currentValue: val };
    setTuningParams(newParams);
  };

  return (
    <div className="space-y-8">
      {/* Data Source Preview */}
      {dataSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-3">
            <Database className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Source Data Summary</span>
          </div>
          <pre className="text-xs font-mono text-zinc-600 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {dataSummary}
          </pre>
        </motion.div>
      )}

      {/* VCF-ClinAI-Pro Parsing & Quality Summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900">Analysis Results</h2>
        <div className="flex items-center gap-3">
          {result.markdownReport && (
            <button 
              onClick={onShowReport}
              className="px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Generate Full Report (PDF)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysisMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-2 p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest opacity-80">Merged VCF Protocol Active</h4>
                <p className="text-lg font-bold">
                  Mode: {analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)} 
                  {selectedSampleName && ` — Target: ${selectedSampleName}`}
                </p>
              </div>
            </div>
            {analysisMode === 'cohort' && (
              <div className="px-4 py-2 bg-orange-500 rounded-xl text-xs font-black uppercase tracking-tighter animate-pulse">
                Research Only
              </div>
            )}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <FileSearch className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-semibold text-zinc-900">VCF Parsing Summary</h3>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed font-medium">
            {result.vcfParsingSummary}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-emerald-500" />
            <h3 className="text-xl font-semibold text-zinc-900">Quality & Filtering Summary</h3>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed font-medium">
            {result.qualityFilteringSummary}
          </p>
        </motion.div>
      </div>

      {/* Research Questions & Knowledge Base Aggregation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-8 bg-zinc-900 text-white rounded-[32px] shadow-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Post-Analysis Research Insights</h3>
            </div>
            <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-700">
              Cohort Aggregation Ready
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">Suggested Research Questions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.researchQuestions?.map((q, i) => (
                  <div key={i} className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl hover:bg-zinc-800 transition-colors cursor-default">
                    <p className="text-sm text-zinc-300 italic">"{q}"</p>
                  </div>
                )) || (
                  <p className="text-sm text-zinc-500 italic">No specific research questions generated for this case.</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Cumulative Knowledge Base</h4>
                  <p className="text-xs text-zinc-400">
                    {cumulativeCount} variants currently stored in your local session.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(result.featureTable, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `features_${new Date().getTime()}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Export Features JSON
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-indigo-600 text-white rounded-[32px] shadow-xl flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Prototype Classifier</h3>
          </div>
          
          <p className="text-sm text-indigo-100 leading-relaxed mb-8">
            Would you like me to train a simple prototype classifier (Logistic Regression or Random Forest simulation) on the variants collected so far?
          </p>

          <div className="mt-auto space-y-4">
            {trainingResult ? (
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <h5 className="text-xs font-bold uppercase tracking-widest mb-2 text-indigo-200">Model Output</h5>
                <p className="text-xs leading-relaxed line-clamp-4">{trainingResult}</p>
              </div>
            ) : null}

            <button 
              onClick={onTrainClassifier}
              disabled={isTraining || cumulativeCount < 5}
              className="w-full py-4 bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-indigo-400 disabled:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
            >
              {isTraining ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <Cpu className="w-5 h-5" />
              )}
              {isTraining ? "Training Model..." : "Train Prototype Classifier"}
            </button>
            {cumulativeCount < 5 && (
              <p className="text-[10px] text-center text-indigo-200">
                Requires at least 5 variants in KB to train.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Identified Condition</span>
            {result.globalHealthFocusActive && (
              <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 uppercase tracking-tighter">
                Global Health Focus Active
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">{result.disease}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <Pill className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Drug Candidates</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">{result.recommendedDrugs.length} Identified</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Risk Level</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Moderate to High</h2>
        </motion.div>
      </div>

      {/* MSI Analysis Section */}
      {result.msiAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-xl font-semibold">Microsatellite Instability (MSI)</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Loci Stability Analysis</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full border ${
              result.msiAnalysis.status === 'MSI-High' ? 'bg-red-50 border-red-100 text-red-700' :
              result.msiAnalysis.status === 'MSI-Low' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-emerald-50 border-emerald-100 text-emerald-700'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Status: {result.msiAnalysis.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-2xl">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 * (1 - result.msiAnalysis.score)}
                    className={`${
                      result.msiAnalysis.status === 'MSI-High' ? 'text-red-500' :
                      result.msiAnalysis.status === 'MSI-Low' ? 'text-amber-500' :
                      'text-emerald-500'
                    } transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{(result.msiAnalysis.score * 100).toFixed(1)}%</span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Unstable</span>
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-zinc-500">
                {result.msiAnalysis.unstableLoci} / {result.msiAnalysis.totalLoci} Loci
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Clinical Interpretation</h4>
                <p className="text-sm text-zinc-600 leading-relaxed italic">
                  "{result.msiAnalysis.interpretation}"
                </p>
              </div>

              {result.msiAnalysis.status === 'MSI-High' && (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-900">Therapeutic Implication</h4>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    MSI-High status is a strong predictor of response to <strong>Immune Checkpoint Inhibitors (ICIs)</strong>. 
                    Consider Pembrolizumab or Nivolumab as potential therapeutic options, regardless of tumour type (Agnostic Approval).
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mutational Signatures Section */}
      {result.signatureAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="text-xl font-semibold">Mutational Signature Analysis</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">COSMIC v3 SBS Signatures</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Dominant: {result.signatureAnalysis.dominantSignature}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.signatureAnalysis.signatures}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="signatureId" 
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      domain={[0, 1]}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-xl">
                              <p className="text-xs font-bold text-zinc-900 mb-1">{data.signatureId}</p>
                              <p className="text-[10px] text-zinc-500 mb-2">{data.description}</p>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold uppercase text-emerald-600">{data.etiology}</span>
                                <span className="text-xs font-mono font-bold">{(data.contribution * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="contribution" radius={[4, 4, 0, 0]}>
                      {result.signatureAnalysis.signatures.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.etiology === 'Aging' ? '#10b981' :
                            entry.etiology === 'APOBEC' ? '#3b82f6' :
                            entry.etiology === 'MMR Deficiency' ? '#ef4444' :
                            entry.etiology === 'Tobacco' ? '#f59e0b' :
                            entry.etiology === 'UV Exposure' ? '#8b5cf6' : '#94a3b8'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Interpretation</h4>
                <p className="text-sm text-zinc-600 leading-relaxed italic">
                  "{result.signatureAnalysis.interpretation}"
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Etiology Breakdown</h4>
                {result.signatureAnalysis.signatures.map((sig, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        sig.etiology === 'Aging' ? 'bg-emerald-500' :
                        sig.etiology === 'APOBEC' ? 'bg-blue-500' :
                        sig.etiology === 'MMR Deficiency' ? 'bg-red-500' :
                        sig.etiology === 'Tobacco' ? 'bg-amber-500' :
                        sig.etiology === 'UV Exposure' ? 'bg-purple-500' : 'bg-zinc-400'
                      }`} />
                      <span className="text-xs font-bold text-zinc-900">{sig.signatureId}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{(sig.contribution * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CNV Analysis Section */}
      {result.cnvAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Microscope className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-xl font-semibold">Copy Number Variation (CNV) Analysis</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Genome-wide Structural Variations</p>
              </div>
            </div>
          </div>

          <CNVDashboard data={result.cnvAnalysis} />
        </motion.div>
      )}

      {/* Clinician-Friendly Summary Module */}
      {result.clinicianSummary && (
        <ClinicianSummary summary={result.clinicianSummary} />
      )}

      {/* Pathway Analysis Section */}
      {result.pathwayAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 leading-none mb-1">Biological Pathway Analysis</h3>
              <p className="text-sm text-zinc-500">Mapping mutated genes to KEGG and Reactome pathways</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.pathwayAnalysis.pathways.map((pathway) => (
              <PathwayVisualization key={pathway.id} pathway={pathway as any} />
            ))}
          </div>

          <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl">
                <BrainCircuit className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">Pathway Disruption Summary</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {result.pathwayAnalysis.summary}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VAF Analysis Section */}
      {result.vafAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-rose-500" />
              <div>
                <h3 className="text-xl font-semibold">Variant Allele Frequency (VAF) Analysis</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Clonality & Subclonal Populations</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Clonal Variants</p>
                <p className="text-xl font-bold text-rose-600">{result.vafAnalysis.clonalVariants}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subclonal Variants</p>
                <p className="text-xl font-bold text-blue-600">{result.vafAnalysis.subclonalVariants}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[300px] w-full bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.vafAnalysis.vafDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="vaf" 
                    label={{ value: 'VAF', position: 'bottom', offset: 0, fontSize: 10, fontWeight: 700 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    label={{ value: 'Frequency', angle: -90, position: 'left', fontSize: 10, fontWeight: 700 }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="frequency" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {result.vafAnalysis.vafDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.vaf > 0.3 ? '#f43f5e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Subclonal Clusters</h4>
              {result.vafAnalysis.clusters?.map((cluster, i) => (
                <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm font-bold text-zinc-900">Cluster {cluster.clusterId}</span>
                    </div>
                    <span className="text-xs font-mono text-indigo-600 font-bold">Mean VAF: {cluster.meanVaf.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Population Size</span>
                    <span className="font-bold text-zinc-900">{cluster.variantCount} variants</span>
                  </div>
                  <div className="mt-2 w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full" 
                      style={{ width: `${(cluster.variantCount / (result.vafAnalysis?.clonalVariants! + result.vafAnalysis?.subclonalVariants!)) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
              {(!result.vafAnalysis.clusters || result.vafAnalysis.clusters.length === 0) && (
                <p className="text-xs text-zinc-500 italic">No distinct subclonal clusters identified.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ICD-10 Interpretations */}
      {result.icd10Interpretations && result.icd10Interpretations.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-zinc-900 text-white rounded-3xl shadow-xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileSearch className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/10 rounded-lg">
                <FileSearch className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">ICD-10 Clinical Interpretations</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Diagnostic Code Decoding</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.icd10Interpretations.map((icd, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-emerald-400 font-mono">{icd.code}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 leading-tight">{icd.description}</h4>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">
                      Genomic Context
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed italic">
                    {icd.relevance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sample QC Metrics Section */}
      {result.qcMetrics && (
        <QCDashboard metrics={result.qcMetrics} />
      )}

      {/* Tumour Heterogeneity Dashboard */}
      {result.clonalArchitecture && (
        <HeterogeneityDashboard architecture={result.clonalArchitecture} />
      )}

      {/* Gene Expression Visualization (Volcano Plot) */}
      {result.differentialExpression && result.differentialExpression.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-xl font-semibold">Differential Gene Expression</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Volcano Plot Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Upregulated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Downregulated</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[400px] w-full bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100/50">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    type="number" 
                    dataKey="log2FoldChange" 
                    name="log2FC" 
                    label={{ value: 'log2 Fold Change', position: 'bottom', offset: 0, fontSize: 10, fontWeight: 700 }}
                    tick={{ fontSize: 10 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="negLogPValue" 
                    name="-log10(p)" 
                    label={{ value: '-log10(p-value)', angle: -90, position: 'left', fontSize: 10, fontWeight: 700 }}
                    tick={{ fontSize: 10 }}
                  />
                  <ZAxis type="number" range={[60, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-zinc-100 rounded-xl shadow-xl">
                            <p className="text-sm font-bold text-zinc-900 mb-1">{data.gene}</p>
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 flex justify-between gap-4">
                                <span>log2FC:</span>
                                <span className={data.log2FoldChange > 0 ? 'text-rose-500 font-bold' : 'text-blue-500 font-bold'}>
                                  {data.log2FoldChange.toFixed(3)}
                                </span>
                              </p>
                              <p className="text-[10px] text-zinc-500 flex justify-between gap-4">
                                <span>p-value:</span>
                                <span className="text-zinc-900 font-bold">{data.pValue.toExponential(2)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Genes" 
                    data={result.differentialExpression.map(g => ({
                      ...g,
                      negLogPValue: -Math.log10(g.pValue)
                    }))} 
                  >
                    {result.differentialExpression.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.log2FoldChange > 0 ? '#f43f5e' : '#3b82f6'} 
                        fillOpacity={0.6}
                        stroke={entry.log2FoldChange > 0 ? '#be123c' : '#1d4ed8'}
                        strokeWidth={1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Top Significant Genes</h4>
              <div className="grid grid-cols-1 gap-2">
                {result.differentialExpression
                  .sort((a, b) => a.pValue - b.pValue)
                  .slice(0, 12)
                  .map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${g.log2FoldChange > 0 ? 'bg-rose-500' : 'bg-blue-500'}`} />
                        <span className="text-sm font-bold text-zinc-900">{g.gene}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold ${g.log2FoldChange > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                          {g.log2FoldChange > 0 ? '+' : ''}{g.log2FoldChange.toFixed(2)}
                        </p>
                        <p className="text-[8px] text-zinc-400 font-mono">p={g.pValue.toExponential(1)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confidence Chart */}
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Drug Confidence Scores</h3>
            <FileSearch className="w-5 h-5 text-zinc-300" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deep Learning Simulations */}
        {result.deepLearningSimulations && result.deepLearningSimulations.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <BrainCircuit className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-semibold text-zinc-900">Deep Learning Simulations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.deepLearningSimulations.map((sim, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 bg-zinc-900 text-white rounded-3xl shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Cpu className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{sim.modelType}</h4>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Simulation</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-emerald-400">{(sim.accuracy * 100).toFixed(1)}%</span>
                        <span className="text-sm text-zinc-400 mb-1">Accuracy</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-sm leading-relaxed text-zinc-300">
                          <span className="text-emerald-400 font-bold">Prediction:</span> {sim.prediction}
                        </p>
                      </div>

                      {sim.confidenceInterval && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                          <span className="uppercase tracking-widest">95% CI:</span>
                          <span className="text-zinc-300">[{sim.confidenceInterval[0].toFixed(3)}, {sim.confidenceInterval[1].toFixed(3)}]</span>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Feature Importance</span>
                        <div className="h-[100px] w-full mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sim.features.slice(0, 5).map((f, i) => ({ name: f, importance: 0.9 - (i * 0.15) }))} layout="vertical">
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={7} width={60} tick={{ fill: '#a1a1aa' }} />
                              <Bar dataKey="importance" fill="#10b981" radius={[0, 2, 2, 0]} barSize={8} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Reinforcement Learning Agent */}
        {result.reinforcementLearning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-indigo-900 text-white rounded-3xl shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Reinforcement Learning Agent</h3>
                  <p className="text-xs text-indigo-300 uppercase tracking-widest">{result.reinforcementLearning.agentType}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">Agent Objective</span>
                    <p className="text-lg font-bold text-white">{result.reinforcementLearning.objective}</p>
                  </div>
                  
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-2">Optimal Action Policy</span>
                    <p className="text-sm text-zinc-100 leading-relaxed font-medium">
                      {result.reinforcementLearning.optimalAction}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">Expected Reward</span>
                      <span className="text-3xl font-bold text-indigo-400">+{result.reinforcementLearning.expectedReward.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">Convergence</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{result.reinforcementLearning.convergenceStatus}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">Agent Training Progress</span>
                    <div className="w-full bg-indigo-950 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="bg-indigo-400 h-full rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Model Tuning Section */}
      {tuningParams.length > 0 && (
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold">AI Model Hyperparameter Tuning</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tuningParams.map((param, i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-900">{param.parameter}</span>
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    Suggested: {param.suggestedValue}
                  </span>
                </div>
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" 
                    max={param.suggestedValue * 2} 
                    step={param.suggestedValue / 10}
                    value={param.currentValue}
                    onChange={(e) => handleTune(i, parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>0</span>
                    <span>Current: {param.currentValue}</span>
                    <span>{param.suggestedValue * 2}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 italic">
                  <span className="font-bold text-indigo-600">Impact:</span> {param.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Analysis Section */}
      {result.cohortAnalysis && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold">Cohort Analysis & Population Statistics</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Biomarker Frequency Chart */}
            <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Biomarker Frequency (Cohort vs Global)</h4>
                <Activity className="w-5 h-5 text-zinc-300" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.cohortAnalysis.biomarkerStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="biomarker" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} unit="%" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="cohortFrequency" name="Cohort" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="globalFrequency" name="Global Average" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drug Response Efficacy Chart */}
            <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Expected Drug Efficacy (Cohort vs Global)</h4>
                <FlaskConical className="w-5 h-5 text-zinc-300" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.cohortAnalysis.drugResponseStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="drugName" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} unit="%" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="expectedEfficacy" name="Cohort Efficacy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="globalAverageEfficacy" name="Global Average" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Cohort Insights</span>
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">
              {result.cohortAnalysis.insights}
            </p>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Drug Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold px-2">Clinical Evidence & FDA Status</h3>
          {result.recommendedDrugs.map((drug, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{drug.name}</h4>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold uppercase bg-zinc-900 text-white px-2 py-0.5 rounded tracking-tighter">
                    {drug.evidenceLevel}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded tracking-tighter">
                    {drug.fdaStatus}
                  </span>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Confidence Score</span>
                  <span className="text-[10px] font-bold text-emerald-600">{(drug.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${drug.confidence * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>

              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{drug.mechanism}</p>

              {/* Side Effects & Contraindications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {drug.sideEffects && drug.sideEffects.length > 0 && (
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Side Effects</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {drug.sideEffects.map((se, j) => (
                        <span key={j} className="text-[9px] font-medium text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-100">
                          {se}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {drug.contraindications && drug.contraindications.length > 0 && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Contraindications</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {drug.contraindications.map((ci, j) => (
                        <span key={j} className="text-[9px] font-medium text-amber-600 bg-white px-1.5 py-0.5 rounded border border-amber-100">
                          {ci}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interaction Links */}
              {drug.interactionLinks && drug.interactionLinks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link2 className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Interaction Resources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {drug.interactionLinks.map((link, j) => (
                      <a 
                        key={j} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2 hover:bg-indigo-100 transition-all group/link"
                      >
                        <Database className="w-3 h-3 text-indigo-400 group-hover/link:text-indigo-600" />
                        {link.source}
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {drug.clinicalTrials && drug.clinicalTrials.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Active Clinical Trials</span>
                  <div className="space-y-2">
                    {drug.clinicalTrials.map((trial, j) => (
                      <a 
                        key={j} 
                        href={trial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 bg-white border border-zinc-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group/trial"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{trial.id}</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{trial.phase}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-tight group-hover/trial:text-zinc-900 transition-colors">
                          {trial.title}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Drug Interaction & Regimen Analysis */}
      <DrugInteractionAnalysis 
        interactions={result.drugInteractions} 
        regimen={result.suggestedRegimen} 
      />

      {/* GO Enrichment Analysis */}
      {result.goEnrichment && result.goEnrichment.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-semibold">Gene Ontology (GO) Enrichment</h3>
          </div>
          
          <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Top Enriched GO Terms</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-500 font-medium">Biological Process</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-zinc-500 font-medium">Molecular Function</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-zinc-500 font-medium">Cellular Component</span>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.goEnrichment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" domain={[0, 'auto']} hide />
                  <YAxis dataKey="term" type="category" axisLine={false} tickLine={false} fontSize={9} width={180} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`p = ${value.toExponential(2)}`, 'Significance']}
                  />
                  <Bar dataKey="pValue" radius={[0, 4, 4, 0]} barSize={15}>
                    {result.goEnrichment.map((entry, index) => {
                      let color = '#10b981'; // BP
                      if (entry.category === 'Molecular Function') color = '#3b82f6';
                      if (entry.category === 'Cellular Component') color = '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.goEnrichment.map((go, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded mb-1 inline-block ${
                      go.category === 'Biological Process' ? 'bg-emerald-100 text-emerald-700' :
                      go.category === 'Molecular Function' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {go.category}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 leading-tight">{go.term}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">p={go.pValue.toExponential(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {go.genes.slice(0, 8).map((gene, j) => (
                    <span key={j} className="text-[9px] font-medium text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-100">
                      {gene}
                    </span>
                  ))}
                  {go.genes.length > 8 && (
                    <span className="text-[9px] font-medium text-zinc-400 px-1.5 py-0.5">
                      +{go.genes.length - 8} more
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Literature Insights & Study Analysis */}
      {result.literatureInsights && result.literatureInsights.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Literature Insights & Study Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {result.literatureInsights.map((insight, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Microscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-zinc-900">{insight.title}</h4>
                  </div>
                  {insight.sourceUrl && (
                    <a 
                      href={insight.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Source
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                      <ListChecks className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Key Findings & Advancements</span>
                    </div>
                    <ul className="space-y-3">
                      {insight.keyFindings.map((finding, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-zinc-600 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-400 mb-3">
                      <BrainCircuit className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Relevance to Case</span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed italic">
                      {insight.relevance}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Database References */}
      {result.relevantDatabases && result.relevantDatabases.length > 0 && (
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold">Bioinformatics Database References</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.relevantDatabases.map((db, i) => (
              <a 
                key={i}
                href={db.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-100 transition-all"
              >
                <span className="text-sm font-medium text-zinc-700 group-hover:text-indigo-700">{db.name}</span>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Risk & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-zinc-900 text-white rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-semibold">Clinical Risk Assessment</h3>
          </div>
          <p className="text-zinc-400 leading-relaxed italic">
            "{result.riskAssessment}"
          </p>
        </div>

        <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <ListChecks className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-semibold text-zinc-900">Suggested Next Steps</h3>
          </div>
          <ul className="space-y-4">
            {result.suggestedNextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                <div className="w-5 h-5 rounded-full bg-emerald-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                  {i + 1}
                </div>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Table for ML/DL */}
        {result.featureTable && result.featureTable.length > 0 && (
          <div className="lg:col-span-3 p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Table className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-semibold text-zinc-900">Feature Table for ML/DL</h3>
              </div>
              <button 
                onClick={() => {
                  const headers = Object.keys(result.featureTable[0]).join(',');
                  const rows = result.featureTable.map(row => {
                    return Object.values(row).map(val => 
                      typeof val === 'object' ? JSON.stringify(val).replace(/,/g, ';') : val
                    ).join(',');
                  }).join('\n');
                  const csv = `${headers}\n${rows}`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('hidden', '');
                  a.setAttribute('href', url);
                  a.setAttribute('download', 'vcf_features.csv');
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
            <div className="overflow-x-auto -mx-8 px-8">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Variant</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Genotype</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Gene/Impact</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">gnomAD AF</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">ClinVar</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">ACMG</th>
                  </tr>
                </thead>
                <tbody>
                  {result.featureTable.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-zinc-900">{row.CHROM}:{row.POS}</div>
                        <div className="text-[10px] text-zinc-400">{row.REF} &rarr; {row.ALT}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs font-medium text-zinc-700">{row.GT}</div>
                        <div className="text-[10px] text-zinc-400">DP: {row.DP} | VAF: {row.VAF}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs font-bold text-indigo-600">{row.ANN.gene}</div>
                        <div className="text-[10px] text-zinc-500">{row.ANN.proteinChange} ({row.ANN.impact})</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs font-medium text-zinc-700">{row.gnomAD_AF.global}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                            row.clinVarSignificance?.toLowerCase().includes('pathogenic') 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {row.clinVarSignificance || 'N/A'}
                          </span>
                          <ClinVarDetails 
                            chrom={row.CHROM} 
                            pos={row.POS} 
                            ref={row.REF} 
                            alt={row.ALT} 
                            rsid={row.ID} 
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {row.acmgCriteria?.map((c, j) => (
                            <span key={j} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                              {c}
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
        )}
      </div>
    </div>
  );
};
