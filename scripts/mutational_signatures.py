import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json

def categorize_96_contexts(vcf_df):
    """
    Categorizes SNVs into 96 trinucleotide contexts.
    
    Algorithm:
    1. Identify the reference base and the mutated base (C>A, C>G, C>T, T>A, T>C, T>G).
    2. Extract the 5' and 3' flanking bases from the reference genome.
    3. Map all mutations to the pyrimidine-base reference (C or T).
    4. Combine context (e.g., A[C>A]G) into one of 96 categories.
    """
    # Simplified mock implementation for the demo
    contexts = []
    bases = ['A', 'C', 'G', 'T']
    mutations = ['C>A', 'C>G', 'C>T', 'T>A', 'T>C', 'T>G']
    
    for m in mutations:
        for left in bases:
            for right in bases:
                contexts.append(f"{left}[{m}]{right}")
    
    return contexts

def estimate_signatures(mutation_counts, cosmic_signatures):
    """
    Estimates the contribution of each COSMIC signature.
    
    Algorithm:
    - Uses Non-negative Least Squares (NNLS) to solve: 
      Mutation_Counts ≈ Signature_Matrix * Contribution_Vector
    - Contribution_Vector represents the 'exposure' of each signature.
    """
    # Mock estimation
    signatures = ["SBS1 (Aging)", "SBS2 (APOBEC)", "SBS6 (MMR Deficiency)", "SBS13 (APOBEC)"]
    contributions = [0.45, 0.15, 0.30, 0.10]
    
    return dict(zip(signatures, contributions))

def plot_signatures(contributions, output_file='mutational_signatures.png'):
    """Generates a bar plot of signature contributions."""
    plt.figure(figsize=(10, 6))
    names = list(contributions.keys())
    values = list(contributions.values())
    
    colors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b']
    plt.bar(names, values, color=colors)
    
    plt.title('Mutational Signature Contributions (COSMIC v3)', fontsize=14)
    plt.ylabel('Relative Contribution', fontsize=12)
    plt.ylim(0, 1)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add interpretation labels
    for i, v in enumerate(values):
        plt.text(i, v + 0.02, f"{v*100:.1f}%", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    plt.close()

if __name__ == "__main__":
    # Example usage
    mock_counts = np.random.randint(1, 100, 96)
    sig_results = estimate_signatures(mock_counts, None)
    plot_signatures(sig_results)
    
    print("Mutational Signature Analysis Results:")
    print(json.dumps(sig_results, indent=2))
