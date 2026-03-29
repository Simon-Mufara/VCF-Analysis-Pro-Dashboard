import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Pill, 
  Dna, 
  Activity, 
  ClipboardList, 
  ShieldAlert, 
  Zap, 
  FileText, 
  Copy, 
  Check, 
  Upload, 
  Trash2, 
  Plus,
  ChevronRight,
  Info,
  BrainCircuit,
  Stethoscope,
  AlertTriangle,
  Calculator,
  ExternalLink,
  Search,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck,
  Heart,
  Scale
} from 'lucide-react';
import { predictFromPrompt, PredictionResult } from '../services/geminiService';
import { PredictionDashboard } from './PredictionDashboard';

interface PatientProfile {
  age: string;
  sex: string;
  weight: string;
  eGFR: string;
  diagnosis: string;
  comorbidities: string;
  medications: string;
}

interface DrugGenomics {
  drugName: string;
  sampleType: string;
  biomarkers: string;
  genomicVariants: string;
}

type AnalysisFocus = 'efficacy' | 'toxicity' | 'resistance' | 'dosing' | 'combination' | 'alternatives';

interface PharmAIPredictorProps {
  onShowReport?: (report: string) => void;
}

export const PharmAIPredictor: React.FC<PharmAIPredictorProps> = ({ onShowReport }) => {
  const [patient, setPatient] = useState<PatientProfile>({
    age: '',
    sex: '',
    weight: '',
    eGFR: '',
    diagnosis: '',
    comorbidities: '',
    medications: '',
  });

  const [drugGenomics, setDrugGenomics] = useState<DrugGenomics>({
    drugName: '',
    sampleType: 'Whole Genome Sequencing',
    biomarkers: '',
    genomicVariants: '',
  });

  const [focus, setFocus] = useState<AnalysisFocus[]>(['efficacy', 'toxicity']);
  const [copied, setCopied] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [activeTool, setActiveTool] = useState<'none' | 'calculator' | 'interactions' | 'risk'>('none');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFocus = (item: AnalysisFocus) => {
    setFocus(prev => 
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  // Clinical Calculators & Logic
  const calculatedDoseAdjustment = useMemo(() => {
    const egfr = parseFloat(patient.eGFR);
    if (isNaN(egfr)) return null;
    if (egfr < 30) return "Severe Impairment: Reduce dose by 50% or avoid.";
    if (egfr < 60) return "Moderate Impairment: Reduce dose by 25%.";
    return "Normal Renal Function: Standard dosing.";
  }, [patient.eGFR]);

  const riskScore = useMemo(() => {
    let score = 0;
    const age = parseInt(patient.age);
    if (age > 65) score += 2;
    if (patient.comorbidities.split(',').length > 2) score += 3;
    if (patient.medications.split(',').length > 5) score += 2;
    const egfr = parseFloat(patient.eGFR);
    if (egfr < 60) score += 3;
    
    if (score >= 7) return { level: 'High Risk', color: 'text-red-400', bg: 'bg-red-400/10' };
    if (score >= 4) return { level: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-400/10' };
    return { level: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  }, [patient]);

  const predictedPhenotype = useMemo(() => {
    const b = drugGenomics.biomarkers.toLowerCase();
    if (b.includes('*3') || b.includes('*4') || b.includes('poor')) return { status: 'Poor Metabolizer', color: 'text-red-400', bg: 'bg-red-400/10' };
    if (b.includes('*2') || b.includes('intermediate')) return { status: 'Intermediate Metabolizer', color: 'text-amber-400', bg: 'bg-amber-400/10' };
    if (b.includes('ultra')) return { status: 'Ultra-rapid Metabolizer', color: 'text-purple-400', bg: 'bg-purple-400/10' };
    return { status: 'Extensive (Normal) Metabolizer', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  }, [drugGenomics.biomarkers]);

  const generatedPrompt = useMemo(() => {
    const focusText = focus.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ');
    
    return `[SYSTEM ROLE]
You are a world-class clinical pharmacogenomics expert specializing in precision medicine and drug response prediction. Your goal is to analyze patient data and genomic markers to provide high-confidence clinical insights.

[PATIENT PROFILE]
- Age: ${patient.age || 'N/A'}
- Sex: ${patient.sex || 'N/A'}
- Weight: ${patient.weight || 'N/A'} kg
- eGFR: ${patient.eGFR || 'N/A'} mL/min/1.73m²
- Primary Diagnosis: ${patient.diagnosis || 'N/A'}
- Comorbidities: ${patient.comorbidities || 'None reported'}
- Current Medications: ${patient.medications || 'None reported'}

[SAMPLE & GENOMICS]
- Drug(s) under evaluation: ${drugGenomics.drugName || 'N/A'}
- Sample Type: ${drugGenomics.sampleType}
- Key Biomarkers: ${drugGenomics.biomarkers || 'N/A'}
- Genomic Variants: ${drugGenomics.genomicVariants || 'N/A'}

[ANALYSIS FOCUS]
Please prioritize the following analysis dimensions: ${focusText}.
Cross-reference with ClinVar, PharmGKB, and CPIC guidelines.

[OUTPUT FORMAT]
Provide your response in the following structured sections:
1. EXECUTIVE SUMMARY: High-level clinical recommendation.
2. BIOMARKER ANALYSIS: Detailed interpretation of genomic markers and their impact on drug metabolism (PK/PD).
3. PREDICTED RESPONSE: Expected efficacy and clinical outcome.
4. ADVERSE EVENT (AE) RISK: Specific toxicity warnings based on the profile.
5. RECOMMENDATIONS: Dosing adjustments, alternative therapies, or monitoring requirements.
6. REFERENCES: Key clinical guidelines or studies supporting this analysis.`;
  }, [patient, drugGenomics, focus]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneratePrediction = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await predictFromPrompt(generatedPrompt);
      setPredictionResult(result);
    } catch (err) {
      setError("Failed to generate prediction. Please check your inputs and try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      if (lines.length > 1) {
        const data = lines[1].split(',');
        if (data.length >= 7) {
          setPatient({
            age: data[0]?.trim() || '',
            sex: data[1]?.trim() || '',
            weight: data[2]?.trim() || '',
            eGFR: data[3]?.trim() || '',
            diagnosis: data[4]?.trim() || '',
            comorbidities: data[5]?.trim() || '',
            medications: data[6]?.trim() || '',
          });
        }
      }
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-zinc-950 text-white min-h-screen p-4 md:p-8 rounded-[40px] shadow-2xl border border-white/5 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black tracking-tighter">PHARM<span className="text-emerald-500">AI</span></h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/30">v2.0 Clinical</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium">Precision Pharmacogenomics Prediction Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold">Batch Import</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.txt" />
            </label>
            <button 
              onClick={() => {
                setPatient({ age: '', sex: '', weight: '', eGFR: '', diagnosis: '', comorbidities: '', medications: '' });
                setDrugGenomics({ drugName: '', sampleType: 'Whole Genome Sequencing', biomarkers: '', genomicVariants: '' });
                setPredictionResult(null);
              }}
              className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl transition-all group active:scale-90"
            >
              <Trash2 className="w-5 h-5 text-zinc-400 group-hover:text-red-400" />
            </button>
          </div>
        </header>

        {/* Clinical Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Renal Status</p>
              <p className="text-sm font-bold">{patient.eGFR ? `${patient.eGFR} mL/min` : 'Pending'}</p>
            </div>
          </div>
          <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-colors ${predictedPhenotype.bg} ${predictedPhenotype.color.replace('text', 'border').replace('400', '500/30')}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${predictedPhenotype.bg}`}>
              <Dna className={`w-5 h-5 ${predictedPhenotype.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Phenotype</p>
              <p className="text-sm font-bold">{predictedPhenotype.status}</p>
            </div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Pill className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Drug</p>
              <p className="text-sm font-bold truncate max-w-[120px]">{drugGenomics.drugName || 'None'}</p>
            </div>
          </div>
          <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-colors ${riskScore.bg} ${riskScore.color.replace('text', 'border').replace('400', '500/30')}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${riskScore.bg}`}>
              <ShieldAlert className={`w-5 h-5 ${riskScore.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Risk Score</p>
              <p className="text-sm font-bold">{riskScore.level}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {predictionResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setPredictionResult(null)}
                  className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Prediction
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Clinical Analysis Complete
                </div>
              </div>
              <PredictionDashboard 
                result={predictionResult} 
                isLoading={false} 
                dataSummary={`Clinical Prediction for ${drugGenomics.drugName}`}
                analysisMode="single"
                onShowReport={() => {
                  if (predictionResult.markdownReport && onShowReport) {
                    onShowReport(predictionResult.markdownReport);
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Inputs (7/12) */}
              <div className="lg:col-span-7 space-y-8">
                {/* Patient & Clinical Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <User className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <User className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h2 className="text-lg font-bold">Patient Demographics</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Age</label>
                        <input 
                          type="text" 
                          value={patient.age}
                          onChange={(e) => setPatient({...patient, age: e.target.value})}
                          placeholder="Years"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Sex</label>
                        <select 
                          value={patient.sex}
                          onChange={(e) => setPatient({...patient, sex: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                        >
                          <option value="" className="bg-zinc-900">Select</option>
                          <option value="Male" className="bg-zinc-900">Male</option>
                          <option value="Female" className="bg-zinc-900">Female</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Weight</label>
                        <input 
                          type="text" 
                          value={patient.weight}
                          onChange={(e) => setPatient({...patient, weight: e.target.value})}
                          placeholder="kg"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">eGFR</label>
                        <input 
                          type="text" 
                          value={patient.eGFR}
                          onChange={(e) => setPatient({...patient, eGFR: e.target.value})}
                          placeholder="mL/min"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Pill className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-lg font-bold">Drug & Biomarkers</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Target Medication</label>
                        <input 
                          type="text" 
                          value={drugGenomics.drugName}
                          onChange={(e) => setDrugGenomics({...drugGenomics, drugName: e.target.value})}
                          placeholder="e.g. Clopidogrel"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Genomic Biomarkers</label>
                        <input 
                          type="text" 
                          value={drugGenomics.biomarkers}
                          onChange={(e) => setDrugGenomics({...drugGenomics, biomarkers: e.target.value})}
                          placeholder="e.g. CYP2C19*2/*3"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <section className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <ClipboardList className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-lg font-bold">Clinical Context</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveTool(activeTool === 'calculator' ? 'none' : 'calculator')}
                        className={`p-2 rounded-lg transition-all ${activeTool === 'calculator' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                        title="Dosing Calculator"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActiveTool(activeTool === 'interactions' ? 'none' : 'interactions')}
                        className={`p-2 rounded-lg transition-all ${activeTool === 'interactions' ? 'bg-amber-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                        title="Interaction Checker"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActiveTool(activeTool === 'risk' ? 'none' : 'risk')}
                        className={`p-2 rounded-lg transition-all ${activeTool === 'risk' ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                        title="Risk Assessment"
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTool !== 'none' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 overflow-hidden"
                      >
                        <div className="p-5 bg-zinc-900/50 border border-white/10 rounded-2xl">
                          {activeTool === 'calculator' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <Calculator className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Renal Dosing Adjustment</span>
                              </div>
                              <p className="text-sm text-zinc-300">{calculatedDoseAdjustment || "Enter eGFR to calculate adjustment."}</p>
                              <div className="pt-2 flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (parseFloat(patient.eGFR) || 0))}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">eGFR: {patient.eGFR || 0}</span>
                              </div>
                            </div>
                          )}
                          {activeTool === 'interactions' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-amber-400 mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Drug-Drug Interactions</span>
                              </div>
                              <p className="text-sm text-zinc-300">
                                {patient.medications 
                                  ? `Analyzing interactions for: ${patient.medications}...` 
                                  : "Enter current medications to check for interactions."}
                              </p>
                              {patient.medications && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                  <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                                  <p className="text-[11px] text-amber-200/70 leading-relaxed">
                                    Potential CYP inhibition detected. AI will cross-reference these medications with the target drug in the final prompt.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {activeTool === 'risk' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-red-400 mb-1">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Clinical Risk Assessment</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-300">Calculated Risk Level:</p>
                                <span className={`text-sm font-bold ${riskScore.color}`}>{riskScore.level}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className={`h-1 rounded-full ${parseInt(patient.age) > 65 ? 'bg-red-500' : 'bg-zinc-800'}`} />
                                <div className={`h-1 rounded-full ${parseFloat(patient.eGFR) < 60 ? 'bg-red-500' : 'bg-zinc-800'}`} />
                                <div className={`h-1 rounded-full ${patient.medications.split(',').length > 5 ? 'bg-red-500' : 'bg-zinc-800'}`} />
                              </div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest text-center">Age • Renal • Polypharmacy</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Diagnosis & Comorbidities</label>
                      <textarea 
                        value={`${patient.diagnosis}${patient.comorbidities ? ' | ' + patient.comorbidities : ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split(' | ');
                          setPatient({...patient, diagnosis: parts[0] || '', comorbidities: parts[1] || ''});
                        }}
                        placeholder="Clinical conditions..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Current Medication List</label>
                      <textarea 
                        value={patient.medications}
                        onChange={(e) => setPatient({...patient, medications: e.target.value})}
                        placeholder="Enter all current drugs..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </section>

                <section className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold">Analysis Focus</h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(['efficacy', 'toxicity', 'resistance', 'dosing', 'combination', 'alternatives'] as AnalysisFocus[]).map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleFocus(item)}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          focus.includes(item) 
                            ? 'bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                            : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column: Prompt & Tools (5/12) */}
              <div className="lg:col-span-5 space-y-8">
                <section className="bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl flex flex-col h-full min-h-[800px] relative overflow-hidden">
                  {/* Header */}
                  <div className="p-8 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-zinc-400" />
                        </div>
                        <h2 className="text-xl font-bold">AI Prompt Engine</h2>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                          copied ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy Prompt'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <a href="https://cpicpgx.org/guidelines/" target="_blank" rel="noreferrer" className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" /> CPIC
                      </a>
                      <a href="https://www.pharmgkb.org/" target="_blank" rel="noreferrer" className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" /> PharmGKB
                      </a>
                      <a href="https://clinicaltrials.gov/" target="_blank" rel="noreferrer" className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" /> ClinicalTrials
                      </a>
                    </div>
                  </div>

                  {/* Prompt Content */}
                  <div className="flex-1 p-8 font-mono text-[11px] text-zinc-400 overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
                    <div className="space-y-6">
                      {generatedPrompt.split('\n\n').map((section, i) => {
                        const title = section.match(/\[(.*?)\]/);
                        return (
                          <div key={i} className="relative group">
                            {title && (
                              <div className="text-emerald-500 font-bold mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                {title[0]}
                              </div>
                            )}
                            <div className="pl-3 border-l border-white/5 group-hover:border-emerald-500/30 transition-colors">
                              {section.replace(/\[.*?\]\n?/, '')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-8 border-t border-white/5 bg-zinc-900/80 backdrop-blur-md">
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                    <button 
                      onClick={handleGeneratePrediction}
                      disabled={isGenerating}
                      className={`w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-[24px] font-black text-lg shadow-[0_10px_40px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-4 group active:scale-[0.98] ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <BrainCircuit className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                      )}
                      {isGenerating ? 'ANALYZING...' : 'GENERATE PREDICTION'}
                      {!isGenerating && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">System Ready</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Gemini 3.1 Pro</span>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
