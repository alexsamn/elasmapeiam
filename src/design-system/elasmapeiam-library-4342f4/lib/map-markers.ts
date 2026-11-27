export type MarkerKind = "bike_parking" | "repair_shop" | "unconfirmed";
export interface TheftReport { status: "approved" | "pending" | "rejected" }
export const markerMetrics = { width: 36, height: 44, icon: 20, stroke: 1.5, selectedScale: 1.2, selectedStroke: 3, cluster: 40 } as const;
export const theftAreaRules = { minimumApproved: 3, diameterMeters: 300, minimumOpacity: 0.3, opacityPerReport: 0.05, maximumOpacity: 0.5 } as const;
/** Approved reports add five percentage points each, capped at fifty percent. */
export function theftAreaOpacity(reports: readonly TheftReport[]): number {
  const count = reports.filter(report => report.status === "approved").length;
  return Math.min(theftAreaRules.maximumOpacity, (30 + Math.max(0, count - theftAreaRules.minimumApproved) * 5) / 100);
}
export function shouldRenderTheftArea(reports: readonly TheftReport[]) {
  return reports.filter(report => report.status === "approved").length >= theftAreaRules.minimumApproved;
}
/** Geographic hexagon with a 300-meter vertex-to-vertex diameter. */
export function theftHexagon(center: readonly [number, number]): [number, number][] {
  const radius = theftAreaRules.diameterMeters / 2 / 6371000;
  const lat = center[0] * Math.PI / 180;
  const lng = center[1] * Math.PI / 180;
  return Array.from({ length: 6 }, (_, i) => {
    const bearing = (30 + i * 60) * Math.PI / 180;
    const nextLat = Math.asin(Math.sin(lat) * Math.cos(radius) + Math.cos(lat) * Math.sin(radius) * Math.cos(bearing));
    const nextLng = lng + Math.atan2(Math.sin(bearing) * Math.sin(radius) * Math.cos(lat), Math.cos(radius) - Math.sin(lat) * Math.sin(nextLat));
    return [nextLat * 180 / Math.PI, nextLng * 180 / Math.PI];
  });
}