import React from 'react';
import { BookOpen, FileUp, Activity, GitCompare, ShieldCheck, Zap, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const UserGuide: React.FC = () => {
  const steps = [
    {
      title: "1. Upload Genomic Data",
      description: "Upload one or more VCF (Variant Call Format) files. We support single-sample, tumour-normal pairs, and cohort-level data.",
      icon: <FileUp className="w-6 h-6 text-blue-500" />,
      details: [
        "Drag and drop files or click to browse.",
        "Ensure files are in standard VCF format (.vcf).",
        "Multiple files enable comparative genomics analysis."
      ]
    },
    {
      title: "2. Provide Clinical Context",
      description: "Add ICD-10 codes or clinical descriptions to tailor the AI's interpretation to the patient's specific condition.",
      icon: <Activity className="w-6 h-6 text-emerald-500" />,
      details: [
        "Enter ICD-10 codes (e.g., C34.9 for Lung Cancer).",
        "Describe symptoms or family history.",
        "Mention current medications for interaction checks."
      ]
    },
    {
      title: "3. Run AI Analysis",
      description: "Our VCF-ClinAI-Pro pipeline uses advanced LLMs to identify pathogenic variants and predict therapeutic outcomes.",
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      details: [
        "Automated variant prioritization (ClinVar, gnomAD).",
        "Drug efficacy and toxicity prediction.",
        "Clonal architecture and CNV analysis for cancer cases."
      ]
    },
    {
      title: "4. Review & Export Reports",
      description: "Access detailed clinical reports, interactive visualizations, and export your findings to PDF for MDT review.",
      icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
      details: [
        "Interactive VAF and CNV plots.",
        "Drug-drug interaction network graphs.",
        "Full Markdown reports ready for clinical correlation."
      ]
    }
  ];

  return (
    <div className="space-y-8 py-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4 flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-zinc-900" />
          User Guidelines
        </h2>
        <p className="text-zinc-600">
          Welcome to VCF-ClinAI-Pro. Follow these steps to perform professional-grade clinical genomic analysis and therapeutic prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-50 rounded-2xl">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-center gap-2 text-xs text-zinc-500">
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mt-8">
        <div className="flex gap-4">
          <Info className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Important Note</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              VCF-ClinAI-Pro is designed for research and clinical correlation only. All AI-generated findings should be validated by a qualified medical professional before making any diagnostic or treatment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
