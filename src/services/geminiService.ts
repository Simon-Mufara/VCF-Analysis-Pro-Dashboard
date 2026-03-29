import { GoogleGenAI, Type } from "@google/genai";
import { GenomicDomain, QCMetrics, CNVAnalysis, DrugInteraction, SuggestedRegimen } from "../types/genomics";
import { PipelineFactory } from "../pipelines/PipelineFactory";
import { AnalysisError, AnalysisErrorType } from "../lib/errors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const VCF_CLINAI_PRO_WORKFLOW = `
STRICT 8-STEP WORKFLOW YOU MUST FOLLOW:
1. VCF Parsing & Reference Detection
2. Quality Control & Filtering
3. Variant Annotation (Functional Impact)
4. Clinical Evidence Mapping (ClinVar, OncoKB, etc.)
5. Drug Actionability & Outcome Prediction
6. ML/DL Feature Table Generation (≥25 features)
7. Final PDF-Ready Markdown Report Generation
8. Suggested Next Steps
`;

export interface FeatureTableEntry {
  CHROM: string;
  POS: number;
  ID: string;
  REF: string;
  ALT: string;
  SAMPLE: string;
  GT: string;
  DP: number;
  VAF: number;
  QUAL: number;
  FILTER: string;
  clonality?: 'Clonal' | 'Subclonal';
  subcloneCluster?: number;
  ANN: {
    impact: string;
    gene: string;
    transcript: string;
    proteinChange: string;
  };
  CADD?: number;
  SIFT?: string;
  PolyPhen?: string;
  gnomAD_AF: {
    global: number;
    population?: { [pop: string]: number };
  };
  clinVarSignificance?: string;
  cosmicCount?: number;
  oncoKBLevel?: string;
  acmgCriteria?: string[];
}

export interface PredictionResult {
  vcfParsingSummary: string;
  qualityFilteringSummary: string;
  disease: string;
  clinicianSummary?: {
    diagnosis: string;
    keyFindings: string[];
    actionableVariants: {
      variant: string;
      gene: string;
      clinicalSignificance: string;
    }[];
    drugRecommendations: {
      drug: string;
      reasoning: string;
    }[];
    contraindications: string[];
  };
  recommendedDrugs: {
    name: string;
    mechanism: string;
    confidence: number;
    potentialOutcome: string;
    evidenceLevel: string;
    fdaStatus: string;
    clinicalTrials?: {
      id: string;
      title: string;
      phase: string;
      url: string;
    }[];
    sideEffects?: string[];
    contraindications?: string[];
    interactionLinks?: { source: string; url: string }[];
  }[];
  deepLearningSimulation?: {
    modelType: string;
    accuracy: number;
    prediction: string;
    features: string[];
  };
  pathwayAnalysis?: {
    pathways: {
      id: string;
      name: string;
      source: 'KEGG' | 'Reactome' | 'Other';
      nodes: {
        id: string;
        label: string;
        type: 'gene' | 'process' | 'pathway';
        isMutated: boolean;
        impact?: string;
      }[];
      links: {
        source: string;
        target: string;
        type: 'activation' | 'inhibition' | 'association';
      }[];
      disruptionScore: number;
      description: string;
    }[];
    summary: string;
  };
  qcMetrics?: QCMetrics;
  aiModelTuning?: {
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    impact: string;
  }[];
  riskAssessment: string;
  suggestedNextSteps: string[];
  researchQuestions?: string[];
  relevantDatabases?: {
    name: string;
    url: string;
  }[];
  globalHealthFocusActive?: boolean;
  deepLearningSimulations?: {
    modelType: string;
    accuracy: number;
    prediction: string;
    features: string[];
    confidenceInterval?: [number, number];
  }[];
  reinforcementLearning?: {
    agentType: string;
    objective: string;
    optimalAction: string;
    expectedReward: number;
    convergenceStatus: string;
  };
  drugInteractions?: DrugInteraction[];
  suggestedRegimen?: SuggestedRegimen;
  cohortAnalysis?: {
    biomarkerStats: {
      biomarker: string;
      cohortFrequency: number;
      globalFrequency: number;
    }[];
    drugResponseStats: {
      drugName: string;
      expectedEfficacy: number;
      globalAverageEfficacy: number;
    }[];
    insights: string;
  };
  goEnrichment?: {
    term: string;
    pValue: number;
    genes: string[];
    category: 'Biological Process' | 'Molecular Function' | 'Cellular Component';
  }[];
  literatureInsights?: {
    title: string;
    keyFindings: string[];
    relevance: string;
    sourceUrl?: string;
  }[];
  icd10Interpretations?: {
    code: string;
    description: string;
    relevance: string;
  }[];
  differentialExpression?: {
    gene: string;
    log2FoldChange: number;
    pValue: number;
  }[];
  vafAnalysis?: {
    vafDistribution: { vaf: number; frequency: number }[];
    clonalVariants: number;
    subclonalVariants: number;
    clusters: { clusterId: number; meanVaf: number; variantCount: number }[];
  };
  cnvAnalysis?: CNVAnalysis;
  signatureAnalysis?: {
    signatures: {
      signatureId: string;
      contribution: number;
      description: string;
      etiology: 'Aging' | 'APOBEC' | 'MMR Deficiency' | 'Tobacco' | 'UV Exposure' | 'Other';
    }[];
    dominantSignature: string;
    interpretation: string;
  };
  msiAnalysis?: {
    status: 'MSI-High' | 'MSI-Low' | 'MSS';
    score: number;
    unstableLoci: number;
    totalLoci: number;
    interpretation: string;
  };
  clonalArchitecture?: {
    clusters: {
      clusterId: number;
      meanVaf: number;
      variantCount: number;
      prevalence: number;
      genes: string[];
      isClonal: boolean;
    }[];
    evolutionaryModel: 'Linear' | 'Branching' | 'Neutral' | 'Punctuation' | 'Unknown';
    evolutionaryInsight: string;
    phylogeny?: {
      nodes: { id: string; label: string; prevalence: number; isClonal: boolean }[];
      edges: { source: string; target: string }[];
    };
  };
  featureTable: FeatureTableEntry[];
  markdownReport?: string;
  domain?: GenomicDomain;
}

export interface ComparisonResult {
  vcfParsingSummary: string;
  qualityFilteringSummary: string;
  sharedVariants: {
    location: string;
    ref: string;
    alt: string;
    impact: string;
    functionalImpact: string;
    clinicalSignificance: string;
    populationFrequency?: string;
    hpoTerms?: { term: string; id: string }[];
    externalLinks?: { name: string; url: string }[];
  }[];
  uniqueVariants: {
    sampleName: string;
    variants: {
      location: string;
      ref: string;
      alt: string;
      impact: string;
      functionalImpact: string;
      clinicalSignificance: string;
      populationFrequency?: string;
      externalLinks?: { name: string; url: string }[];
    }[];
  }[];
  comparativeInsights: string;
  drugResponseImpact: {
    drugName: string;
    impactDescription: string;
    affectedSamples: string[];
  }[];
  variantHeatmapData?: {
    variant: string;
    sampleData: {
      sampleName: string;
      frequency: number;
    }[];
  }[];
  qcMetrics?: QCMetrics;
  icd10Interpretations?: {
    code: string;
    description: string;
    relevance: string;
    sampleName?: string;
  }[];
  clonalArchitecture?: {
    clusters: {
      clusterId: number;
      meanVaf: number;
      variantCount: number;
      prevalence: number;
      genes: string[];
      isClonal: boolean;
    }[];
    evolutionaryModel: 'Linear' | 'Branching' | 'Neutral' | 'Punctuation' | 'Unknown';
    evolutionaryInsight: string;
    phylogeny?: {
      nodes: { id: string; label: string; prevalence: number; isClonal: boolean }[];
      edges: { source: string; target: string }[];
    };
  };
  cnvAnalysis?: {
    sampleName: string;
    analysis: CNVAnalysis;
  }[];
  suggestedNextSteps: string[];
  researchQuestions?: string[];
  featureTable: FeatureTableEntry[];
  markdownReport?: string;
  domain?: GenomicDomain;
}

export interface SampleDetectionResult {
  sampleNames: string[];
  vcfType: 'single' | 'paired' | 'trio' | 'cohort' | 'unknown';
  parsingSummary: string;
}

export async function detectSamples(vcfSummary: string): Promise<SampleDetectionResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are VCF-ClinAI-Pro. Your task is to perform Step 1 of the clinical genomic workflow: Intelligent VCF Parsing & Sample Detection.
      
      Parse the following VCF summary/header and identify:
      1. Every sample name present in the genotype columns.
      2. The type of VCF (Single sample, Tumour-Normal pair, Trio/Family, or Cohort/Merged).
      
      VCF Data:
      ${vcfSummary}
      
      Return the result in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sampleNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            vcfType: { type: Type.STRING, enum: ['single', 'paired', 'trio', 'cohort', 'unknown'] },
            parsingSummary: { type: Type.STRING },
          },
          required: ["sampleNames", "vcfType", "parsingSummary"],
        },
      },
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      sampleNames: [],
      vcfType: 'unknown',
      parsingSummary: "Sample detection completed.",
      ...parsed
    };
  } catch (error: any) {
    if (error?.message?.includes('fetch')) {
      throw new AnalysisError(AnalysisErrorType.NETWORK_ERROR, "Network error during sample detection.");
    }
    throw new AnalysisError(AnalysisErrorType.AI_ANALYSIS_FAILED, "Failed to detect samples in VCF.", error.message);
  }
}

export async function predictDrugAndOutcome(
  dataSummary: string, 
  trainingData?: string,
  studyUrls?: string[],
  studyTexts?: string[],
  globalHealthMode?: boolean
): Promise<PredictionResult> {
  const domain = PipelineFactory.detectDomain(dataSummary);
  const pipeline = PipelineFactory.getPipeline(domain);
  
  const trainingContext = trainingData ? `\n\n[USER-PROVIDED TRAINING DATA / CLINICAL SAMPLES]\n${trainingData}\nUse the above training data to refine your predictions and simulate how a model trained on this specific cohort would perform.` : "";
  
  const studyContext = (studyTexts && studyTexts.length > 0) 
    ? `\n\n[USER-PROVIDED SCIENTIFIC STUDIES/ARTICLES]\n${studyTexts.join('\n\n')}\nReview these studies to understand advancing treatments and incorporate relevant findings into your prediction.` 
    : "";

  const urlPrompt = (studyUrls && studyUrls.length > 0)
    ? `\n\n[RELEVANT STUDY URLS]\n${studyUrls.join('\n')}\nPlease access and review the content of these URLs using the urlContext tool to stay updated on the latest clinical advancements relevant to this case.`
    : "";

  const globalHealthContext = globalHealthMode 
    ? `\n\n[GLOBAL HEALTH FOCUS MODE ACTIVE]\nThis analysis MUST prioritize neglected tropical diseases (NTDs), regional genetic variations (e.g., specific African, Asian, or Latin American genomic markers), and treatment accessibility in developing regions. Focus on low-cost interventions, repurposed drugs, and therapies suitable for resource-limited settings.` 
    : "";

  const context = `${trainingContext}${studyContext}${urlPrompt}${globalHealthContext}`;
  
  try {
    const result = await pipeline.analyze(dataSummary, context);
    
    if (!result) {
      throw new AnalysisError(AnalysisErrorType.AI_ANALYSIS_FAILED, "Analysis produced no results.");
    }
    
    return {
      ...result,
      domain,
      globalHealthFocusActive: !!globalHealthMode
    } as any;
  } catch (error: any) {
    if (error instanceof AnalysisError) throw error;
    if (error?.message?.includes('fetch')) {
      throw new AnalysisError(AnalysisErrorType.NETWORK_ERROR, "Network error during drug prediction.");
    }
    throw new AnalysisError(AnalysisErrorType.AI_ANALYSIS_FAILED, "AI analysis failed to predict drug outcomes.", error.message);
  }
}

export async function compareGenomes(summaries: { fileName: string; content: string }[], clinicalContext?: string): Promise<ComparisonResult> {
  if (!summaries || summaries.length === 0) {
    throw new AnalysisError(AnalysisErrorType.EMPTY_FILE, "No genomic data provided for comparison.");
  }

  try {
    const combinedSummary = summaries.map(s => `File: ${s.fileName}\nContent: ${s.content}`).join('\n\n---\n\n');
  
  const contextPrompt = clinicalContext ? `\n\nAdditional Clinical Context/ICD-10 Codes Provided:\n${clinicalContext}` : "";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are VCF-ClinAI-Pro, an expert clinical genomicist and bioinformatics researcher with 15+ years experience in variant interpretation across all disease areas (rare diseases, cancer, complex traits, pharmacogenomics, etc.).
    Your core mission: Help users analyze large VCF files (from Mutect2 or similar tumour-normal paired calling) to identify, prioritize, and interpret clinically relevant somatic variants.

    STRICT CLINICAL & RESEARCH PRINCIPLES YOU MUST OBEY:
    - Always act as a cautious clinician first: Never give a definitive diagnosis. Use phrases like “This variant is likely pathogenic and warrants clinical correlation / orthogonal validation.”
    - Every interpretation must cite sources (ClinVar, COSMIC v3.3+, gnomAD v4, OncoKB, CIViC, Mastermind, OMIM, ACMG/AMP 2015/2023 guidelines, AMP/ASCO/CAP 2017 somatic guidelines, etc.).
    - Flag all uncertainties, low-quality data, low VAF, low depth, possible artefacts, or population-specific limitations.

    ${VCF_CLINAI_PRO_WORKFLOW}

    MANDATORY OUTPUT STRUCTURE (mapped to JSON fields):
    1. vcfParsingSummary: Reasoning and results for Step 1.
    2. qualityFilteringSummary: Reasoning and results for Step 2.
    3. comparativeInsights, sharedVariants, uniqueVariants: Results for Steps 3, 4, 5, 7.
    4. featureTable: Results for Step 6 (≥25 features per variant).
    5. suggestedNextSteps: Results for Step 8.
    6. researchQuestions: Suggest 2–3 research questions that could be answered by aggregating this case with previous ones.
    7. markdownReport: A SINGLE, COMPLETE, beautifully formatted Markdown document as defined in Step 7 of the workflow.

    Perform a robust comparative genomics analysis on the following VCF file summaries. 
    Identify shared variants across all samples and unique variants for each sample. 
    Analyze the potential impact of these variations on disease susceptibility and drug response using ClinVar, gnomAD, PharmGKB, and COSMIC.
    
    For each variant, provide:
    1. Functional impact (e.g., Missense, Frameshift, Stop Gained, Splice Site).
    2. Clinical significance (e.g., Pathogenic, Likely Pathogenic, VUS, Benign).
    3. Population frequency (gnomAD/1000G) to assess rarity.
    4. Relevant Human Phenotype Ontology (HPO) terms for clinical context.
    5. External links to dbSNP, gnomAD, and ClinVar.
    
    Additionally, provide a 'variantHeatmapData' section mapping key variants to their frequency (0.0 to 1.0) across samples.
    Include a 'qcMetrics' section for the comparative dataset. Reflect on whether the sequencing quality across all samples is sufficient for a reliable comparison.
    If any sample has poor QC, highlight it and explain the potential for false positives or negatives in the comparison.
    If ICD-10 codes are present, include an 'icd10Interpretations' section linking them to genomic findings.
    
    Additionally, perform a 'cnvAnalysis' for each sample, identifying significant copy number variations (amplifications and deletions) and annotating significant genes (Oncogenes, Tumour Suppressors).
    
    Data Summaries:
    ${combinedSummary}
    ${contextPrompt}
    
    Provide the analysis in JSON format.`,
    config: {
      tools: [{ googleSearch: {} }, { codeExecution: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vcfParsingSummary: { type: Type.STRING },
          qualityFilteringSummary: { type: Type.STRING },
          sharedVariants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                ref: { type: Type.STRING },
                alt: { type: Type.STRING },
                impact: { type: Type.STRING },
                functionalImpact: { type: Type.STRING, description: "e.g., Missense, Frameshift" },
                clinicalSignificance: { type: Type.STRING },
                populationFrequency: { type: Type.STRING },
                hpoTerms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING, description: "HPO term name" },
                      id: { type: Type.STRING, description: "HPO term ID (e.g., HP:0001234)" },
                    },
                    required: ["term", "id"],
                  },
                  description: "Relevant Human Phenotype Ontology terms",
                },
                externalLinks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      url: { type: Type.STRING },
                    },
                    required: ["name", "url"],
                  },
                },
              },
              required: ["location", "ref", "alt", "impact", "functionalImpact", "clinicalSignificance"],
            },
          },
          uniqueVariants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sampleName: { type: Type.STRING },
                variants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      location: { type: Type.STRING },
                      ref: { type: Type.STRING },
                      alt: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      functionalImpact: { type: Type.STRING, description: "e.g., Missense, Frameshift" },
                      clinicalSignificance: { type: Type.STRING },
                      populationFrequency: { type: Type.STRING },
                      externalLinks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            url: { type: Type.STRING },
                          },
                          required: ["name", "url"],
                        },
                      },
                    },
                    required: ["location", "ref", "alt", "impact", "functionalImpact", "clinicalSignificance"],
                  },
                },
              },
              required: ["sampleName", "variants"],
            },
          },
          comparativeInsights: { type: Type.STRING },
          drugResponseImpact: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                drugName: { type: Type.STRING },
                impactDescription: { type: Type.STRING },
                affectedSamples: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["drugName", "impactDescription", "affectedSamples"],
            },
          },
          variantHeatmapData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                variant: { type: Type.STRING, description: "Variant identifier (e.g., RSID or Location)" },
                sampleData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sampleName: { type: Type.STRING },
                      frequency: { type: Type.NUMBER, description: "Allele frequency or presence (0.0 - 1.0)" },
                    },
                    required: ["sampleName", "frequency"],
                  },
                },
              },
              required: ["variant", "sampleData"],
            },
          },
          icd10Interpretations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                relevance: { type: Type.STRING, description: "Detailed clinical significance, explicitly linking the code to identified gene associations or variant impacts in the comparative analysis" },
                sampleName: { type: Type.STRING, description: "Optional: name of the sample this code belongs to" },
              },
              required: ["code", "description", "relevance"],
            },
          },
          qcMetrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                metricName: { type: Type.STRING },
                value: { type: Type.NUMBER },
                threshold: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ["pass", "fail", "warning"] },
                reasoning: { type: Type.STRING },
              },
              required: ["metricName", "value", "threshold", "status"],
            },
          },
          clonalArchitecture: {
            type: Type.OBJECT,
            properties: {
              clusters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    clusterId: { type: Type.NUMBER },
                    meanVaf: { type: Type.NUMBER },
                    variantCount: { type: Type.NUMBER },
                    prevalence: { type: Type.NUMBER },
                    genes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    isClonal: { type: Type.BOOLEAN },
                  },
                  required: ["clusterId", "meanVaf", "variantCount", "prevalence", "genes", "isClonal"],
                },
              },
              evolutionaryModel: { type: Type.STRING, enum: ["Linear", "Branching", "Neutral", "Punctuation", "Unknown"] },
              evolutionaryInsight: { type: Type.STRING },
              phylogeny: {
                type: Type.OBJECT,
                properties: {
                  nodes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        prevalence: { type: Type.NUMBER },
                        isClonal: { type: Type.BOOLEAN },
                      },
                      required: ["id", "label", "prevalence", "isClonal"],
                    },
                  },
                  edges: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                      },
                      required: ["source", "target"],
                    },
                  },
                },
                required: ["nodes", "edges"],
              },
            },
            required: ["clusters", "evolutionaryModel", "evolutionaryInsight"],
          },
          cnvAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sampleName: { type: Type.STRING },
                analysis: {
                  type: Type.OBJECT,
                  properties: {
                    segments: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          chrom: { type: Type.STRING },
                          start: { type: Type.NUMBER },
                          end: { type: Type.NUMBER },
                          log2: { type: Type.NUMBER },
                          status: { type: Type.STRING, enum: ["Amplification", "Deletion", "Neutral"] },
                          genes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["chrom", "start", "end", "log2", "status"],
                      },
                    },
                    significantGenes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          gene: { type: Type.STRING },
                          log2: { type: Type.NUMBER },
                          status: { type: Type.STRING, enum: ["Amplification", "Deletion"] },
                          type: { type: Type.STRING, enum: ["Oncogene", "Tumour Suppressor", "Other"] },
                        },
                        required: ["gene", "log2", "status"],
                      },
                    },
                    summary: { type: Type.STRING },
                  },
                  required: ["segments", "significantGenes", "summary"],
                },
              },
              required: ["sampleName", "analysis"],
            },
          },
          suggestedNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 specific next-step questions or suggestions for the user."
          },
          researchQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 research questions for cohort aggregation."
          },
          markdownReport: { type: Type.STRING, description: "Full Markdown report for PDF export." },
          featureTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                CHROM: { type: Type.STRING },
                POS: { type: Type.NUMBER },
                ID: { type: Type.STRING },
                REF: { type: Type.STRING },
                ALT: { type: Type.STRING },
                SAMPLE: { type: Type.STRING },
                GT: { type: Type.STRING },
                DP: { type: Type.NUMBER },
                VAF: { type: Type.NUMBER },
                QUAL: { type: Type.NUMBER },
                FILTER: { type: Type.STRING },
                ANN: {
                  type: Type.OBJECT,
                  properties: {
                    impact: { type: Type.STRING },
                    gene: { type: Type.STRING },
                    transcript: { type: Type.STRING },
                    proteinChange: { type: Type.STRING },
                  },
                  required: ["impact", "gene", "transcript", "proteinChange"],
                },
                CADD: { type: Type.NUMBER },
                SIFT: { type: Type.STRING },
                PolyPhen: { type: Type.STRING },
                gnomAD_AF: {
                  type: Type.OBJECT,
                  properties: {
                    global: { type: Type.NUMBER },
                    population: { type: Type.OBJECT },
                  },
                  required: ["global"],
                },
                clinVarSignificance: { type: Type.STRING },
                cosmicCount: { type: Type.NUMBER },
                oncoKBLevel: { type: Type.STRING },
                acmgCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["CHROM", "POS", "REF", "ALT", "SAMPLE", "GT", "DP", "VAF", "QUAL", "FILTER", "ANN", "gnomAD_AF"],
            },
          },
        },
        required: ["vcfParsingSummary", "qualityFilteringSummary", "sharedVariants", "uniqueVariants", "comparativeInsights", "drugResponseImpact", "suggestedNextSteps", "markdownReport", "featureTable"],
      },
    },
  });

    const text = response.text || "{}";
    let jsonStr = text.trim();
    
    // If it's a JSON string, it might be double-encoded
    if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
      try {
        const unescaped = JSON.parse(jsonStr);
        if (typeof unescaped === 'string') {
          jsonStr = unescaped.trim();
        }
      } catch (e) {
        // Not a valid JSON string, continue with extraction
      }
    }

    // Robust JSON extraction
    const jsonMatch = jsonStr.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Fallback: try to find the first '{' or '[' and last '}' or ']'
      const firstBrace = jsonStr.indexOf('{');
      const firstBracket = jsonStr.indexOf('[');
      const lastBrace = jsonStr.lastIndexOf('}');
      const lastBracket = jsonStr.lastIndexOf(']');

      let start = -1;
      let end = -1;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = lastBrace;
      } else if (firstBracket !== -1) {
        start = firstBracket;
        end = lastBracket;
      }

      if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      }
    }

    let parsed = JSON.parse(jsonStr);
    
    // If the AI returned an array of objects, take the first one
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed = parsed[0];
    }

    // If the parsed result is still a string, it might be triple-encoded
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        // Not double-encoded, just a string
      }
    }

    return {
      sharedVariants: [],
      uniqueVariants: [],
      comparativeInsights: "Comparative analysis completed.",
      vcfParsingSummary: "VCF files parsed successfully.",
      qualityFilteringSummary: "Quality filtering applied.",
      suggestedNextSteps: [],
      markdownReport: "# Comparative Analysis Report\nNo data available.",
      featureTable: [],
      ...parsed
    };
  } catch (error: any) {
    if (error instanceof AnalysisError) throw error;
    if (error?.message?.includes('fetch')) {
      throw new AnalysisError(AnalysisErrorType.NETWORK_ERROR, "Network error during comparative analysis.");
    }
    throw new AnalysisError(AnalysisErrorType.AI_ANALYSIS_FAILED, "Comparative AI analysis failed.", error.message);
  }
}

