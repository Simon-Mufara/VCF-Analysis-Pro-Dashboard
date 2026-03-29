/**
 * ClinVar Service for fetching variant data from NCBI E-utilities.
 */

export interface ClinVarData {
  uid: string;
  title: string;
  clinicalSignificance: string;
  reviewStatus: string;
  lastEvaluated?: string;
  traits: string[];
  variationId: string;
  accession: string;
}

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Search for a variant in ClinVar by RSID or location.
 */
export async function searchClinVar(term: string): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(term)}&retmode=json`);
    if (!response.ok) throw new Error('ClinVar search failed');
    const data = await response.json();
    return data.esearchresult.idlist || [];
  } catch (error) {
    console.error('Error searching ClinVar:', error);
    return [];
  }
}

/**
 * Get summary details for a list of ClinVar UIDs.
 */
export async function getClinVarSummary(uids: string[]): Promise<ClinVarData[]> {
  if (uids.length === 0) return [];
  
  try {
    const response = await fetch(`${BASE_URL}/esummary.fcgi?db=clinvar&id=${uids.join(',')}&retmode=json`);
    if (!response.ok) throw new Error('ClinVar summary fetch failed');
    const data = await response.json();
    
    const results: ClinVarData[] = [];
    uids.forEach(uid => {
      const entry = data.result[uid];
      if (entry) {
        results.push({
          uid,
          title: entry.title,
          clinicalSignificance: entry.clinical_significance?.description || 'Unknown',
          reviewStatus: entry.clinical_significance?.review_status || 'No assertion criteria provided',
          lastEvaluated: entry.clinical_significance?.last_evaluated,
          traits: entry.trait_set?.map((t: any) => t.trait_name) || [],
          variationId: entry.variation_set?.[0]?.variation_id || '',
          accession: entry.accession || '',
        });
      }
    });
    return results;
  } catch (error) {
    console.error('Error fetching ClinVar summary:', error);
    return [];
  }
}

/**
 * Fetch ClinVar data for a specific variant.
 */
export async function fetchClinVarForVariant(chrom: string, pos: number, ref: string, alt: string, rsid?: string): Promise<ClinVarData | null> {
  let term = '';
  if (rsid && rsid !== '.' && rsid.startsWith('rs')) {
    term = `${rsid}[Variant Name]`;
  } else {
    // Search by location: "chrom[CHR] AND pos[Location]"
    // Note: NCBI location search can be tricky, sometimes "chrom:pos" works better in some contexts
    // but for ClinVar esearch:
    const cleanChrom = chrom.replace('chr', '');
    term = `${cleanChrom}[CHR] AND ${pos}[Location]`;
  }

  const ids = await searchClinVar(term);
  if (ids.length === 0) return null;

  const summaries = await getClinVarSummary([ids[0]]);
  return summaries.length > 0 ? summaries[0] : null;
}
