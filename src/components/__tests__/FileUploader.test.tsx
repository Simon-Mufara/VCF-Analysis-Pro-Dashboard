import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploader } from '../FileUploader';
import React from 'react';

describe('FileUploader', () => {
  it('renders the upload area', () => {
    render(<FileUploader onDataParsed={() => {}} />);
    expect(screen.getByText(/Upload biological datasets/i)).toBeInTheDocument();
    expect(screen.getByText(/VCF, h5ad, CSV, BED, GTF, BAM, CRAM, SAM, FASTQ, or FASTA files/i)).toBeInTheDocument();
  });

  it('handles file selection and calls onDataParsed', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const validVcf = [
      '##fileformat=VCFv4.2',
      '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO',
      '1\t123456\t.\tA\tT\t60\tPASS\tAF=0.5;DP=40'
    ].join('\n');
    const file = new File([validVcf], 'test.vcf', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/test.vcf/i)).toBeInTheDocument();
    expect(screen.getByText(/Running your analysis.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    }, { timeout: 4000 });
  });

  it('correctly identifies BAM files', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const file = new File(['binary'], 'sample.bam', { type: 'application/octet-stream' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
      const firstCall = onDataParsed.mock.calls[0];
      const parsedResults = firstCall[0];
      expect(parsedResults[0].summary).toContain('[BAM ALIGNMENT ANALYSIS]');
      expect(parsedResults[0].rawData.type).toBe('bam');
    }, { timeout: 4000 });
  });

  it('correctly identifies CRAM files', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const file = new File(['binary'], 'sample.cram', { type: 'application/octet-stream' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
      const firstCall = onDataParsed.mock.calls[0];
      const parsedResults = firstCall[0];
      expect(parsedResults[0].summary).toContain('[CRAM ALIGNMENT ANALYSIS]');
      expect(parsedResults[0].rawData.type).toBe('cram');
    }, { timeout: 4000 });
  });
});
