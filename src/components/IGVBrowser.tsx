import React, { useEffect, useRef, useState } from 'react';
import igv from 'igv';
import { LayoutDashboard } from 'lucide-react';

interface IGVBrowserProps {
  files: File[];
}

export const IGVBrowser: React.FC<IGVBrowserProps> = ({ files }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [genome, setGenome] = useState('hg38');

  useEffect(() => {
    // Inject IGV CSS
    const linkId = 'igv-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/igv@2.15.5/dist/igv.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous browser content
    containerRef.current.innerHTML = '';

    const vcfFiles = files.filter(f => f.name.toLowerCase().endsWith('.vcf'));
    const bamFiles = files.filter(f => f.name.toLowerCase().endsWith('.bam'));

    const options = {
      genome: genome,
      locus: 'all',
      tracks: [
        ...vcfFiles.map(file => ({
          name: file.name,
          url: file,
          type: 'variant',
          format: 'vcf',
          displayMode: 'EXPANDED'
        })),
        ...bamFiles.map(file => ({
          name: file.name,
          url: file,
          type: 'alignment',
          format: 'bam'
        }))
      ]
    };

    // Initialize IGV
    igv.createBrowser(containerRef.current, options as any)
      .then(() => {
        console.log("IGV browser created successfully");
      })
      .catch((error: any) => {
        console.error("Error creating IGV browser:", error);
      });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [files, genome]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Embedded IGV Browser</h3>
            <p className="text-xs text-zinc-500">Interactive genomic visualization for {files.length} files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500 uppercase">Genome:</label>
          <select 
            value={genome} 
            onChange={(e) => setGenome(e.target.value)}
            className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="hg38">GRCh38 / hg38</option>
            <option value="hg19">GRCh37 / hg19</option>
            <option value="mm10">Mouse (mm10)</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xl min-h-[600px]">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      
      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <strong>Pro Tip:</strong> You can drag and drop additional local files directly onto the IGV tracks above. 
          Use the search bar in the viewer to navigate to specific genes (e.g., <em>TP53</em>, <em>EGFR</em>) or coordinates.
        </p>
      </div>
    </div>
  );
};
