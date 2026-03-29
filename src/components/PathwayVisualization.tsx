import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Pathway } from '../types/genomics';
import { motion } from 'framer-motion';
import { Info, Network } from 'lucide-react';

interface PathwayVisualizationProps {
  pathway: Pathway;
}

export const PathwayVisualization: React.FC<PathwayVisualizationProps> = ({ pathway }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Deep copy nodes and links to avoid mutating the original data
    const nodes = pathway.nodes.map(d => ({ ...d }));
    const nodeIds = new Set(nodes.map(n => n.id));
    
    // Filter out links that reference non-existent nodes to prevent "node not found" errors
    const links = pathway.links
      .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append("circle")
      .attr("r", (d: any) => d.type === 'pathway' ? 12 : 8)
      .attr("fill", (d: any) => {
        if (d.isMutated) return "#ef4444"; // red-500
        if (d.type === 'pathway') return "#6366f1"; // indigo-500
        return "#94a3b8"; // slate-400
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text((d: any) => d.label)
      .style("font-size", "10px")
      .style("font-family", "sans-serif")
      .style("fill", "#334155")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [pathway]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Network className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 leading-none mb-1">{pathway.name}</h4>
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase font-bold tracking-wider">
              {pathway.source}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Disruption Score</span>
            <span className={`text-sm font-bold ${pathway.disruptionScore > 0.7 ? 'text-red-500' : pathway.disruptionScore > 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {(pathway.disruptionScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${pathway.disruptionScore > 0.7 ? 'bg-red-500' : pathway.disruptionScore > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${pathway.disruptionScore * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-zinc-50 rounded-xl border border-zinc-100">
        <svg 
          ref={svgRef} 
          viewBox="0 0 600 400" 
          className="w-full h-auto cursor-grab active:cursor-grabbing"
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-100 text-[10px] space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-zinc-600 font-bold uppercase tracking-wider">Mutated Gene</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-zinc-600 font-bold uppercase tracking-wider">Pathway/Process</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-zinc-600 font-bold uppercase tracking-wider">Normal Node</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-900 leading-relaxed italic">
            {pathway.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
