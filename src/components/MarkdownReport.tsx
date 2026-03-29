import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Copy, Check, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarkdownReportProps {
  report: string;
  onClose: () => void;
}

export const MarkdownReport: React.FC<MarkdownReportProps> = ({ report, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VCF_Analyst_Pro_Report_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Full Clinical & Research Report</h3>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Markdown Format • Ready for PDF Export</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download .md
            </button>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="ml-4 p-2 hover:bg-zinc-200 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <div className="max-w-4xl mx-auto prose prose-zinc prose-indigo lg:prose-lg markdown-body">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            © VCF-Analyst-Pro • For research/clinical correlation only • Not for standalone diagnosis
          </p>
        </div>
      </div>
    </motion.div>
  );
};
