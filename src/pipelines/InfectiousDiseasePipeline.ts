import { BasePipeline } from './BasePipeline';
import { GenomicDomain } from '../types/genomics';

export class InfectiousDiseasePipeline extends BasePipeline {
  protected domain = GenomicDomain.INFECTIOUS_DISEASE;
  protected systemInstruction = `
    You are in INFECTIOUS DISEASE MODE.
    Input: Single isolate VCF.
    Focus: Antimicrobial resistance (AMR), pathogen identification.
    Databases: WHO, CRyPTIC, Mycobrowser, ResFinder.
    
    Key Features:
    - AMR Profiling: Mapping variants to known resistance genes (e.g., katG, rpoB for TB).
    - Lineage Detection: Using SNP-based lineage markers.
    - Heteroresistance (VAF Analysis):
      - Extract Allele Depth (AD) and Total Depth (DP).
      - Compute VAF = ALT_DEPTH / (REF_DEPTH + ALT_DEPTH).
      - Detect low-frequency resistance variants (VAF < 0.1).
    
    Output: A comprehensive Resistance Report.
    MANDATORY: GENERATE A FULL PDF-READY MARKDOWN REPORT as defined in the VCF_CLINAI_PRO_WORKFLOW.
  `;
}
