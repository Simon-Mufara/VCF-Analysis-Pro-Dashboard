import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json

def detect_cnvs(depth_data, bin_size=100000, threshold_amp=0.6, threshold_del=-0.6):
    """
    Simplified CNV detection algorithm (CNVkit-like logic).
    
    Tasks:
    - Compute read depth across genome bins
    - Normalize coverage (log2 ratio)
    - Detect amplifications and deletions
    """
    # 1. Normalize coverage
    # Assuming depth_data has 'depth' and 'normal_depth'
    # log2_ratio = log2(depth / normal_depth)
    depth_data['log2_ratio'] = np.log2(depth_data['depth'] / depth_data['normal_depth'])
    
    # Handle infinities and NaNs
    depth_data.replace([np.inf, -np.inf], np.nan, inplace=True)
    depth_data['log2_ratio'] = depth_data['log2_ratio'].fillna(0)
    
    # 2. Detect Segments
    # In a real scenario, we'd use Circular Binary Segmentation (CBS)
    # Here we'll use a simplified threshold-based approach for the demo
    depth_data['status'] = 'Neutral'
    depth_data.loc[depth_data['log2_ratio'] >= threshold_amp, 'status'] = 'Amplification'
    depth_data.loc[depth_data['log2_ratio'] <= threshold_del, 'status'] = 'Deletion'
    
    return depth_data

def plot_cnv_genome(df, output_file='cnv_genome_plot.png'):
    """Generates a genome-wide CNV plot."""
    plt.figure(figsize=(15, 6))
    
    # Sort by chromosome and position
    df['chrom_num'] = df['chrom'].str.replace('chr', '')
    df.loc[df['chrom_num'] == 'X', 'chrom_num'] = '23'
    df.loc[df['chrom_num'] == 'Y', 'chrom_num'] = '24'
    df['chrom_num'] = pd.to_numeric(df['chrom_num'])
    df = df.sort_values(['chrom_num', 'start'])
    
    # Create a continuous X-axis for all chromosomes
    df['x_pos'] = range(len(df))
    
    # Plot log2 ratios
    colors = {'Neutral': '#94a3b8', 'Amplification': '#ef4444', 'Deletion': '#3b82f6'}
    for status, color in colors.items():
        subset = df[df['status'] == status]
        plt.scatter(subset['x_pos'], subset['log2_ratio'], c=color, s=10, alpha=0.6, label=status)
    
    # Add chromosome labels
    chrom_midpoints = df.groupby('chrom')['x_pos'].mean()
    plt.xticks(chrom_midpoints, chrom_midpoints.index, rotation=45, fontsize=8)
    
    plt.axhline(0, color='black', linestyle='-', alpha=0.3)
    plt.axhline(0.6, color='#ef4444', linestyle='--', alpha=0.5)
    plt.axhline(-0.6, color='#3b82f6', linestyle='--', alpha=0.5)
    
    plt.title('Genome-wide Copy Number Variation (CNV) Profile', fontsize=14)
    plt.ylabel('log2 Ratio', fontsize=12)
    plt.xlabel('Chromosome', fontsize=12)
    plt.grid(axis='y', linestyle=':', alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    plt.close()

if __name__ == "__main__":
    # Example Data Structure
    # In a real pipeline, this would be read from a .cnn or .cnr file
    chroms = ['chr1', 'chr2', 'chr3', 'chr7', 'chr8', 'chr17', 'chrX']
    data = []
    for chrom in chroms:
        for i in range(50): # 50 bins per chrom
            depth = 100 + np.random.normal(0, 10)
            normal_depth = 100
            
            # Simulate some CNVs
            if chrom == 'chr7' and 10 < i < 20: # EGFR amplification
                depth = 250 + np.random.normal(0, 20)
            if chrom == 'chr17' and 25 < i < 35: # TP53 deletion
                depth = 40 + np.random.normal(0, 5)
                
            data.append({
                'chrom': chrom,
                'start': i * 100000,
                'end': (i + 1) * 100000,
                'depth': depth,
                'normal_depth': normal_depth
            })
            
    df = pd.DataFrame(data)
    df = detect_cnvs(df)
    plot_cnv_genome(df)
    
    # Gene-level annotation (Mock)
    gene_cnvs = [
        {"gene": "EGFR", "chrom": "chr7", "log2": 1.32, "status": "Amplification", "type": "Oncogene"},
        {"gene": "TP53", "chrom": "chr17", "log2": -1.15, "status": "Deletion", "type": "Tumour Suppressor"},
        {"gene": "MYC", "chrom": "chr8", "log2": 0.85, "status": "Amplification", "type": "Oncogene"},
        {"gene": "PTEN", "chrom": "chr10", "log2": -0.92, "status": "Deletion", "type": "Tumour Suppressor"}
    ]
    
    print("CNV Analysis Results:")
    print(json.dumps(gene_cnvs, indent=2))
