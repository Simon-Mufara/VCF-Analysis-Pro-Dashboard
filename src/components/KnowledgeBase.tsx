import React from 'react';
import { ShieldCheck, Database, Search, Activity, BookOpen, BrainCircuit } from 'lucide-react';

export const KnowledgeBase = () => {
  const tools = [
    {
      name: "ClinVar",
      description: "A public archive of reports of the relationships among human variations and phenotypes, with supporting evidence.",
      icon: <Database className="w-5 h-5" />,
      url: "https://www.ncbi.nlm.nih.gov/clinvar/"
    },
    {
      name: "PharmGKB",
      description: "A pharmacogenomics knowledge resource that encompasses clinical information including clinical guidelines and drug labels.",
      icon: <Activity className="w-5 h-5" />,
      url: "https://www.pharmgkb.org/"
    },
    {
      name: "DrugBank",
      description: "A comprehensive, free-to-access, online database containing information on drugs and drug targets.",
      icon: <Search className="w-5 h-5" />,
      url: "https://go.drugbank.com/"
    },
    {
      name: "ClinicalTrials.gov",
      description: "A database of privately and publicly funded clinical studies conducted around the world.",
      icon: <BookOpen className="w-5 h-5" />,
      url: "https://clinicaltrials.gov/"
    },
    {
      name: "dbSNP",
      description: "The database of short genetic variations, including single nucleotide polymorphisms (SNPs) and small insertions/deletions.",
      icon: <Database className="w-5 h-5" />,
      url: "https://www.ncbi.nlm.nih.gov/snp/"
    },
    {
      name: "OMIM",
      description: "Online Mendelian Inheritance in Man, a comprehensive, authoritative compendium of human genes and genetic phenotypes.",
      icon: <Activity className="w-5 h-5" />,
      url: "https://www.omim.org/"
    },
    {
      name: "UniProt",
      description: "The Universal Protein Resource, a comprehensive resource for protein sequence and annotation data.",
      icon: <Search className="w-5 h-5" />,
      url: "https://www.uniprot.org/"
    },
    {
      name: "KEGG",
      description: "Kyoto Encyclopedia of Genes and Genomes, a database resource for understanding high-level functions and utilities of the biological system.",
      icon: <BookOpen className="w-5 h-5" />,
      url: "https://www.genome.jp/kegg/"
    },
    {
      name: "Reactome",
      description: "A free, open-source, curated and peer-reviewed pathway database to support basic research, genome analysis, and systems biology.",
      icon: <Activity className="w-5 h-5" />,
      url: "https://reactome.org/"
    },
    {
      name: "AlphaFold DB",
      description: "Provides open access to over 200 million protein structure predictions created by AlphaFold.",
      icon: <BrainCircuit className="w-5 h-5" />,
      url: "https://alphafold.ebi.ac.uk/"
    },
    {
      name: "DeepVariant",
      description: "An analysis pipeline that uses a deep neural network to call genetic variants from next-generation sequencing read alignments.",
      icon: <ShieldCheck className="w-5 h-5" />,
      url: "https://github.com/google/deepvariant"
    }
  ];

  return (
    <div className="mt-24 border-t border-zinc-200 pt-16">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-emerald-600" />
        <div>
          <h2 className="text-2xl font-bold">Clinical Knowledge Base</h2>
          <p className="text-zinc-500 text-sm">BioPredict AI integrates data from world-leading bioinformatics resources.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, i) => (
          <a 
            key={i}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 bg-white border border-zinc-100 rounded-2xl hover:shadow-lg hover:border-emerald-100 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                {tool.icon}
              </div>
              <h3 className="font-bold text-lg">{tool.name}</h3>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};
