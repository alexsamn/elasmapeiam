import { renderToStaticMarkup } from "react-dom/server";
import type { DivIcon, LayerGroup } from "leaflet";
import { MarkerSvg, ClusterSvg } from "../components/ui/marker-svg";
import { TriangleAlert } from "lucide-react";
import { markerMetrics, shouldRenderTheftArea, theftAreaOpacity, theftHexagon, type MarkerKind, type TheftReport } from "./map-markers";
export interface MapMarkerOptions { variant?: MarkerKind; selected?: boolean }
/** Invoke after hydration; Leaflet is never imported during SSR. */
export async function createMapMarkerIcon(options: MapMarkerOptions = {}): Promise<DivIcon> {
  const L = await import("leaflet");
  return L.divIcon({className:"cycling-leaflet-icon",html:renderToStaticMarkup(<MarkerSvg {...options}/>),iconSize:[markerMetrics.width,markerMetrics.height],iconAnchor:[18,44],popupAnchor:[0,-44]});
}
export async function createMapClusterIcon(count: number): Promise<DivIcon> {
  const L = await import("leaflet");
  return L.divIcon({className:"cycling-leaflet-icon",html:renderToStaticMarkup(<ClusterSvg count={count}/>),iconSize:[40,40],iconAnchor:[20,20]});
}
export interface TheftAreaOptions { center: [number,number]; reports: readonly TheftReport[] }
/** Returns null below the approved-report threshold; never creates a theft pin. */
export async function createTheftAlertArea({center,reports}: TheftAreaOptions): Promise<LayerGroup | null> {
  if (!shouldRenderTheftArea(reports)) return null;
  const L = await import("leaflet");
  const polygon = L.polygon(theftHexagon(center),{color:"var(--vermelho-forte)",weight:1,fillColor:"var(--vermelho)",fillOpacity:theftAreaOpacity(reports)});
  const icon=L.divIcon({className:"cycling-leaflet-icon theft-area-center",html:renderToStaticMarkup(<TriangleAlert width={24} height={24} strokeWidth={2}/>),iconSize:[24,24],iconAnchor:[12,12]});
  return L.layerGroup([polygon,L.marker(center,{icon,interactive:false,keyboard:false})]);
}