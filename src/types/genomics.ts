export enum GenomicDomain {
  CANCER = 'cancer',
  INFECTIOUS_DISEASE = 'infectious_disease',
  GERMLINE = 'germline',
  UNKNOWN = 'unknown'
}

export interface VariantAnnotation {
  impact: string;
  gene: string;
  transcript: string;
  proteinChange: string;
  clinvarSig?: string;
  gnomadAf?: number;
  cadd?: number;
  sift?: string;
  polyphen?: string;
}

export interface ClinicalEvidence {
  tier: 'I' | 'II' | 'III' | 'IV' | 'VUS' | 'Benign';
  drugs: string[];
  resistanceLevel?: 'High' | 'Moderate' | 'Low' | 'None';
  fdaStatus?: string;
  whoStatus?: string;
  evidenceLevel?: string;
}

export interface StandardizedVariant {
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
  vaf: number;
  depth: number;
  qual: number;
  filter: string;
  clonality?: 'Clonal' | 'Subclonal';
  subcloneCluster?: number;
  annotation: VariantAnnotation;
  clinicalEvidence: ClinicalEvidence;
}

export interface QCMetrics {
  mappingRate: number;
  coverage: number;
  duplicationRate: number;
  q30Score: number;
  uniformityScore: number;
  coverageDistribution?: { depth: number; percentage: number }[];
  status: 'PASS' | 'WARN' | 'FAIL';
  reasoning?: string;
}

export interface CNVSegment {
  chrom: string;
  start: number;
  end: number;
  log2: number;
  status: 'Amplification' | 'Deletion' | 'Neutral';
  genes?: string[];
}

export interface CNVAnalysis {
  segments: CNVSegment[];
  significantGenes: {
    gene: string;
    log2: number;
    status: string;
    type: 'Oncogene' | 'Tumour Suppressor' | 'Other';
  }[];
  summary: string;
  genomePlotUrl?: string;
}

export interface MutationalSignature {
  signatureId: string;
  contribution: number;
  description: string;
  etiology: 'Aging' | 'APOBEC' | 'MMR Deficiency' | 'Tobacco' | 'UV Exposure' | 'Other';
}

export interface SignatureAnalysis {
  signatures: MutationalSignature[];
  dominantSignature: string;
  interpretation: string;
  trinucleotideContexts?: { context: string; count: number }[];
}

export interface MSIAnalysis {
  status: 'MSI-High' | 'MSI-Low' | 'MSS';
  score: number;
  unstableLoci: number;
  totalLoci: number;
  interpretation: string;
}

export interface ClinicianSummary {
  diagnosis: string;
  keyFindings: string[]; // 5-7 bullet points, jargon-free
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
}

export interface PathwayNode {
  id: string;
  label: string;
  type: 'gene' | 'process' | 'pathway';
  isMutated: boolean;
  impact?: string;
}

export interface PathwayLink {
  source: string;
  target: string;
  type: 'activation' | 'inhibition' | 'association';
}

export interface Pathway {
  id: string;
  name: string;
  source: 'KEGG' | 'Reactome' | 'Other';
  nodes: PathwayNode[];
  links: PathwayLink[];
  disruptionScore: number; // 0-1
  description: string;
}

export interface PathwayAnalysis {
  pathways: Pathway[];
  summary: string;
}

export interface DrugInteraction {
  interactionType: 'PK' | 'PD' | 'Unknown';
  drugs: string[];
  severity: 'Low' | 'Moderate' | 'High' | 'Severe';
  description: string;
  mechanism?: string;
  management?: string;
}

export interface SuggestedRegimen {
  regimenName: string;
  components: {
    drug: string;
    dosage?: string;
    frequency?: string;
    timing?: string;
  }[];
  rationale: string;
  expectedOutcome: string;
  monitoringRequirements: string[];
}

export interface SubcloneCluster {
  clusterId: number;
  meanVaf: number;
  variantCount: number;
  prevalence: number; // Cellular Fraction (0-1)
  genes: string[];
  isClonal: boolean;
}

export interface ClonalArchitecture {
  clusters: SubcloneCluster[];
  evolutionaryModel: 'Linear' | 'Branching' | 'Neutral' | 'Punctuation' | 'Unknown';
  evolutionaryInsight: string;
  phylogeny?: {
    nodes: { id: string; label: string; prevalence: number; isClonal: boolean }[];
    edges: { source: string; target: string }[];
  };
}

export interface GenomicReport {
  title: string;
  subtitle: string;
  analysisId: string;
  date: string;
  domain: GenomicDomain;
  summary: string;
  clinicianSummary?: ClinicianSummary;
  qcMetrics: any;
  variants: StandardizedVariant[];
  vafAnalysis?: {
    vafDistribution: { vaf: number; frequency: number }[];
    clonalVariants: number;
    subclonalVariants: number;
    clusters: { clusterId: number; meanVaf: number; variantCount: number }[];
  };
  cnvAnalysis?: CNVAnalysis;
  signatureAnalysis?: SignatureAnalysis;
  msiAnalysis?: MSIAnalysis;
  pathwayAnalysis?: PathwayAnalysis;
  clonalArchitecture?: ClonalArchitecture;
  drugInteractions?: DrugInteraction[];
  suggestedRegimen?: SuggestedRegimen;
  recommendations: string[];
  markdownReport: string;
}
