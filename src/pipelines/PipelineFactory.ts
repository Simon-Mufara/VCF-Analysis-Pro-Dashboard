import { CancerSomaticPipeline } from './CancerSomaticPipeline';
import { InfectiousDiseasePipeline } from './InfectiousDiseasePipeline';
import { GermlinePipeline } from './GermlinePipeline';
import { GenomicDomain } from '../types/genomics';

export class PipelineFactory {
  static getPipeline(domain: GenomicDomain) {
    switch (domain) {
      case GenomicDomain.CANCER:
        return new CancerSomaticPipeline();
      case GenomicDomain.INFECTIOUS_DISEASE:
        return new InfectiousDiseasePipeline();
      case GenomicDomain.GERMLINE:
        return new GermlinePipeline();
      default:
        // Fallback to CancerSomaticPipeline for unknown domains as it's the most robust
        return new CancerSomaticPipeline();
    }
  }

  static detectDomain(summary: string): GenomicDomain {
    const s = summary.toLowerCase();
    
    // Human Reference Genomes
    if (s.includes("grch38") || s.includes("hg19") || s.includes("grch37") || s.includes("hg38")) {
      // Somatic vs Germline detection
      if (s.includes("tumor") || s.includes("tumour") || s.includes("somatic") || s.includes("paired")) {
        return GenomicDomain.CANCER;
      }
      return GenomicDomain.GERMLINE;
    }
    
    // Pathogens / Infectious Disease
    if (s.includes("h37rv") || s.includes("mycobacterium") || s.includes("tuberculosis") || s.includes("amr") || s.includes("resistance") || s.includes("tb")) {
      return GenomicDomain.INFECTIOUS_DISEASE;
    }
    
    if (s.includes("sarscov2") || s.includes("virus") || s.includes("viral") || s.includes("pathogen") || s.includes("bacterial")) {
      return GenomicDomain.INFECTIOUS_DISEASE;
    }

    // Fallback based on keywords
    if (s.includes('cancer') || s.includes('tumour') || s.includes('somatic')) {
      return GenomicDomain.CANCER;
    }

    return GenomicDomain.UNKNOWN;
  }
}
