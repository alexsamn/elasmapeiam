import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { createMapMarkerIcon, createMapClusterIcon } from "@/design-system/elasmapeiam-library-4342f4";
import { markerKindFor, type MockPlace } from "@/data/mock-places";
import type { Area } from "@/lib/area";

export interface PlacesMapProps { places:MockPlace[]; selectedId:string|null; onSelect:(id:string)=>void; /** Toque numa área vazia do mapa. */ onMapClick?:()=>void; center:{position:[number,number];key:number}; /** Endereço buscado pela pessoa (ponto preto). */ searchPoint?:[number,number]|null; onReady?:()=>void; bottomPadding:number; /** Altura ocupada pela busca e filtros no topo. */ topPadding?:number; /** Área visível (descontando busca e painel), avisada quando o mapa para de se mexer. */ onAreaChange?:(area:Area)=>void; /** Mudar este número enquadra todos os lugares ("Ver todos"). */ fitAllKey?:number }

/** Browser-only Leaflet map; load with React.lazy behind ClientOnly. */
export default function PlacesMap({places,selectedId,onSelect,onMapClick,center,searchPoint=null,onReady,bottomPadding,topPadding=0,onAreaChange,fitAllKey=0}:PlacesMapProps){
  const el=useRef<HTMLDivElement>(null);
  const map=useRef<L.Map|null>(null);
  const cluster=useRef<L.MarkerClusterGroup|null>(null);
  const padRef=useRef(bottomPadding); padRef.current=bottomPadding;
  const topRef=useRef(topPadding); topRef.current=topPadding;
  const first=useRef(true);
  const fitKey=useRef(center.key);
  const pointLayer=useRef<L.CircleMarker|null>(null);
  const selectRef=useRef(onSelect); selectRef.current=onSelect;
  const mapClickRef=useRef(onMapClick); mapClickRef.current=onMapClick;
  const areaRef=useRef(onAreaChange); areaRef.current=onAreaChange;
  const areaTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const placesRef=useRef(places); placesRef.current=places;
  // Avisa a área visível depois de uma pequena pausa, para a lista não piscar durante o arrasto.
  // Com o painel cobrindo quase todo o mapa (tela cheia), mantém a última área.
  function scheduleArea(){ clearTimeout(areaTimer.current); areaTimer.current=setTimeout(()=>{ const m=map.current; if(!m||!areaRef.current) return;
    const size=m.getSize(); const top=Math.min(topRef.current,size.y), bottom=padRef.current; if(bottom>size.y*0.75||size.y-bottom-top<40) return;
    const nw=m.containerPointToLatLng([0,top]), se=m.containerPointToLatLng([size.x,size.y-bottom]);
    areaRef.current({north:nw.lat,south:se.lat,west:nw.lng,east:se.lng}); },250); }
  const selectedPos=useRef<[number,number]|null>(null); selectedPos.current=places.find(p=>p.id===selectedId)?.position??null;
  useEffect(()=>{
    if(!el.current) return;
    const m=L.map(el.current,{zoomControl:false,attributionControl:true}).setView(center.position,15);
    // CARTO exige chave desde 2026; sem a variável, o mapa cai no OpenStreetMap em vez de mostrar "API key required".
    const cartoKey=(import.meta.env['VITE_CARTO_API_KEY'] as string|undefined)?.trim();
    const osmAttr='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    if(cartoKey) L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`,{maxZoom:19,attribution:`${osmAttr}, © <a href="https://carto.com/attributions">CARTO</a>`}).addTo(m);
    else L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:osmAttr}).addTo(m);
    const icons=new Map<number,L.DivIcon>();
    const group=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,
      iconCreateFunction:c=>icons.get(c.getChildCount())??L.divIcon({className:"cycling-leaflet-icon",html:"",iconSize:[40,40]})});
    // Pre-build cluster icons for possible counts.
    Promise.all(Array.from({length:15},(_,i)=>createMapClusterIcon(i+1).then(ic=>icons.set(i+1,ic)))).then(()=>group.refreshClusters());
    m.on("click",()=>mapClickRef.current?.());
    m.on("moveend",scheduleArea); scheduleArea();
    m.addLayer(group); map.current=m; cluster.current=group; onReady?.();
    return ()=>{clearTimeout(areaTimer.current);m.remove();map.current=null;};
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
  // Quando o painel sobe, traz o pin selecionado para cima dele se ele ficou escondido.
  useEffect(()=>{ const m=map.current, pos=selectedPos.current; if(!m||!pos) return; const t=setTimeout(()=>{
    const y=m.latLngToContainerPoint(pos).y, h=m.getSize().y; if(bottomPadding>h*0.75) return; if(y>h-bottomPadding-24||y<topRef.current) centerAbove(pos); },120); return ()=>clearTimeout(t); },[bottomPadding]);
  useEffect(()=>{ if(center.key>0) centerAbove(center.position,16); },[center]); // eslint-disable-line react-hooks/exhaustive-deps
  // O painel subiu ou desceu: a área visível mudou mesmo sem mexer no mapa.
  useEffect(()=>{ scheduleArea(); },[bottomPadding,topPadding]);
  // "Ver todos": enquadra todos os lugares acima do painel.
  useEffect(()=>{ const m=map.current; if(!m||!fitAllKey||!placesRef.current.length) return;
    m.fitBounds(L.latLngBounds(placesRef.current.map(p=>p.position)),{paddingTopLeft:[24,topRef.current+24],paddingBottomRight:[24,padRef.current+24],maxZoom:16}); },[fitAllKey]);
  // Fit filtered places above the sheet; initial view stays on the fixed center.
  // Se o centro acabou de mudar (endereço buscado ou "minha localização"), não refaz o enquadramento.
  useEffect(()=>{ const m=map.current; if(!m) return; if(first.current){first.current=false;return;}
    if(fitKey.current!==center.key){fitKey.current=center.key;return;} if(!places.length) return;
    m.fitBounds(L.latLngBounds(places.map(p=>p.position)),{paddingTopLeft:[24,topRef.current+24],paddingBottomRight:[24,padRef.current+24],maxZoom:16}); },[places,center.key]);
  // Ponto do endereço buscado.
  useEffect(()=>{ const m=map.current; if(!m) return; pointLayer.current?.remove(); pointLayer.current=null;
    if(searchPoint) pointLayer.current=L.circleMarker(searchPoint,{radius:8,color:"#ffffff",weight:3,fillColor:"#111111",fillOpacity:1,interactive:false}).addTo(m);
  },[searchPoint?.[0],searchPoint?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={el} className="absolute inset-0 z-0" aria-label="Mapa de lugares" />;
}
