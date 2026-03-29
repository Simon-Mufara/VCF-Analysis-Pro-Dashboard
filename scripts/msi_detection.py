import numpy as np
import json

def detect_msi(vcf_df, microsatellite_loci=None):
    """
    Detects Microsatellite Instability (MSI).
    
    Algorithm:
    1. Identify variants falling within known microsatellite regions (STRs).
    2. Filter for small insertions and deletions (Indels).
    3. Calculate the fraction of unstable loci:
       MSI_Score = (Number of Unstable Loci) / (Total Microsatellite Loci Evaluated)
    
    Thresholds:
    - MSI-High (MSI-H): Score >= 0.20 (20% unstable)
    - MSI-Low (MSI-L): 0.0 < Score < 0.20
    - Microsatellite Stable (MSS): Score == 0.0
    """
    
    # Mock implementation for demonstration
    total_loci = 100
    unstable_loci = np.random.randint(0, 40) # Randomly simulate instability
    
    msi_score = unstable_loci / total_loci
    
    if msi_score >= 0.20:
        status = "MSI-High"
        interpretation = "High instability detected. Likely responsive to immune checkpoint inhibitors (e.g., Pembrolizumab)."
    elif msi_score > 0:
        status = "MSI-Low"
        interpretation = "Low level of instability detected. Clinical significance varies."
    else:
        status = "MSS"
        interpretation = "Microsatellite stable. Standard chemotherapy protocols recommended."
        
    return {
        "score": msi_score,
        "status": status,
        "unstableLoci": unstable_loci,
        "totalLoci": total_loci,
        "interpretation": interpretation
    }

if __name__ == "__main__":
    # Example usage
    results = detect_msi(None)
    print(json.dumps(results, indent=2))
