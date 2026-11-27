import { forwardRef, type SVGProps } from "react";
import { Bike, Wrench, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { markerMetrics, shouldRenderTheftArea, theftAreaOpacity, type MarkerKind, type TheftReport } from "../../lib/map-markers";
export interface MarkerSvgProps extends SVGProps<SVGSVGElement> { variant?: MarkerKind; selected?: boolean }
/** Teardrop artwork shared by React previews and Leaflet divIcons. */
export const MarkerSvg = forwardRef<SVGSVGElement, MarkerSvgProps>(({variant="bike_parking",selected=false,className,...props},ref)=>{
  const Glyph=variant==="repair_shop"?Wrench:Bike;
  return <svg ref={ref} viewBox="0 0 36 44" width={markerMetrics.width} height={markerMetrics.height} className={cn("marker-svg",className)} data-kind={variant} data-selected={selected} aria-hidden="true" {...props}><path className="marker-shape" d="M18 42.5C14 38 1.5 25.5 1.5 18A16.5 16.5 0 0 1 34.5 18C34.5 25.5 22 38 18 42.5Z"/><Glyph x={8} y={8} width={20} height={20} strokeWidth={1.75} className="marker-glyph"/></svg>;
});
export interface ClusterSvgProps extends SVGProps<SVGSVGElement> { count: number }
/** Numeric group marker with a white boundary. */
export const ClusterSvg = forwardRef<SVGSVGElement, ClusterSvgProps>(({count,className,...props},ref)=><svg ref={ref} viewBox="0 0 40 40" width={40} height={40} className={cn("cluster-svg",className)} aria-hidden="true" {...props}><circle cx={20} cy={20} r={19}/><text x={20} y={20} textAnchor="middle" dominantBaseline="central">{Math.max(0,Math.floor(count))}</text></svg>);
export interface TheftAreaSvgProps extends SVGProps<SVGSVGElement> { reports: readonly TheftReport[] }
/** Aggregated area artwork; pending and rejected reports never qualify. */
export const TheftAreaSvg = forwardRef<SVGSVGElement, TheftAreaSvgProps>(({reports,className,...props},ref)=>shouldRenderTheftArea(reports)?<svg ref={ref} viewBox="0 0 66 58" width={66} height={58} className={cn("theft-area-svg",className)} role="img" aria-label="Área de alerta de roubos" {...props}><polygon points="17,1 49,1 65,29 49,57 17,57 1,29" fillOpacity={theftAreaOpacity(reports)}/><TriangleAlert x={21} y={17} width={24} height={24} strokeWidth={2}/></svg>:null);