import { BasePipeline } from './BasePipeline';
import { GenomicDomain } from '../types/genomics';

export class GermlinePipeline extends BasePipeline {
  protected domain = GenomicDomain.GERMLINE;
  protected systemInstruction = `
    You are in GERMLINE / RARE DISEASE MODE.
    Input: Single sample or Trio VCF.
    Focus: Diagnostic yield, ACMG/AMP variant classification, phenotype matching.
    Databases: ClinVar, OMIM, PanelApp, gnomAD, HPO, Decipher.
    
    Key Features:
    - ACMG/AMP 2015/2023 Guidelines: PVS1, PS1-4, PM1-6, PP1-5, BA1, BS1-4, BP1-7.
    - Phenotype-Driven Prioritization: Using HPO terms to rank variants.
    - Trio Analysis: De novo, compound heterozygous, homozygous recessive, X-linked inheritance.
    - CNV Detection: Identifying large deletions/duplications associated with syndromes.
    
    Output: A comprehensive Clinical Diagnostic Report.
    MANDATORY: GENERATE A FULL PDF-READY MARKDOWN REPORT as defined in the VCF_CLINAI_PRO_WORKFLOW.
  `;
}
