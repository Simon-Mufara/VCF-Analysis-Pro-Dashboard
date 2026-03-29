import React, { useState, useEffect } from 'react';
import { fetchClinVarForVariant, ClinVarData } from '../services/clinVarService';
import { ExternalLink, ShieldCheck, AlertCircle, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinVarDetailsProps {
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
  rsid?: string;
}

export const ClinVarDetails: React.FC<ClinVarDetailsProps> = ({ chrom, pos, ref, alt, rsid }) => {
  const [data, setData] = useState<ClinVarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClinVarForVariant(chrom, pos, ref, alt, rsid);
      if (result) {
        setData(result);
      } else {
        setError('No ClinVar record found for this variant.');
      }
    } catch (err) {
      setError('Failed to fetch ClinVar data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!isOpen && !data && !loading && !error) {
      fetchData();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleOpen}
        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <Info className="w-3 h-3" />
        {data ? 'ClinVar Details' : 'Fetch ClinVar'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 bottom-full left-0 mb-2 w-80 p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">ClinVar Integration</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <AlertCircle className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-[10px] text-zinc-500 font-medium">Querying NCBI ClinVar Database...</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[10px] text-red-600 font-medium">{error}</p>
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-900 leading-tight mb-1">{data.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-tighter">Accession: {data.accession}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Significance</div>
                    <div className={`text-[10px] font-bold ${
                      data.clinicalSignificance.toLowerCase().includes('pathogenic') ? 'text-red-600' : 'text-zinc-700'
                    }`}>
                      {data.clinicalSignificance}
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Review Status</div>
                    <div className="text-[10px] font-bold text-zinc-700 leading-tight">
                      {data.reviewStatus}
                    </div>
                  </div>
                </div>

                {data.traits.length > 0 && (
                  <div>
                    <div className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Associated Traits</div>
                    <div className="flex flex-wrap gap-1">
                      {data.traits.slice(0, 3).map((trait, i) => (
                        <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                          {trait}
                        </span>
                      ))}
                      {data.traits.length > 3 && (
                        <span className="text-[9px] text-zinc-400 font-medium">+{data.traits.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-[8px] text-zinc-400 font-medium">
                    Last Evaluated: {data.lastEvaluated || 'N/A'}
                  </div>
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${data.variationId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:underline"
                  >
                    View on NCBI
                    <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
