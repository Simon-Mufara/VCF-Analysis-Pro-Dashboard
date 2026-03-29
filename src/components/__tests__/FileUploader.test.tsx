import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploader } from '../FileUploader';
import React from 'react';

describe('FileUploader', () => {
  it('renders the upload area', () => {
    render(<FileUploader onDataParsed={() => {}} />);
    expect(screen.getByText(/Upload biological datasets/i)).toBeInTheDocument();
    expect(screen.getByText(/VCF, h5ad, CSV, BED, GTF, BAM, or CRAM files/i)).toBeInTheDocument();
  });

  it('handles file selection and calls onDataParsed', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const file = new File(['mock content'], 'test.vcf', { type: 'text/plain' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' }) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/test.vcf/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing genomic sequences.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('correctly identifies BAM files', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const file = new File(['binary'], 'sample.bam', { type: 'application/octet-stream' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' }) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalledWith(
        expect.stringContaining('[BAM ALIGNMENT ANALYSIS]'),
        expect.objectContaining({ type: 'bam' })
      );
    }, { timeout: 3000 });
  });

  it('correctly identifies CRAM files', async () => {
    const onDataParsed = vi.fn();
    render(<FileUploader onDataParsed={onDataParsed} />);
    
    const file = new File(['binary'], 'sample.cram', { type: 'application/octet-stream' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' }) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalledWith(
        expect.stringContaining('[CRAM ALIGNMENT ANALYSIS]'),
        expect.objectContaining({ type: 'cram' })
      );
    }, { timeout: 3000 });
  });
});
