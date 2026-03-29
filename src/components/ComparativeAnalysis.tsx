import React, { useState } from 'react';
import { ComparisonResult } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { QCDashboard } from './QCDashboard';
import { HeterogeneityDashboard } from './HeterogeneityDashboard';
import { CNVDashboard } from './CNVDashboard';
import { ClinVarDetails } from './ClinVarDetails';
import { GitCompare, Users, User, ShieldAlert, Pill, Info, CheckCircle2, AlertCircle, AlertTriangle, ExternalLink, Database, FileSearch, X, ListChecks, Table, Activity, Download, BookOpen, BrainCircuit, Cpu, Layers } from 'lucide-react';

interface ComparativeAnalysisProps {
  result: ComparisonResult;
  onTrainClassifier?: () => void;
  isTraining?: boolean;
  trainingResult?: string | null;
  cumulativeCount?: number;
  onShowReport?: () => void;
}

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ 
  result,
  onTrainClassifier,
  isTraining,
  trainingResult,
  cumulativeCount = 0,
  onShowReport
}) => {
  const [selectedCell, setSelectedCell] = useState<{ variant: string; sample: string } | null>(null);

  const getVariantDetails = (variantId: string) => {
    // Try to find in shared variants
    const shared = result.sharedVariants.find(v => v.location === variantId || v.location.includes(variantId));
    if (shared) return shared;
    
    // Try to find in unique variants
    for (const sample of result.uniqueVariants) {
      const unique = sample.variants.find(v => v.location === variantId || v.location.includes(variantId));
      if (unique) return unique;
    }
    
    return null;
  };

  const VariantTooltip = ({ variant, isSelected, onClose }: { variant: any; isSelected?: boolean; onClose?: () => void }) => (
    <div className={`absolute bottom-full left-0 mb-2 w-64 p-4 bg-zinc-900 text-white rounded-2xl shadow-2xl z-50 border border-white/10 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-emerald-400 font-mono">{variant.location}</span>
          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">AI-Driven Prediction</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase bg-white/10 text-white px-1.5 py-0.5 rounded">
            {variant.functionalImpact}
          </span>
          {isSelected && onClose && (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-0.5 hover:bg-white/10 rounded transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold">{variant.ref}</span>
        <span className="text-zinc-500">→</span>
        <span className="text-sm font-bold text-emerald-400">{variant.alt}</span>
      </div>
      <p className="text-[10px] text-zinc-400 mb-2 leading-tight">{variant.impact}</p>
      {variant.clinicalSignificance && (
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
          <span className="text-[9px] font-medium text-emerald-300">{variant.clinicalSignificance}</span>
        </div>
      )}
      {variant.externalLinks && variant.externalLinks.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
          {variant.externalLinks.map((link: any, idx: number) => (
            <div key={idx} className="text-[8px] bg-white/5 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
              <Database className="w-2 h-2" />
              {link.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
          <GitCompare className="w-3 h-3" />
          Comparative Genomics Analysis
        </div>
        <h2 className="text-4xl font-bold text-zinc-900 mb-4 tracking-tight">Cross-Sample Variant Comparison</h2>
        <p className="text-zinc-500 leading-relaxed mb-8">
          {result.comparativeInsights}
        </p>
        
        {result.markdownReport && (
          <div className="flex justify-center mb-12">
            <button 
              onClick={onShowReport}
              className="flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 group"
            >
              <FileSearch className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              Generate Full Report (PDF)
            </button>
          </div>
        )}
      </div>

      {/* VCF-ClinAI-Pro Parsing & Quality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <h3 className="text-xl font-semibold">Comparative ICD-10 Clinical Interpretations</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Cross-Sample Diagnostic Context</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.icd10Interpretations.map((icd, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-emerald-400 font-mono">{icd.code}</span>
                    <div className="flex flex-col items-end">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] mb-1" />
                      {icd.sampleName && (
                        <span className="text-[8px] font-bold uppercase bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                          {icd.sampleName}
                        </span>
                      )}
                    </div>
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

      {/* Variant Frequency Heatmap */}
      {result.variantHeatmapData && result.variantHeatmapData.length > 0 && (
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Database className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold">Comparative Variant Prevalence</h3>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header Row (Samples) */}
              <div className="flex mb-4">
                <div className="w-48 shrink-0" /> {/* Spacer for variant names */}
                <div className="flex flex-1 justify-around">
                  {result.variantHeatmapData[0].sampleData.map((s, i) => (
                    <div 
                      key={i} 
                      className={`text-[10px] font-bold uppercase tracking-widest text-center px-2 transition-colors duration-300 ${selectedCell?.sample === s.sampleName ? 'text-indigo-600' : 'text-zinc-400'}`}
                    >
                      {s.sampleName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2">
                {result.variantHeatmapData.map((row, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center group rounded-xl transition-all duration-300 ${selectedCell?.variant === row.variant ? 'bg-indigo-50/50 ring-1 ring-indigo-100' : ''}`}
                  >
                    <div className="w-48 shrink-0 pr-4 relative">
                      <span className={`text-[11px] font-bold font-mono truncate block transition-colors cursor-help ${selectedCell?.variant === row.variant ? 'text-indigo-600' : 'text-zinc-600 group-hover:text-indigo-600'}`}>
                        {row.variant}
                      </span>
                      {getVariantDetails(row.variant) && (
                        <VariantTooltip 
                          variant={getVariantDetails(row.variant)} 
                          isSelected={selectedCell?.variant === row.variant}
                          onClose={() => setSelectedCell(null)}
                        />
                      )}
                    </div>
                    <div className={`flex flex-1 justify-around items-center h-10 rounded-xl border transition-all duration-300 ${selectedCell?.variant === row.variant ? 'bg-white border-indigo-200 shadow-sm' : 'bg-zinc-50/50 border-zinc-100/50 group-hover:bg-zinc-50'}`}>
                      {row.sampleData.map((s, j) => {
                        // Calculate color based on frequency
                        const opacity = Math.max(0.1, s.frequency);
                        const isSelected = selectedCell?.variant === row.variant && selectedCell?.sample === s.sampleName;
                        const colorClass = s.frequency > 0.7 ? 'bg-indigo-600' : s.frequency > 0.3 ? 'bg-indigo-400' : 'bg-indigo-200';
                        
                        return (
                          <div 
                            key={j} 
                            className={`relative flex items-center justify-center w-full h-full group/cell cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                            onClick={() => setSelectedCell({ variant: row.variant, sample: s.sampleName })}
                          >
                            <div 
                              className={`w-6 h-6 rounded-md transition-all duration-500 ${colorClass} ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-600 shadow-lg shadow-indigo-200' : ''}`}
                              style={{ opacity: isSelected ? 1 : opacity }}
                            />
                            {/* Tooltip */}
                            <div className={`absolute bottom-full mb-2 z-20 transition-all duration-200 ${isSelected ? 'block' : 'hidden group-hover/cell:block'}`}>
                              <div className="bg-zinc-900 text-white text-[9px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/10">
                                <span className="font-bold">{s.sampleName}</span>: {(s.frequency * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 flex items-center justify-end gap-6 border-t border-zinc-50 pt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prevalence Legend:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-indigo-200" />
                    <span className="text-[9px] text-zinc-500">Low (&lt;30%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-indigo-400" />
                    <span className="text-[9px] text-zinc-500">Medium (30-70%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-indigo-600" />
                    <span className="text-[9px] text-zinc-500">High (&gt;70%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparative QC Metrics */}
      {result.qcMetrics && (
        <QCDashboard metrics={result.qcMetrics} />
      )}

      {/* Tumour Heterogeneity Dashboard */}
      {result.clonalArchitecture && (
        <HeterogeneityDashboard architecture={result.clonalArchitecture} />
      )}

      {/* Comparative CNV Analysis */}
      {result.cnvAnalysis && result.cnvAnalysis.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold">Comparative Copy Number Variation (CNV)</h3>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {result.cnvAnalysis.map((sample, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <h4 className="text-lg font-bold text-zinc-900">{sample.sampleName} Analysis</h4>
                </div>
                <CNVDashboard data={sample.analysis} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-semibold">Shared Variants (Across All Samples)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.sharedVariants.map((variant, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-2 relative group/header">
                <span className="text-xs font-bold text-emerald-700 font-mono cursor-help">{variant.location}</span>
                <VariantTooltip variant={variant} />
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Shared</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-bold text-emerald-600/70 uppercase">AI Predicted</span>
                    <span className="text-[9px] font-bold uppercase bg-zinc-900 text-white px-1.5 py-0.5 rounded tracking-tighter">
                      {variant.functionalImpact}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-zinc-900">{variant.ref}</span>
                <span className="text-zinc-400">→</span>
                <span className="text-sm font-bold text-emerald-600">{variant.alt}</span>
              </div>
              <p className="text-xs text-zinc-600 mb-3 leading-relaxed">{variant.impact}</p>
              <div className="flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-700">{variant.clinicalSignificance}</span>
                {variant.populationFrequency && (
                  <span className="text-[9px] font-bold text-emerald-800/60 ml-auto bg-emerald-100/50 px-1.5 py-0.5 rounded">
                    Freq: {variant.populationFrequency}
                  </span>
                )}
              </div>
              {variant.hpoTerms && variant.hpoTerms.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Info className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-tighter">Phenotype Associations (HPO)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {variant.hpoTerms.map((hpo, idx) => (
                      <a 
                        key={idx} 
                        href={`https://hpo.jax.org/app/browse/term/${hpo.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[8px] bg-emerald-100/50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200/50 hover:bg-emerald-200 transition-colors flex items-center gap-1 group/hpo"
                        title={`View details for ${hpo.id}: ${hpo.term}`}
                      >
                        {hpo.term}
                        <ExternalLink className="w-2 h-2 opacity-50 group-hover/hpo:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {variant.externalLinks && variant.externalLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-emerald-100">
                  {variant.externalLinks.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] bg-white text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                    >
                      <Database className="w-2.5 h-2.5" />
                      {link.name}
                      <ExternalLink className="w-2 h-2 opacity-50" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Unique Variants per Sample */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <User className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-semibold">Unique Sample Variations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {result.uniqueVariants.map((sample, i) => (
            <div key={i} className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl">
              <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                {sample.sampleName}
              </h4>
              <div className="space-y-3">
                {sample.variants.map((variant, j) => (
                  <div key={j} className="p-4 bg-white border border-zinc-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2 relative group/header">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono cursor-help">{variant.location}</span>
                      <VariantTooltip variant={variant} />
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-indigo-600">{variant.ref} → {variant.alt}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-bold text-zinc-400 uppercase">AI Predicted</span>
                          <span className="text-[8px] font-bold uppercase bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                            {variant.functionalImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 mb-3 leading-relaxed">{variant.impact}</p>
                    {variant.clinicalSignificance && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] font-medium text-indigo-700">{variant.clinicalSignificance}</span>
                        {(variant as any).populationFrequency && (
                          <span className="text-[9px] font-bold text-indigo-800/60 ml-auto bg-indigo-100/50 px-1.5 py-0.5 rounded">
                            Freq: {(variant as any).populationFrequency}
                          </span>
                        )}
                      </div>
                    )}
                    {variant.externalLinks && variant.externalLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-50">
                        {variant.externalLinks.map((link, idx) => (
                          <a 
                            key={idx} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] bg-zinc-50 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-100 flex items-center gap-1 hover:bg-zinc-100 transition-colors"
                          >
                            <Database className="w-2.5 h-2.5" />
                            {link.name}
                            <ExternalLink className="w-2 h-2 opacity-50" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drug Response Impact */}
      <div className="p-8 bg-zinc-900 text-white rounded-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Pill className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-semibold">Comparative Drug Response Impact</h3>
        </div>
        <div className="space-y-6">
          {result.drugResponseImpact.map((impact, i) => (
            <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-amber-400">{impact.drugName}</h4>
                <div className="flex gap-2">
                  {impact.affectedSamples.map((s, j) => (
                    <span key={j} className="text-[9px] font-bold uppercase bg-white/10 text-white/70 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {impact.impactDescription}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Table for ML/DL */}
      {result.featureTable && result.featureTable.length > 0 && (
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
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
                a.setAttribute('download', 'comparative_features.csv');
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
                  <th className="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Sample/Genotype</th>
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
                      <div className="text-xs font-bold text-zinc-900">{row.SAMPLE}</div>
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

      {/* Suggested Next Steps */}
      {result.suggestedNextSteps && result.suggestedNextSteps.length > 0 && (
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
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Clinical Disclaimer:</strong> This comparative analysis is generated for research purposes only. Variations detected across samples should be validated through certified clinical sequencing and interpreted by a qualified geneticist or medical professional.
        </p>
      </div>
    </div>
  );
};
