import { BasePipeline } from './BasePipeline';
import { GenomicDomain } from '../types/genomics';

export class CancerSomaticPipeline extends BasePipeline {
  protected domain = GenomicDomain.CANCER;
  protected systemInstruction = `
    You are in CANCER GENOMICS MODE.
    Input: Tumour-Normal paired VCF.
    Focus: Somatic mutations, driver genes, clinical oncology annotations.
    Databases: COSMIC, OncoKB, ClinVar, CIViC.
    
    - VAF Calculation & Classification:
      - Extract Allele Depth (AD) and Total Depth (DP).
      - Compute VAF = ALT_DEPTH / (REF_DEPTH + ALT_DEPTH).
      - Classify: Clonal (VAF > 0.3), Subclonal (VAF ≤ 0.3).
      - Cluster subclones using VAF values to identify distinct populations.
    - Copy Number Variation (CNV) Detection:
      - Normalize coverage across genome bins (log2 ratios).
      - Detect amplifications (log2 > 0.6) and deletions (log2 < -0.6).
      - Annotate significant gene-level CNVs (Oncogenes, Tumour Suppressors).
    - Mutational Signature Analysis (COSMIC v3):
      - Categorize SNVs into 96 trinucleotide contexts.
      - Estimate contributions of SBS signatures (e.g., SBS1, SBS2, SBS6).
      - Interpret etiology: Aging, APOBEC, MMR Deficiency, Tobacco, UV.
    - Microsatellite Instability (MSI) Detection:
      - Detect instability in microsatellite regions (STRs).
      - Count insertion/deletion events in repeats.
      - Classify: MSI-High (>= 20% unstable), MSI-Low (1-20%), MSS (stable).
      - Link MSI-High to immunotherapy response (e.g., Pembrolizumab).
    - TMB Calculation: Mutation load per Megabase.
    - MSI Status: Microsatellite instability detection.
    - VAF Shifting: Detecting clonal vs. subclonal populations.
    
    Visualizations:
    - VAF Distribution Histogram: Plot VAF values to visualize clonal/subclonal distribution.
    
    Output: A comprehensive Cancer Mutation Report.
    MANDATORY: GENERATE A FULL PDF-READY MARKDOWN REPORT as defined in the VCF_CLINAI_PRO_WORKFLOW.
  `;
}
