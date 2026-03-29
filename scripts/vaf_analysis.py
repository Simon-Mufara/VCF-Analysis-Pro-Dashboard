import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import json

def calculate_vaf(vcf_df):
    """
    Calculates Variant Allele Frequency (VAF) from AD (Allele Depth) and DP (Total Depth).
    
    VAF = ALT_DEPTH / (REF_DEPTH + ALT_DEPTH)
    
    Classification:
    - Clonal: VAF > 0.3
    - Subclonal: VAF <= 0.3
    """
    
    def parse_ad(ad_val):
        if pd.isna(ad_val) or ad_val == '.' or ad_val == '0':
            return 0, 0
        try:
            # AD is typically "REF,ALT"
            parts = str(ad_val).split(',')
            if len(parts) >= 2:
                return int(parts[0]), int(parts[1])
            return int(parts[0]), 0
        except (ValueError, IndexError):
            return 0, 0

    # Extract depths
    depths = vcf_df['AD'].apply(parse_ad)
    vcf_df['REF_DEPTH'] = depths.apply(lambda x: x[0])
    vcf_df['ALT_DEPTH'] = depths.apply(lambda x: x[1])
    
    # Calculate VAF
    # We use ALT / (REF + ALT) to be robust against cases where DP != REF + ALT
    vcf_df['VAF'] = vcf_df['ALT_DEPTH'] / (vcf_df['REF_DEPTH'] + vcf_df['ALT_DEPTH'])
    
    # Handle edge cases: Division by zero (no coverage)
    vcf_df['VAF'] = vcf_df['VAF'].fillna(0)
    
    # Classification
    vcf_df['Clonality'] = np.where(vcf_df['VAF'] > 0.3, 'Clonal', 'Subclonal')
    
    return vcf_df

def plot_vaf_distribution(vcf_df, output_file='vaf_histogram.png'):
    """Generates a histogram of VAF values."""
    plt.figure(figsize=(10, 6))
    plt.hist(vcf_df['VAF'], bins=50, color='#3b82f6', edgecolor='white', alpha=0.8)
    plt.axvline(0.3, color='#ef4444', linestyle='--', label='Clonal Threshold (0.3)')
    plt.title('Variant Allele Frequency (VAF) Distribution', fontsize=14, pad=15)
    plt.xlabel('VAF', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.grid(axis='y', linestyle=':', alpha=0.6)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    plt.close()

def cluster_subclones(vcf_df, n_clusters=3):
    """Optional: Clusters variants based on VAF to identify subclonal populations."""
    if len(vcf_df) < n_clusters:
        return vcf_df
        
    vaf_data = vcf_df[['VAF']].values
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    vcf_df['Subclone_Cluster'] = kmeans.fit_predict(vaf_data)
    
    return vcf_df

if __name__ == "__main__":
    # Example Input Data (Simulating VCF fields)
    example_data = {
        'CHROM': ['chr1', 'chr1', 'chr2', 'chr7', 'chr17', 'chrX'],
        'POS': [12345, 67890, 11223, 44556, 77889, 99001],
        'REF': ['C', 'G', 'A', 'T', 'C', 'G'],
        'ALT': ['T', 'A', 'G', 'C', 'G', 'A'],
        'AD': ['30,2', '15,15', '40,10', '20,40', '10,8', '50,1'], # REF,ALT
        'DP': [32, 30, 50, 60, 18, 51]
    }
    
    df = pd.DataFrame(example_data)
    
    # 1. Calculate VAF and Classify
    df = calculate_vaf(df)
    
    # 2. Optional Clustering
    df = cluster_subclones(df)
    
    # 3. Visualization
    plot_vaf_distribution(df)
    
    # Output Results
    print("VAF Analysis Results:")
    print(df[['CHROM', 'POS', 'VAF', 'Clonality', 'Subclone_Cluster']])
    
    # Integration Point: This script can be called via subprocess or 
    # integrated into a larger Python-based bioinformatics pipeline.
