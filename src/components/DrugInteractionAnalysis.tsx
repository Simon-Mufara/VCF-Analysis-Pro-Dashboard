import React, { useEffect, useRef } from 'react';
import { Pill, AlertTriangle, ShieldCheck, Info, Clock, Activity, ListChecks, Network } from 'lucide-react';
import { DrugInteraction, SuggestedRegimen } from '../types/genomics';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface DrugInteractionAnalysisProps {
  interactions?: DrugInteraction[];
  regimen?: SuggestedRegimen;
}

const DrugInteractionNetwork: React.FC<{ interactions: DrugInteraction[] }> = ({ interactions }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !interactions.length) return;

    const width = 600;
    const height = 400;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Prepare nodes and links
    const nodesMap = new Map<string, { id: string; group: string }>();
    const links: any[] = [];

    interactions.forEach(interaction => {
      interaction.drugs.forEach(drug => {
        if (!nodesMap.has(drug)) {
          nodesMap.set(drug, { id: drug, group: "drug" });
        }
      });

      // Create links between all drugs in the interaction
      for (let i = 0; i < interaction.drugs.length; i++) {
        for (let j = i + 1; j < interaction.drugs.length; j++) {
          links.push({
            source: interaction.drugs[i],
            target: interaction.drugs[j],
            severity: interaction.severity,
            type: interaction.interactionType
          });
        }
      }
    });

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => {
        switch (d.severity.toLowerCase()) {
          case 'severe': return '#ef4444';
          case 'high': return '#f97316';
          case 'moderate': return '#eab308';
          case 'low': return '#3b82f6';
          default: return '#94a3b8';
        }
      })
      .attr("stroke-width", (d: any) => {
        switch (d.severity.toLowerCase()) {
          case 'severe': return 4;
          case 'high': return 3;
          case 'moderate': return 2;
          case 'low': return 1.5;
          default: return 1;
        }
      });

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", "#6366f1")
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("title")
      .text(d => d.id);

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dy", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b")
      .attr("font-weight", "bold")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [interactions]);

  return (
    <div className="w-full h-[400px] bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Severe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Low</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export const DrugInteractionAnalysis: React.FC<DrugInteractionAnalysisProps> = ({ interactions, regimen }) => {
  if (!interactions?.length && !regimen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Interactions Section */}
      {interactions && interactions.length > 0 && (
        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-zinc-900">Drug-Drug Interactions (DDI)</h3>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-zinc-400">
              <Network className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Interaction Network Graph</span>
            </div>
            <DrugInteractionNetwork interactions={interactions} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interactions.map((interaction, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(interaction.severity)}`}>
                      {interaction.severity}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {interaction.interactionType} Interaction
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {interaction.drugs.map((drug, dIdx) => (
                    <span key={dIdx} className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                      <Pill className="w-3 h-3 text-indigo-500" />
                      {drug}
                    </span>
                  ))}
                </div>
                
                <p className="text-sm text-zinc-600 mb-3 leading-relaxed">
                  {interaction.description}
                </p>
                
                {interaction.mechanism && (
                  <div className="mb-3 p-3 bg-white rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Mechanism
                    </div>
                    <p className="text-xs text-zinc-500 italic">{interaction.mechanism}</p>
                  </div>
                )}
                
                {interaction.management && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Clinical Management
                    </div>
                    <p className="text-xs text-emerald-700">{interaction.management}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Regimen Section */}
      {regimen && (
        <div className="p-8 bg-zinc-900 text-white rounded-3xl shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ListChecks className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Suggested Therapeutic Regimen</h3>
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">{regimen.regimenName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regimen.components.map((comp, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Pill className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-lg">{comp.drug}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <div className="text-[8px] text-zinc-500 uppercase font-bold">Dosage</div>
                          <div className="text-xs font-medium">{comp.dosage || 'N/A'}</div>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <div className="text-[8px] text-zinc-500 uppercase font-bold">Freq</div>
                          <div className="text-xs font-medium">{comp.frequency || 'N/A'}</div>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                          <div className="text-[8px] text-zinc-500 uppercase font-bold">Timing</div>
                          <div className="text-xs font-medium">{comp.timing || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Rationale</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed italic">
                    "{regimen.rationale}"
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-emerald-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Expected Outcome</span>
                  </div>
                  <p className="text-sm text-emerald-100">
                    {regimen.expectedOutcome}
                  </p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-zinc-400">
                    <ListChecks className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Monitoring Requirements</span>
                  </div>
                  <ul className="space-y-2">
                    {regimen.monitoringRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
