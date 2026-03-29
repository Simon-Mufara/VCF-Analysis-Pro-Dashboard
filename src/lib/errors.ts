export enum AnalysisErrorType {
  EMPTY_FILE = 'EMPTY_FILE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_HEADER = 'MISSING_HEADER',
  NO_VARIANTS = 'NO_VARIANTS',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
}

export class AnalysisError extends Error {
  type: AnalysisErrorType;
  details?: string;

  constructor(type: AnalysisErrorType, message: string, details?: string) {
    super(message);
    this.name = 'AnalysisError';
    this.type = type;
    this.details = details;
  }
}

export const getErrorMessage = (error: any): string => {
  if (error instanceof AnalysisError) {
    switch (error.type) {
      case AnalysisErrorType.EMPTY_FILE:
        return `The uploaded file is empty. Please provide a valid genomic dataset.`;
      case AnalysisErrorType.INVALID_FORMAT:
        return `The file format is invalid or unsupported. Supported formats include VCF, BED, GTF, BAM, CRAM, SAM, FASTQ, and FASTA.`;
      case AnalysisErrorType.MISSING_HEADER:
        return `The VCF file is missing the required header line (#CHROM...). Please ensure it follows the VCF 4.2+ specification.`;
      case AnalysisErrorType.NO_VARIANTS:
        return `No variants were detected in the file. Please ensure the file contains valid genomic markers.`;
      case AnalysisErrorType.FILE_TOO_LARGE:
        return `The file is too large for browser-based parsing. Please provide a smaller sample or use our CLI tool for large datasets.`;
      case AnalysisErrorType.AI_ANALYSIS_FAILED:
        return `The AI analysis failed to interpret the genomic data. This could be due to complex variants or insufficient clinical context.`;
      case AnalysisErrorType.NETWORK_ERROR:
        return `A network error occurred while connecting to the analysis engine. Please check your internet connection and try again.`;
      case AnalysisErrorType.FILE_READ_ERROR:
        return `Failed to read the uploaded file. It might be corrupted or in an inaccessible location.`;
      case AnalysisErrorType.PARSING_ERROR:
        return `An error occurred while parsing the genomic data. Please ensure the file content is valid.`;
      default:
        return error.message || "An unexpected error occurred during analysis.";
    }
  }
  
  if (error?.message?.includes('API key')) {
    return "Invalid or missing API key. Please check your configuration.";
  }

  return error?.message || "An unexpected error occurred. Please try again.";
};
