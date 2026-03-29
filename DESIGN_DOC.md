# VCF-Analyst-Pro: Modular Bioinformatics Architecture

## 1. Overview
This document outlines the production-grade, modular architecture for a dual-domain VCF analysis platform supporting **Cancer Somatic Analysis** and **Infectious Disease Pathogen Genomics**.

## 2. Modular Pipeline Design (Python-based)

### 2.1. Core Pipeline Interface
```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class GenomicPipeline(ABC):
    @abstractmethod
    def validate_vcf(self, vcf_path: str) -> bool:
        """Domain-specific VCF validation (e.g., check for tumour/normal tags)."""
        pass

    @abstractmethod
    def annotate_variants(self, variants: List[Dict]) -> List[Dict]:
        """Annotate variants using domain-specific databases."""
        pass

    @abstractmethod
    def prioritize_variants(self, annotated_variants: List[Dict]) -> List[Dict]:
        """Rank variants based on clinical actionability or resistance impact."""
        pass

    @abstractmethod
    def generate_clinical_report(self, prioritized_variants: List[Dict]) -> Dict[str, Any]:
        """Generate a structured, interpretable clinical report."""
        pass
```

### 2.2. Cancer Somatic Pipeline
**Focus:** Tumour-Normal paired analysis, VAF filtering, Driver identification.
**Key Features:**
- **TMB Calculation:** Mutation load per Megabase.
- **MSI Status:** Microsatellite instability detection.
- **VAF Shifting:** Detecting clonal vs. subclonal populations.

```python
class CancerSomaticPipeline(GenomicPipeline):
    def annotate_variants(self, variants):
        # Integration with OncoKB, CIViC, COSMIC
        # VEP (Variant Effect Predictor) integration
        pass

    def prioritize_variants(self, variants):
        # ACMG/AMP Somatic Guidelines implementation
        # Tiering: I (Strong Evidence), II (Potential Utility), III (VUS), IV (Benign)
        pass
```

### 2.3. Infectious Disease Pipeline (e.g., TB AMR)
**Focus:** Pathogen identification, AMR marker detection, Lineage assignment.
**Key Features:**
- **AMR Profiling:** Mapping variants to known resistance genes (e.g., *katG*, *rpoB* for TB).
- **Lineage Detection:** Using SNP-based lineage markers.
- **Heteroresistance:** Detecting low-frequency resistance variants.

```python
class InfectiousDiseasePipeline(GenomicPipeline):
    def annotate_variants(self, variants):
        # Integration with Mykrobe, TBProfiler, or ResFinder databases
        pass

    def prioritize_variants(self, variants):
        # WHO-standardized resistance classification
        pass
```

## 3. Data Structures

### 3.1. Standardized Variant Object
```python
{
    "chrom": str,
    "pos": int,
    "ref": str,
    "alt": str,
    "vaf": float,
    "depth": int,
    "annotation": {
        "gene": str,
        "impact": str,  # Missense, Nonsense, etc.
        "protein_change": str,
        "clinvar_sig": str,
        "gnomad_af": float
    },
    "clinical_evidence": {
        "tier": str,  # I, II, III, IV
        "drugs": List[str],
        "resistance_level": str  # For ID pipeline
    }
}
```

## 4. Suggested Libraries & Tools

### 4.1. Bioinformatics Core
- **pysam / vcfpy:** Efficient VCF parsing and manipulation.
- **Biopython:** Sequence analysis and database integration.
- **BCFtools / SAMtools:** (Called via subprocess) for high-performance filtering.

### 4.2. Data Science & ML
- **Pandas:** Data manipulation and feature table generation.
- **Scikit-learn / XGBoost:** For variant pathogenicity scoring or drug response prediction.
- **Matplotlib / Seaborn:** Professional genomic visualizations (Volcano plots, Lollipop plots).

### 4.3. Backend Framework
- **FastAPI:** High-performance, asynchronous Python web framework.
- **Celery + Redis:** For handling long-running bioinformatics tasks asynchronously.

## 5. Clinical Interpretation Strategy
- **Evidence-Based:** Every call must be backed by a database entry or literature citation.
- **Conservative:** Default to VUS if evidence is conflicting.
- **Actionable:** Prioritize findings that change clinical management (e.g., drug eligibility).
