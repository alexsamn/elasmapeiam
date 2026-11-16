import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { createMapMarkerIcon, createMapClusterIcon } from "@/design-system/elasmapeiam-library-4342f4";
import { markerKindFor, type MockPlace } from "@/data/mock-places";

export interface PlacesMapProps { places:MockPlace[]; selectedId:string|null; onSelect:(id:string)=>void; center:{position:[number,number];key:number}; onReady?:()=>void; bottomPadding:number; /** Altura ocupada pela busca e filtros no topo. */ topPadding?:number }

/** Browser-only Leaflet map; load with React.lazy behind ClientOnly. */
export default function PlacesMap({places,selectedId,onSelect,center,onReady,bottomPadding,topPadding=0}:PlacesMapProps){
  const el=useRef<HTMLDivElement>(null);
  const map=useRef<L.Map|null>(null);
  const cluster=useRef<L.MarkerClusterGroup|null>(null);
  const padRef=useRef(bottomPadding); padRef.current=bottomPadding;
  const topRef=useRef(topPadding); topRef.current=topPadding;
  const first=useRef(true);
  const selectRef=useRef(onSelect); selectRef.current=onSelect;
  useEffect(()=>{
    if(!el.current) return;
    const m=L.map(el.current,{zoomControl:false,attributionControl:true}).setView(center.position,15);
    L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${import.meta.env['VITE_CARTO_API_KEY']}`,{maxZoom:19,attribution:"© OpenStreetMap contributors, © CARTO"}).addTo(m);
    const icons=new Map<number,L.DivIcon>();
    const group=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,
      iconCreateFunction:c=>icons.get(c.getChildCount())??L.divIcon({className:"cycling-leaflet-icon",html:"",iconSize:[40,40]})});
    // Pre-build cluster icons for possible counts.
    Promise.all(Array.from({length:15},(_,i)=>createMapClusterIcon(i+1).then(ic=>icons.set(i+1,ic)))).then(()=>group.refreshClusters());
    m.addLayer(group); map.current=m; cluster.current=group; onReady?.();
    return ()=>{m.remove();map.current=null;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    const group=cluster.current; if(!group) return; let cancelled=false;
    Promise.all(places.map(async p=>{
      const icon=await createMapMarkerIcon({variant:markerKindFor[p.kind],selected:p.id===selectedId});
      const mk=L.marker(p.position,{icon,title:p.title,alt:p.title,zIndexOffset:p.id===selectedId?1000:0,keyboard:true});
      mk.on("click",()=>selectRef.current(p.id)); return [p,mk] as const;
    })).then(pairs=>{ if(cancelled) return; group.clearLayers(); group.addLayers(pairs.map(x=>x[1]));
      const sel=pairs.find(x=>x[0].id===selectedId);
      // Uncluster the selected pin so its selected state is visible, then center it above the sheet.
      if(sel) group.zoomToShowLayer(sel[1],()=>centerAbove(sel[0].position));
    });
    return ()=>{cancelled=true;};
  },[places,selectedId]);
  // Center a point in the visible area between the top controls and the sheet.
  function centerAbove(pos:[number,number],zoom?:number){ const m=map.current; if(!m) return; const z=zoom??m.getZoom();
    const pt=m.project(pos,z).add([0,(padRef.current-topRef.current)/2]); m.setView(m.unproject(pt,z),z); }
  useEffect(()=>{ if(center.key>0) centerAbove(center.position,16); },[center]); // eslint-disable-line react-hooks/exhaustive-deps
  // Fit filtered places above the sheet; initial view stays on the fixed center.
  useEffect(()=>{ const m=map.current; if(!m) return; if(first.current){first.current=false;return;} if(!places.length) return;
    m.fitBounds(L.latLngBounds(places.map(p=>p.position)),{paddingTopLeft:[24,topRef.current+24],paddingBottomRight:[24,padRef.current+24],maxZoom:16}); },[places]);
  return <div ref={el} className="absolute inset-0 z-0" aria-label="Mapa de lugares" />;
}