export async function predictFromPrompt(prompt: string): Promise<PredictionResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are VCF-ClinAI-Pro, an expert clinical genomicist and bioinformatics researcher with 15+ years experience in variant interpretation across all disease areas (rare diseases, cancer, complex traits, pharmacogenomics, etc.).
    Your sole mission: Deliver accurate, conservative, actionable, and explainable post-VCF analysis that a clinician or researcher can trust for real decision-making.

    STRICT CLINICAL & RESEARCH PRINCIPLES YOU MUST OBEY:
    - Always act as a cautious clinician first: Never give a definitive diagnosis. Use phrases like “This variant is likely pathogenic and warrants clinical correlation / orthogonal validation.”
    - Every interpretation must cite sources (ClinVar, COSMIC v3.3+, gnomAD v4, OncoKB, CIViC, Mastermind, OMIM, ACMG/AMP 2015/2023 guidelines, AMP/ASCO/CAP 2017 somatic guidelines, etc.).
    - Flag all uncertainties, low-quality data, low VAF, low depth, possible artefacts, or population-specific limitations.

    ${VCF_CLINAI_PRO_WORKFLOW}

    MANDATORY OUTPUT STRUCTURE (mapped to JSON fields):
    1. vcfParsingSummary: Reasoning and results for Step 1.
    2. qualityFilteringSummary: Reasoning and results for Step 2.
    3. disease, riskAssessment, recommendedDrugs, pathwayAnalysis: Results for Steps 3, 4, 5, 7.
    4. featureTable: Results for Step 6 (≥25 features per variant).
    5. suggestedNextSteps: Results for Step 8.
    6. researchQuestions: Suggest 2–3 research questions that could be answered by aggregating this case with previous ones.
    7. markdownReport: A SINGLE, COMPLETE, beautifully formatted Markdown document as defined in Step 7 of the workflow.

    User Prompt: ${prompt}
    
    CLINICAL PRECISION REQUIREMENTS:
    1. PHARMACOKINETICS (PK): Analyze how genetic variants (e.g., CYP450, SLCO1B1) impact drug absorption, distribution, metabolism, and excretion.
    2. PHARMACODYNAMICS (PD): Evaluate how variants (e.g., VKORC1, HLA-B*57:01) affect the drug's target or immune response.
    3. DOSING: Provide specific dosing adjustments (e.g., "Reduce dose by 50%") based on CPIC or DPWG guidelines.
    4. TOXICITY: Identify specific risks for Serious Adverse Events (SAEs) like SJS/TEN, hepatotoxicity, or cardiotoxicity.
    5. INTERACTION: Cross-reference current medications for potential CYP inhibition or induction.`,
    config: {
      tools: [{ googleSearch: {} }, { urlContext: {} }, { codeExecution: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vcfParsingSummary: { type: Type.STRING },
          qualityFilteringSummary: { type: Type.STRING },
          disease: { type: Type.STRING },
          recommendedDrugs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                mechanism: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                potentialOutcome: { type: Type.STRING },
                evidenceLevel: { type: Type.STRING },
                fdaStatus: { type: Type.STRING },
                clinicalTrials: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      phase: { type: Type.STRING },
                      url: { type: Type.STRING },
                    },
                    required: ["id", "title", "phase", "url"],
                  },
                },
                sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                contraindications: { type: Type.ARRAY, items: { type: Type.STRING } },
                interactionLinks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING },
                      url: { type: Type.STRING },
                    },
                    required: ["source", "url"],
                  },
                },
              },
              required: ["name", "mechanism", "confidence", "potentialOutcome", "evidenceLevel", "fdaStatus"],
            },
          },
          riskAssessment: { type: Type.STRING },
          pathwayAnalysis: {
            type: Type.OBJECT,
            properties: {
              pathways: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    source: { type: Type.STRING, enum: ["KEGG", "Reactome", "Other"] },
                    nodes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ["gene", "process", "pathway"] },
                          isMutated: { type: Type.BOOLEAN },
                          impact: { type: Type.STRING },
                        },
                        required: ["id", "label", "type", "isMutated"],
                      },
                    },
                    links: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          source: { type: Type.STRING },
                          target: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ["activation", "inhibition", "association"] },
                        },
                        required: ["source", "target", "type"],
                      },
                    },
                    disruptionScore: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                  },
                  required: ["id", "name", "source", "nodes", "links", "disruptionScore", "description"],
                },
              },
              summary: { type: Type.STRING },
            },
            required: ["pathways", "summary"],
          },
          suggestedNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 specific next-step questions or suggestions for the user."
          },
          researchQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 research questions for cohort aggregation."
          },
          markdownReport: { type: Type.STRING, description: "Full Markdown report for PDF export." },
          featureTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                CHROM: { type: Type.STRING },
                POS: { type: Type.NUMBER },
                ID: { type: Type.STRING },
                REF: { type: Type.STRING },
                ALT: { type: Type.STRING },
                SAMPLE: { type: Type.STRING },
                GT: { type: Type.STRING },
                DP: { type: Type.NUMBER },
                VAF: { type: Type.NUMBER },
                QUAL: { type: Type.NUMBER },
                FILTER: { type: Type.STRING },
                ANN: {
                  type: Type.OBJECT,
                  properties: {
                    impact: { type: Type.STRING },
                    gene: { type: Type.STRING },
                    transcript: { type: Type.STRING },
                    proteinChange: { type: Type.STRING },
                  },
                  required: ["impact", "gene", "transcript", "proteinChange"],
                },
                CADD: { type: Type.NUMBER },
                SIFT: { type: Type.STRING },
                PolyPhen: { type: Type.STRING },
                gnomAD_AF: {
                  type: Type.OBJECT,
                  properties: {
                    global: { type: Type.NUMBER },
                    population: { type: Type.OBJECT },
                  },
                  required: ["global"],
                },
                clinVarSignificance: { type: Type.STRING },
                cosmicCount: { type: Type.NUMBER },
                oncoKBLevel: { type: Type.STRING },
                acmgCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["CHROM", "POS", "REF", "ALT", "SAMPLE", "GT", "DP", "VAF", "QUAL", "FILTER", "ANN", "gnomAD_AF"],
            },
          },
          relevantDatabases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
              },
            },
          },
          literatureInsights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
                relevance: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
              },
              required: ["title", "keyFindings", "relevance"],
            },
          },
        },
        required: ["vcfParsingSummary", "qualityFilteringSummary", "disease", "recommendedDrugs", "riskAssessment", "suggestedNextSteps", "markdownReport", "featureTable"],
      },
    },
  });

  try {
    const text = response.text || "{}";
    const jsonStr = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      vcfParsingSummary: "Parsing completed.",
      qualityFilteringSummary: "Quality filtering completed.",
      disease: "Unknown",
      recommendedDrugs: [],
      riskAssessment: "Risk assessment completed.",
      suggestedNextSteps: [],
      markdownReport: "# Prediction Report\nNo data available.",
      featureTable: [],
      ...parsed
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid prediction format received from AI.");
  }
}
