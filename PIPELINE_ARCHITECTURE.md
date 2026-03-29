# VCF-Analyst-Pro Pipeline Architecture

This document outlines the modular architecture for the VCF analysis platform, supporting both Cancer Genomics and Infectious Disease Genomics.

## 1. Folder Structure

```text
/src
  /pipelines
    BasePipeline.ts          # Abstract base class for all pipelines
    CancerSomaticPipeline.ts # Somatic mutation analysis (Tumour-Normal)
    InfectiousDiseasePipeline.ts # AMR and pathogen analysis (Single Isolate)
    PipelineFactory.ts       # Domain detection and routing logic
  /modules
    QCModule.ts              # Shared sequencing quality control logic
    VariantAnnotator.ts      # Shared annotation utilities
  /types
    genomics.ts              # Standardized data structures (Variant, Report, etc.)
  /services
    geminiService.ts         # Main AI service entry point
```

## 2. Pipeline Flow Diagrams

### Cancer Genomics Mode (Somatic)
```text
[Input: Tumour-Normal VCF]
          |
          v
[QCModule: Shared Quality Check]
          |
          v
[CancerSomaticPipeline]
    - Somatic Variant Calling (VAF/Depth)
    - Driver Gene Identification (COSMIC/OncoKB)
    - Clinical Oncology Annotation (ClinVar/CIViC)
          |
          v
[Output: Cancer Mutation Report]
```

### Infectious Disease Mode (AMR)
```text
[Input: Single Isolate VCF]
          |
          v
[QCModule: Shared Quality Check]
          |
          v
[InfectiousDiseasePipeline]
    - AMR Variant Detection (WHO/CRyPTIC)
    - Pathogen-Specific Annotation (Mycobrowser)
    - Resistance Profile Prediction
          |
          v
[Output: Resistance Report]
```

## 3. Routing Logic (Pseudocode)

```typescript
/**
 * Detects the genomic domain based on reference genome or VCF metadata.
 */
function detectDomain(vcfMetadata: string): GenomicDomain {
  if (vcfMetadata.includes("GRCh38") || vcfMetadata.includes("hg19")) {
    // If paired samples detected, it's somatic
    if (vcfMetadata.includes("TUMOR") && vcfMetadata.includes("NORMAL")) {
      return GenomicDomain.CANCER;
    }
    return GenomicDomain.GERMLINE;
  }
  
  if (vcfMetadata.includes("H37Rv") || vcfMetadata.includes("Mycobacterium")) {
    return GenomicDomain.INFECTIOUS_DISEASE;
  }
  
  return GenomicDomain.UNKNOWN;
}

/**
 * Factory to route to the correct pipeline.
 */
class PipelineFactory {
  static getPipeline(domain: GenomicDomain): BasePipeline {
    switch (domain) {
      case GenomicDomain.CANCER:
        return new CancerSomaticPipeline();
      case GenomicDomain.INFECTIOUS_DISEASE:
        return new InfectiousDiseasePipeline();
      default:
        throw new Error("Unsupported genomic domain.");
    }
  }
}
```
