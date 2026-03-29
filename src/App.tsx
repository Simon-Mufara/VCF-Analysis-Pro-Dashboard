import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { getErrorMessage } from './lib/errors';
import { PredictionDashboard } from './components/PredictionDashboard';
import { ComparativeAnalysis } from './components/ComparativeAnalysis';
import { KnowledgeBase } from './components/KnowledgeBase';
import { PharmAIPredictor } from './components/PharmAIPredictor';
import { MarkdownReport } from './components/MarkdownReport';
import { UserGuide } from './components/UserGuide';
import { IGVBrowser } from './components/IGVBrowser';
import { predictDrugAndOutcome, compareGenomes, detectSamples, PredictionResult, ComparisonResult, SampleDetectionResult } from './services/geminiService';
import { Dna, Beaker, BrainCircuit, ChevronRight, Github, Info, Activity, ShieldCheck, Database, GitCompare, Settings2, Link2, BookOpen, ExternalLink, LayoutDashboard, Zap, AlertTriangle, UserCheck, LogIn, LogOut, History, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

interface AnalysisRecord {
  id: string;
  fileName: string;
  timestamp: any;
  summary: string;
  result: any;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayError = this.state.error?.message || "An unexpected error occurred.";
      let isFirebaseError = false;
      
      try {
        const parsed = JSON.parse(displayError);
        if (parsed.error && parsed.operationType) {
          displayError = `Firebase Error (${parsed.operationType}): ${parsed.error}`;
          isFirebaseError = true;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h2>
            <p className="text-zinc-500 mb-6">
              {isFirebaseError ? displayError : "An unexpected error occurred in the application. We've been notified and are looking into it."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-zinc-100 rounded-lg text-left text-xs overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSummary, setDataSummary] = useState<string | null>(null);
  const [trainingData, setTrainingData] = useState<string>("");
  const [studyUrls, setStudyUrls] = useState<string>("");
  const [studyTexts, setStudyTexts] = useState<string>("");
  const [manualVcfData, setManualVcfData] = useState<string>("");
  const [globalHealthMode, setGlobalHealthMode] = useState(false);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'pharm-ai' | 'comparison' | 'predictor' | 'guide' | 'igv' | 'history'>('analysis');
  const [sampleDetection, setSampleDetection] = useState<SampleDetectionResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'individual' | 'paired' | 'single' | 'cohort' | null>(null);
  const [selectedSampleName, setSelectedSampleName] = useState<string | null>(null);
  const [cumulativeKnowledgeBase, setCumulativeKnowledgeBase] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Firebase State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [pastAnalyses, setPastAnalyses] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Sync user profile to Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            });
          } else {
            await setDoc(userDocRef, {
              lastLogin: new Date().toISOString()
            }, { merge: true });
          }
          
          // Fetch past analyses
          fetchPastAnalyses(currentUser.uid);
        } catch (err) {
          console.error("Error syncing user profile:", err);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const fetchPastAnalyses = async (uid: string) => {
    try {
      const q = query(collection(db, 'analyses'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const analyses: AnalysisRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        analyses.push({
          id: doc.id,
          fileName: data.fileName,
          timestamp: data.timestamp,
          summary: data.summary,
          result: JSON.parse(data.result)
        });
      });
      setPastAnalyses(analyses.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      }));
    } catch (err) {
      console.error("Error fetching analyses:", err);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPastAnalyses([]);
      setUser(null);
    } catch (err) {
      setError("Failed to sign out.");
    }
  };

  const handleShowReport = (content: string) => {
    setReportContent(content);
    setShowReport(true);
  };

  const handleDataParsed = async (data: { summary: string; rawData: any; fileName: string }[], originalFiles: File[]) => {
    if (!data || data.length === 0) return;
    
    setUploadedFiles(originalFiles);
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setComparisonResult(null);
    setSampleDetection(null);
    setAnalysisMode(null);
    
    try {
      if (data.length === 1) {
        setDataSummary(data[0].summary);
        
        // Step 1: Detect Samples
        const detection = await detectSamples(data[0].summary);
        setSampleDetection(detection);

        if (detection.sampleNames.length > 1) {
          // Multi-sample VCF detected, wait for user selection
          setIsLoading(false);
          return;
        }

        // Single sample, proceed
        const urls = studyUrls.split('\n').map(u => u.trim()).filter(u => u !== "");
        const texts = studyTexts.split('\n\n').map(t => t.trim()).filter(t => t !== "");
        const result = await predictDrugAndOutcome(data[0].summary, trainingData, urls, texts, globalHealthMode);
        
        if (!result) {
          throw new Error("Analysis failed to produce a result. Please try again.");
        }
        
        setPrediction(result);
        if (result.featureTable) {
          setCumulativeKnowledgeBase(prev => [...prev, ...result.featureTable]);
        }

        // Save to Firestore if logged in
        if (user) {
          try {
            await addDoc(collection(db, 'analyses'), {
              userId: user.uid,
              fileName: data[0].fileName,
              result: JSON.stringify(result),
              summary: data[0].summary,
              timestamp: serverTimestamp()
            });
            fetchPastAnalyses(user.uid);
          } catch (err) {
            console.error("Error saving analysis:", err);
          }
        }
      } else {
        // Comparative analysis for multiple files
        const summaries = data.map(d => ({ fileName: d.fileName, content: d.summary }));
        const result = await compareGenomes(summaries, trainingData);
        
        if (!result) {
          throw new Error("Comparative analysis failed to produce a result.");
        }
        
        setComparisonResult(result);
        if (result.featureTable) {
          setCumulativeKnowledgeBase(prev => [...prev, ...result.featureTable]);
        }
        setDataSummary(`Comparative analysis of ${data.length} samples: ${data.map(d => d.fileName).join(', ')}`);

        // Save to Firestore if logged in
        if (user) {
          try {
            await addDoc(collection(db, 'analyses'), {
              userId: user.uid,
              fileName: `Comparative: ${data.map(d => d.fileName).join(', ')}`,
              result: JSON.stringify(result),
              summary: `Comparative analysis of ${data.length} samples.`,
              timestamp: serverTimestamp()
            });
            fetchPastAnalyses(user.uid);
          } catch (err) {
            console.error("Error saving comparative analysis:", err);
          }
        }
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithMultiSampleAnalysis = async (mode: 'individual' | 'paired' | 'single' | 'cohort', sampleName?: string) => {
    if (!dataSummary) return;
    setIsLoading(true);
    setAnalysisMode(mode);
    setSelectedSampleName(sampleName || null);

    try {
      const urls = studyUrls.split('\n').map(u => u.trim()).filter(u => u !== "");
      const texts = studyTexts.split('\n\n').map(t => t.trim()).filter(t => t !== "");
      
      let promptModifier = `\n\n[MERGED VCF PROTOCOL SELECTION]\nThe user has selected analysis mode: ${mode}.`;
      if (sampleName) promptModifier += `\nTarget Sample: ${sampleName}`;
      if (mode === 'cohort') promptModifier += `\nNOTE: This is a cohort-level research summary – not for individual diagnosis.`;

      const result = await predictDrugAndOutcome(dataSummary + promptModifier, trainingData, urls, texts, globalHealthMode);
      setPrediction(result);
      if (result.featureTable) {
        setCumulativeKnowledgeBase(prev => [...prev, ...result.featureTable]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAnalysis = async () => {
    if (!manualVcfData.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setComparisonResult(null);
    setSampleDetection(null);
    setAnalysisMode(null);
    setDataSummary(`Manual Input Analysis: ${manualVcfData.substring(0, 50)}...`);

    try {
      // Step 1: Detect Samples
      const detection = await detectSamples(manualVcfData);
      setSampleDetection(detection);

      if (detection.sampleNames.length > 1) {
        // Multi-sample VCF detected, wait for user selection
        setIsLoading(false);
        setDataSummary(manualVcfData); // Store full data for later
        return;
      }

      const urls = studyUrls.split('\n').map(u => u.trim()).filter(u => u !== "");
      const texts = studyTexts.split('\n\n').map(t => t.trim()).filter(t => t !== "");
      const result = await predictDrugAndOutcome(manualVcfData, trainingData, urls, texts, globalHealthMode);
      setPrediction(result);
      if (result.featureTable) {
        setCumulativeKnowledgeBase(prev => [...prev, ...result.featureTable]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setPrediction(null);
    setComparisonResult(null);
    setDataSummary(null);
    setError(null);
    setTrainingResult(null);
  };

  const trainClassifier = async () => {
    if (cumulativeKnowledgeBase.length < 5) {
      setError("At least 5 variants are required in the knowledge base to train a prototype classifier.");
      return;
    }

    setIsTraining(true);
    setTrainingResult(null);

    try {
      // Simulate training using Gemini to analyze the cumulative features
      const featuresJson = JSON.stringify(cumulativeKnowledgeBase.slice(-50)); // Limit context
      const response = await predictDrugAndOutcome(
        `[CLASSIFIER TRAINING REQUEST]\nTrain a prototype classifier (Logistic Regression/Random Forest simulation) on these cumulative features:\n${featuresJson}\n\nProvide a summary of the model performance, feature importance, and potential clusters.`,
        trainingData,
        [],
        [],
        globalHealthMode
      );
      
      setTrainingResult(response.riskAssessment); // Use riskAssessment as a proxy for the training summary
    } catch (err) {
      setError(getErrorMessage(err));
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleExportReport = () => {
    const analysisId = `BP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toLocaleString();
    
    // 1. Generate JSON Report
    const reportData = {
      analysisId,
      timestamp,
      prediction,
      comparison: comparisonResult,
      dataSummary,
      cumulativeKnowledgeBase
    };

    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `BioPredict_Data_${analysisId}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // 2. Generate Markdown Report
    let mdReport = `# BioPredict AI Analysis Report\n\n`;
    mdReport += `**Analysis ID:** ${analysisId}\n`;
    mdReport += `**Date:** ${timestamp}\n\n`;
    
    if (dataSummary) {
      mdReport += `## Data Summary\n${dataSummary}\n\n`;
    }

    if (prediction) {
      mdReport += `## Prediction Results\n`;
      mdReport += `### VCF Parsing Summary\n${prediction.vcfParsingSummary}\n\n`;
      mdReport += `### Quality & Filtering Summary\n${prediction.qualityFilteringSummary}\n\n`;
      mdReport += `### Primary Condition/Disease: ${prediction.disease}\n\n`;
      mdReport += `### Recommended Drugs\n`;
      prediction.recommendedDrugs.forEach(drug => {
        mdReport += `#### ${drug.name}\n`;
        mdReport += `- **Mechanism:** ${drug.mechanism}\n`;
        mdReport += `- **Confidence:** ${(drug.confidence * 100).toFixed(1)}%\n`;
        mdReport += `- **Potential Outcome:** ${drug.potentialOutcome}\n`;
        mdReport += `- **Evidence Level:** ${drug.evidenceLevel}\n`;
        mdReport += `- **FDA Status:** ${drug.fdaStatus}\n\n`;
      });
      
      mdReport += `## Clinician Summary\n\n`;
      if (prediction.clinicianSummary) {
        mdReport += `### Diagnosis: ${prediction.clinicianSummary.diagnosis}\n\n`;
        mdReport += `#### Key Findings\n`;
        prediction.clinicianSummary.keyFindings.forEach(f => mdReport += `- ${f}\n`);
        mdReport += `\n`;
        
        mdReport += `#### Actionable Variants\n`;
        mdReport += `| Gene | Variant | Significance |\n`;
        mdReport += `| --- | --- | --- |\n`;
        prediction.clinicianSummary.actionableVariants.forEach(v => {
          mdReport += `| ${v.gene} | ${v.variant} | ${v.clinicalSignificance} |\n`;
        });
        mdReport += `\n`;

        mdReport += `#### Therapeutic Recommendations\n`;
        prediction.clinicianSummary.drugRecommendations.forEach(d => {
          mdReport += `- **${d.drug}**: ${d.reasoning}\n`;
        });
        mdReport += `\n`;

        if (prediction.clinicianSummary.contraindications.length > 0) {
          mdReport += `#### Contraindications\n`;
          prediction.clinicianSummary.contraindications.forEach(c => mdReport += `- ${c}\n`);
          mdReport += `\n`;
        }
      }

      if (prediction.qcMetrics) {
        mdReport += `## Sequencing Quality Control\n`;
        mdReport += `- **Overall Status:** ${prediction.qcMetrics.status}\n`;
        mdReport += `- **Mapping Rate:** ${(prediction.qcMetrics.mappingRate * 100).toFixed(1)}%\n`;
        mdReport += `- **Mean Coverage:** ${prediction.qcMetrics.coverage.toFixed(1)}x\n`;
        mdReport += `- **Duplication Rate:** ${(prediction.qcMetrics.duplicationRate * 100).toFixed(1)}%\n`;
        mdReport += `- **Q30 Score:** ${prediction.qcMetrics.q30Score}%\n`;
        mdReport += `- **Uniformity:** ${(prediction.qcMetrics.uniformityScore * 100).toFixed(1)}%\n\n`;
        if (prediction.qcMetrics.reasoning) {
          mdReport += `### QC Insights\n${prediction.qcMetrics.reasoning}\n\n`;
        }
      }

      if (prediction.pathwayAnalysis) {
        mdReport += `## Biological Pathway Analysis\n\n`;
        mdReport += `${prediction.pathwayAnalysis.summary}\n\n`;
        prediction.pathwayAnalysis.pathways.forEach(p => {
          mdReport += `### Pathway: ${p.name} (${p.source})\n`;
          mdReport += `- **Disruption Score:** ${(p.disruptionScore * 100).toFixed(0)}%\n`;
          mdReport += `- **Description:** ${p.description}\n\n`;
          mdReport += `#### Mutated Nodes\n`;
          p.nodes.filter(n => n.isMutated).forEach(n => {
            mdReport += `- **${n.label}**: ${n.impact || 'Impact detected'}\n`;
          });
          mdReport += `\n`;
        });
      }

      mdReport += `### Risk Assessment\n${prediction.riskAssessment}\n\n`;
      
      if (prediction.clonalArchitecture) {
        mdReport += `### Tumour Heterogeneity & Clonal Architecture\n`;
        mdReport += `- **Evolutionary Model:** ${prediction.clonalArchitecture.evolutionaryModel}\n`;
        mdReport += `- **Evolutionary Insight:** ${prediction.clonalArchitecture.evolutionaryInsight}\n\n`;
        mdReport += `#### Subclone Clusters\n`;
        mdReport += `| ID | Type | Mean VAF | Prevalence | Variants | Key Genes |\n`;
        mdReport += `| --- | --- | --- | --- | --- | --- |\n`;
        prediction.clonalArchitecture.clusters.forEach(c => {
          mdReport += `| ${c.clusterId} | ${c.isClonal ? 'Clonal' : 'Subclonal'} | ${(c.meanVaf * 100).toFixed(1)}% | ${(c.prevalence * 100).toFixed(1)}% | ${c.variantCount} | ${c.genes.join(', ')} |\n`;
        });
        mdReport += `\n`;
      } else if (prediction.vafAnalysis) {
        mdReport += `### VAF Analysis\n`;
        mdReport += `- **Clonal Variants:** ${prediction.vafAnalysis.clonalVariants}\n`;
        mdReport += `- **Subclonal Variants:** ${prediction.vafAnalysis.subclonalVariants}\n\n`;
        if (prediction.vafAnalysis.clusters) {
          mdReport += `#### Subclonal Clusters\n`;
          prediction.vafAnalysis.clusters.forEach(c => {
            mdReport += `- **Cluster ${c.clusterId}:** Mean VAF: ${c.meanVaf.toFixed(3)}, Count: ${c.variantCount}\n`;
          });
          mdReport += `\n`;
        }
      }

      if (prediction.cnvAnalysis) {
        mdReport += `### CNV Analysis\n`;
        mdReport += `#### Significant Gene-level CNVs\n`;
        prediction.cnvAnalysis.significantGenes.forEach(g => {
          mdReport += `- **${g.gene}:** ${g.status} (log2: ${g.log2.toFixed(2)}, Type: ${g.type})\n`;
        });
        mdReport += `\n`;
      }

      if (prediction.msiAnalysis) {
        mdReport += `### MSI Analysis\n`;
        mdReport += `- **Status:** ${prediction.msiAnalysis.status}\n`;
        mdReport += `- **Score:** ${(prediction.msiAnalysis.score * 100).toFixed(1)}% (${prediction.msiAnalysis.unstableLoci}/${prediction.msiAnalysis.totalLoci} loci)\n`;
        mdReport += `- **Interpretation:** ${prediction.msiAnalysis.interpretation}\n\n`;
      }

      mdReport += `### Suggested Next Steps\n`;
      prediction.suggestedNextSteps.forEach(step => {
        mdReport += `- ${step}\n`;
      });
      mdReport += `\n`;

      if (prediction.featureTable && prediction.featureTable.length > 0) {
        mdReport += `### Feature Table for ML/DL\n`;
        mdReport += `| Variant | Genotype | Gene/Impact | gnomAD AF | Clonality | Cluster | ClinVar | ACMG |\n`;
        mdReport += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
        prediction.featureTable.forEach(row => {
          mdReport += `| ${row.CHROM}:${row.POS} | ${row.GT} (DP:${row.DP}) | ${row.ANN.gene} (${row.ANN.proteinChange}) | ${row.gnomAD_AF.global} | ${row.clonality || 'N/A'} | ${row.subcloneCluster ?? 'N/A'} | ${row.clinVarSignificance || 'N/A'} | ${row.acmgCriteria?.join(', ') || 'N/A'} |\n`;
        });
        mdReport += `\n`;
      }

      if (prediction.icd10Interpretations && prediction.icd10Interpretations.length > 0) {
        mdReport += `### ICD-10 Clinical Interpretations\n`;
        prediction.icd10Interpretations.forEach(icd => {
          mdReport += `- **${icd.code}:** ${icd.description}\n  *Relevance:* ${icd.relevance}\n`;
        });
        mdReport += `\n`;
      }
    }

    if (comparisonResult) {
      mdReport += `## Comparative Analysis Results\n`;
      mdReport += `### VCF Parsing Summary\n${comparisonResult.vcfParsingSummary}\n\n`;
      mdReport += `### Quality & Filtering Summary\n${comparisonResult.qualityFilteringSummary}\n\n`;
      mdReport += `### Insights\n${comparisonResult.comparativeInsights}\n\n`;
      
      if (comparisonResult.qcMetrics) {
        mdReport += `### Comparative Sequencing QC\n`;
        mdReport += `- **Overall Status:** ${comparisonResult.qcMetrics.status}\n`;
        mdReport += `- **Mapping Rate:** ${(comparisonResult.qcMetrics.mappingRate * 100).toFixed(1)}%\n`;
        mdReport += `- **Mean Coverage:** ${comparisonResult.qcMetrics.coverage.toFixed(1)}x\n`;
        mdReport += `- **Duplication Rate:** ${(comparisonResult.qcMetrics.duplicationRate * 100).toFixed(1)}%\n`;
        mdReport += `- **Q30 Score:** ${comparisonResult.qcMetrics.q30Score}%\n`;
        mdReport += `- **Uniformity:** ${(comparisonResult.qcMetrics.uniformityScore * 100).toFixed(1)}%\n\n`;
        if (comparisonResult.qcMetrics.reasoning) {
          mdReport += `#### QC Insights\n${comparisonResult.qcMetrics.reasoning}\n\n`;
        }
      }

      if (comparisonResult.clonalArchitecture) {
        mdReport += `### Comparative Tumour Heterogeneity\n`;
        mdReport += `- **Evolutionary Model:** ${comparisonResult.clonalArchitecture.evolutionaryModel}\n`;
        mdReport += `- **Evolutionary Insight:** ${comparisonResult.clonalArchitecture.evolutionaryInsight}\n\n`;
        mdReport += `#### Subclone Clusters\n`;
        mdReport += `| ID | Type | Mean VAF | Prevalence | Variants | Key Genes |\n`;
        mdReport += `| --- | --- | --- | --- | --- | --- |\n`;
        comparisonResult.clonalArchitecture.clusters.forEach(c => {
          mdReport += `| ${c.clusterId} | ${c.isClonal ? 'Clonal' : 'Subclonal'} | ${(c.meanVaf * 100).toFixed(1)}% | ${(c.prevalence * 100).toFixed(1)}% | ${c.variantCount} | ${c.genes.join(', ')} |\n`;
        });
        mdReport += `\n`;
      }

      mdReport += `### Shared Variants\n`;
      comparisonResult.sharedVariants.forEach(v => {
        mdReport += `- **${v.location}:** ${v.ref} -> ${v.alt} (${v.functionalImpact})\n  *Impact:* ${v.impact}\n  *Significance:* ${v.clinicalSignificance}\n  *Frequency:* ${v.populationFrequency || 'N/A'}\n`;
      });
      mdReport += `\n`;
      
      mdReport += `### Unique Variants\n`;
      comparisonResult.uniqueVariants.forEach(sample => {
        mdReport += `#### Sample: ${sample.sampleName}\n`;
        sample.variants.forEach(v => {
          mdReport += `- **${v.location}:** ${v.ref} -> ${v.alt} (${v.functionalImpact})\n  *Impact:* ${v.impact}\n  *Significance:* ${v.clinicalSignificance}\n  *Frequency:* ${(v as any).populationFrequency || 'N/A'}\n`;
        });
        mdReport += `\n`;
      });

      if (comparisonResult.featureTable && comparisonResult.featureTable.length > 0) {
        mdReport += `### Feature Table for ML/DL\n`;
        mdReport += `| Variant | Sample | Genotype | Gene/Impact | gnomAD AF | Clonality | Cluster | ClinVar | ACMG |\n`;
        mdReport += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
        comparisonResult.featureTable.forEach(row => {
          mdReport += `| ${row.CHROM}:${row.POS} | ${row.SAMPLE} | ${row.GT} (DP:${row.DP}) | ${row.ANN.gene} (${row.ANN.proteinChange}) | ${row.gnomAD_AF.global} | ${row.clonality || 'N/A'} | ${row.subcloneCluster ?? 'N/A'} | ${row.clinVarSignificance || 'N/A'} | ${row.acmgCriteria?.join(', ') || 'N/A'} |\n`;
        });
        mdReport += `\n`;
      }

      if (comparisonResult.cnvAnalysis && comparisonResult.cnvAnalysis.length > 0) {
        mdReport += `### Comparative CNV Analysis\n`;
        comparisonResult.cnvAnalysis.forEach(sample => {
          mdReport += `#### Sample: ${sample.sampleName}\n`;
          mdReport += `**Summary:** ${sample.analysis.summary}\n\n`;
          mdReport += `| Gene | Type | Log2 | Status |\n`;
          mdReport += `| --- | --- | --- | --- |\n`;
          sample.analysis.significantGenes.forEach(g => {
            mdReport += `| ${g.gene} | ${g.type} | ${g.log2.toFixed(2)} | ${g.status} |\n`;
          });
          mdReport += `\n`;
        });
      }

      if (comparisonResult.suggestedNextSteps && comparisonResult.suggestedNextSteps.length > 0) {
        mdReport += `### Suggested Next Steps\n`;
        comparisonResult.suggestedNextSteps.forEach(step => {
          mdReport += `- ${step}\n`;
        });
        mdReport += `\n`;
      }
    }

    mdReport += `\n---\n*Report generated by BioPredict AI. For research purposes only.*`;

    const mdBlob = new Blob([mdReport], { type: 'text/markdown' });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = `BioPredict_Report_${analysisId}.md`;
    document.body.appendChild(mdLink);
    mdLink.click();
    document.body.removeChild(mdLink);
    URL.revokeObjectURL(mdUrl);

    // 3. Trigger Print for Visual Report
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-emerald-100">
      {/* Navigation */}
      <nav className="border-bottom border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="font-bold tracking-tight text-lg text-zinc-900">VCF-Analyst-Pro</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Database className="w-4 h-4" />
                Somatic Analysis
              </button>
              <button 
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'comparison' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <GitCompare className="w-4 h-4" />
                Comparative Genomics
              </button>
              <button 
                onClick={() => setActiveTab('predictor')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'predictor' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Zap className="w-4 h-4" />
                OncoPredictor
              </button>
              <button 
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'guide' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <BookOpen className="w-4 h-4" />
                User Guide
              </button>
              {user && (
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              )}
              {uploadedFiles.length > 0 && (
                <button 
                  onClick={() => setActiveTab('igv')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'igv' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  IGV Browser
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthReady && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-zinc-900">{user.displayName}</p>
                      <p className="text-[10px] text-zinc-500">{user.email}</p>
                    </div>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                        <User className="w-4 h-4 text-zinc-500" />
                      </div>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </>
            )}
            <div className="h-4 w-px bg-zinc-200 mx-2 hidden sm:block"></div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' || activeTab === 'comparison' ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero Section */}
              <header className="max-w-3xl mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <BrainCircuit className="w-3 h-3" />
            Expert Somatic Mutation Analysis
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Identify and prioritize <span className="text-emerald-600">clinically relevant somatic variants.</span>
          </motion.h1>
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AMP/ASCO/CAP Guidelines
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              COSMIC & OncoKB Integration
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
              <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
              Tumour-Normal Paired Analysis
            </div>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-500 leading-relaxed"
          >
            Upload VCF files (Mutect2, Strelka2) to identify somatic markers, 
            predict drug efficacy in cancer cohorts, and compare genomic variations 
            with a focus on underrepresented populations.
          </motion.p>

          {/* Training Data Toggle */}
          <div className="mt-8 flex flex-wrap gap-6">
            <button 
              onClick={() => setShowTrainingPanel(!showTrainingPanel)}
              className="flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              {showTrainingPanel ? "Hide Advanced Context" : "Add Advanced Context (Clinical/Studies)"}
            </button>

            <button 
              onClick={() => setGlobalHealthMode(!globalHealthMode)}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${globalHealthMode ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Global Health Focus {globalHealthMode ? '(Active)' : '(Inactive)'}
            </button>
            
            <AnimatePresence>
              {showTrainingPanel && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Beaker className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-zinc-900">Custom Clinical Context & ICD-10 Codes</h4>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">
                      Provide historical clinical trial data, patient samples, or ICD-10 diagnostic codes to "train" the AI model. 
                      The model will use this context to refine its predictions and link diagnostic codes to genomic variants.
                    </p>
                    <textarea 
                      value={trainingData}
                      onChange={(e) => setTrainingData(e.target.value)}
                      placeholder="e.g., Patient ID: 001, ICD-10: E11.9 (Type 2 diabetes), Mutation: BRCA1, Drug: Olaparib..."
                      className="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none mb-6"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-bold text-zinc-900">Scientific Study URLs</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Provide URLs to online studies or clinical trial reports. The AI will use the urlContext tool to analyze these sources.
                        </p>
                        <textarea 
                          value={studyUrls}
                          onChange={(e) => setStudyUrls(e.target.value)}
                          placeholder="Enter URLs (one per line)..."
                          className="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-sm font-bold text-zinc-900">Research Article Text</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Paste the text of research papers or articles. Use double line breaks to separate multiple articles.
                        </p>
                        <textarea 
                          value={studyTexts}
                          onChange={(e) => setStudyTexts(e.target.value)}
                          placeholder="Paste article content here..."
                          className="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-orange-600" />
                        <h4 className="text-sm font-bold text-zinc-900">Manual VCF Data (Header/Summary)</h4>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        If you haven't uploaded a file, paste the VCF header + first 20 lines OR a summary statistics table (variants, PASS/filtered, mean depth, VAF distribution).
                      </p>
                      <textarea 
                        value={manualVcfData}
                        onChange={(e) => setManualVcfData(e.target.value)}
                        placeholder="Paste VCF header/summary here..."
                        className="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                      />
                      <button
                        onClick={handleManualAnalysis}
                        disabled={isLoading || !manualVcfData.trim()}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Activity className="w-5 h-5 animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                        Analyze Manual VCF Data
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main Interface */}
        <div className="space-y-12">
          {sampleDetection && sampleDetection.sampleNames.length > 1 && !prediction && !isLoading && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-emerald-100 rounded-[32px] p-12 shadow-xl shadow-emerald-100/50"
            >
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Multi-Sample VCF Detected</h2>
                <p className="text-zinc-500 mb-8">
                  This file contains {sampleDetection.sampleNames.length} samples: <span className="font-mono text-emerald-600">{sampleDetection.sampleNames.join(', ')}</span>.
                  Please select an analysis protocol to ensure patient safety and data integrity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <button
                    onClick={() => proceedWithMultiSampleAnalysis('individual')}
                    className="p-6 border border-zinc-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <UserCheck className="w-4 h-4 text-zinc-600 group-hover:text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-zinc-900">Individual Analysis</h4>
                    </div>
                    <p className="text-xs text-zinc-500">Analyze every sample individually. Separate reports will be generated.</p>
                  </button>

                  <button
                    onClick={() => proceedWithMultiSampleAnalysis('paired')}
                    className="p-6 border border-zinc-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <GitCompare className="w-4 h-4 text-zinc-600 group-hover:text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-zinc-900">Tumour-Normal Pairs</h4>
                    </div>
                    <p className="text-xs text-zinc-500">Detect and analyze specific somatic pairs (e.g., Primary vs. Control).</p>
                  </button>

                  <div className="md:col-span-2 p-6 border border-zinc-200 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4 text-zinc-400" />
                      Analyze Single Sample
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sampleDetection.sampleNames.map(name => (
                        <button
                          key={name}
                          onClick={() => proceedWithMultiSampleAnalysis('single', name)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-medium transition-all"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => proceedWithMultiSampleAnalysis('cohort')}
                    className="md:col-span-2 p-6 border border-zinc-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                        <Activity className="w-4 h-4 text-zinc-600 group-hover:text-orange-600" />
                      </div>
                      <h4 className="font-bold text-zinc-900">Cohort-Level Research</h4>
                    </div>
                    <p className="text-xs text-zinc-500">Aggregate statistics across all patients. <span className="font-bold text-orange-600 uppercase">Not for individual diagnosis.</span></p>
                  </button>
                </div>
                
                <button 
                  onClick={resetAnalysis}
                  className="mt-8 text-sm text-zinc-400 hover:text-zinc-600 underline underline-offset-4"
                >
                  Cancel and upload different file
                </button>
              </div>
            </motion.section>
          )}

          {!prediction && !comparisonResult && !isLoading && (!sampleDetection || sampleDetection.sampleNames.length <= 1) && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-zinc-200 rounded-[32px] p-12 shadow-xl shadow-zinc-200/50"
            >
              <FileUploader onDataParsed={handleDataParsed} onError={(err) => setError(getErrorMessage(err))} />
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-100 pt-12">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Comparative Analysis</h4>
                  <p className="text-sm text-zinc-500">Compare multiple VCF files to identify shared and unique variants.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Expression Profiling</h4>
                  <p className="text-sm text-zinc-500">Analyze h5ad and CSV transcriptomic data for gene expression patterns.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">AI Prediction</h4>
                  <p className="text-sm text-zinc-500">Leverage Gemini 3.1 Pro for high-confidence drug-outcome mapping.</p>
                </div>
              </div>
            </motion.section>
          )}

          <AnimatePresence>
            {(isLoading || prediction || comparisonResult) && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={resetAnalysis}
                      className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                    >
                      Reset Analysis
                    </button>
                    <div className="h-4 w-px bg-zinc-200" />
                    <span className="text-sm text-zinc-400">Analysis ID: BP-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                  </div>
                  <button 
                    onClick={handleExportReport}
                    className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Export Report <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center gap-3">
                    <Info className="w-5 h-5" />
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 font-medium animate-pulse">Running your analysis...</p>
                  </div>
                ) : (
                  <>
                    {prediction && (
                      <PredictionDashboard 
                        result={prediction} 
                        isLoading={false} 
                        dataSummary={dataSummary}
                        analysisMode={analysisMode}
                        selectedSampleName={selectedSampleName}
                        onTrainClassifier={trainClassifier}
                        isTraining={isTraining}
                        trainingResult={trainingResult}
                        cumulativeCount={cumulativeKnowledgeBase.length}
                        onShowReport={() => handleShowReport(prediction.markdownReport || "")}
                      />
                    )}
                    {comparisonResult && (
                      <ComparativeAnalysis 
                        result={comparisonResult} 
                        onTrainClassifier={trainClassifier}
                        isTraining={isTraining}
                        trainingResult={trainingResult}
                        cumulativeCount={cumulativeKnowledgeBase.length}
                        onShowReport={() => handleShowReport(comparisonResult.markdownReport || "")}
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!isLoading && !prediction && !comparisonResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                <KnowledgeBase />
              </div>
              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 bg-zinc-900 text-white rounded-3xl shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="font-bold">Global Health Focus</h4>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    BioPredict AI is structured to assist researchers in tackling global health challenges, with specialized modules for tropical diseases and regional R&D contexts.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-xs text-zinc-300">
                      <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5" />
                      Accelerating R&D for Malaria, TB, and Neglected Tropical Diseases (NTDs).
                    </li>
                    <li className="flex items-start gap-2 text-xs text-zinc-300">
                      <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5" />
                      Bridging the gap between laboratory research and clinical activities.
                    </li>
                    <li className="flex items-start gap-2 text-xs text-zinc-300">
                      <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5" />
                      Empowering scientists with AI-driven drug-outcome simulation.
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500 italic">
                      Designed to support global health pioneers and precision medicine initiatives.
                    </p>
                  </div>
                </motion.div>

                <div className="p-6 bg-white border border-zinc-200 rounded-3xl">
                  <h4 className="text-sm font-bold text-zinc-900 mb-4">Simulation for Training</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Use our <strong>Deep Learning Simulation</strong> mode to train researchers on drug-outcome mapping and genomic variation analysis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      ) : activeTab === 'igv' ? (
        <motion.div
          key="igv"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <IGVBrowser files={uploadedFiles} />
        </motion.div>
      ) : activeTab === 'history' ? (
        <motion.div
          key="history"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="max-w-7xl mx-auto px-6 py-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Analysis History</h2>
              <p className="text-zinc-500 mt-1">Review your past genomic predictions and reports.</p>
            </div>
          </div>

          {pastAnalyses.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">No history found</h3>
              <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
                Once you perform a somatic analysis while logged in, your results will be saved here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastAnalyses.map((record) => (
                <motion.div
                  key={record.id}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    setPrediction(record.result);
                    setDataSummary(record.summary);
                    setActiveTab('analysis');
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {record.fileName}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                    {record.result.disease || 'Genomic Analysis'}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Stored</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : activeTab === 'guide' ? (
        <motion.div
          key="guide"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <UserGuide />
        </motion.div>
      ) : (
        <motion.div
          key="pharm-ai"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PharmAIPredictor onShowReport={handleShowReport} />
        </motion.div>
      )}
    </AnimatePresence>
</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-white">
              <Dna className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-900">BioPredict AI</span>
          </div>
          <p className="text-sm text-zinc-400">© 2026 BioPredict AI. For research purposes only.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Privacy</a>
            <a href="#" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Terms</a>
          </div>
        </div>
      </footer>

      {showReport && reportContent && (
        <MarkdownReport 
          report={reportContent} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}
