import { QCMetrics } from '../types/genomics';

/**
 * Shared sequencing quality control module.
 */
export class QCModule {
  /**
   * Analyzes sequencing quality control metrics.
   * @param metrics The QC metrics to analyze.
   * @returns A status and reasoning for the QC.
   */
  static analyzeQC(metrics: QCMetrics): { status: 'PASS' | 'WARN' | 'FAIL'; reasoning: string } {
    const { mappingRate, coverage, duplicationRate, q30Score, uniformityScore } = metrics;
    
    let status: 'PASS' | 'WARN' | 'FAIL' = "PASS";
    let reasoning = "All sequencing quality metrics are within industry standards.";
    
    if (coverage < 30) {
      status = "WARN";
      reasoning = `Low mean coverage detected (${coverage.toFixed(1)}x). Minimum recommended is 30x for somatic analysis.`;
    }
    
    if (mappingRate < 0.95) {
      status = "FAIL";
      reasoning = `Low mapping rate detected (${(mappingRate * 100).toFixed(1)}%). Possible contamination or poor sample quality.`;
    }
    
    if (duplicationRate > 0.2) {
      status = "WARN";
      reasoning = `High duplication rate detected (${(duplicationRate * 100).toFixed(1)}%). This may reduce effective coverage.`;
    }
    
    if (q30Score < 80) {
      status = "FAIL";
      reasoning = `Low Q30 score detected (${q30Score}%). Base call accuracy is below acceptable thresholds.`;
    }

    if (uniformityScore < 0.9) {
      status = "WARN";
      reasoning = `Low coverage uniformity detected (${(uniformityScore * 100).toFixed(1)}%). Some target regions may have insufficient depth.`;
    }
    
    return { status, reasoning };
  }
}
