import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef,useState,type HTMLAttributes,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {cn} from "../../lib/utils";
import {Button} from "./button";

type Snap="peek"|"half"|"full";
const SNAPS=["peek","half","full"] as const;
/** Movement (px) before a press becomes a drag; below it, it stays a tap. */
const DRAG_SLOP=8;

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement>{
  snap?:Snap;
  placement?:"floating"|"static";
  onSnapChange?:(snap:Snap)=>void;
  label?:string;
  sortLabel?:string;
  /** Replaces the default list header (ex.: summary of the selected place). Stays visible at every height. */
  header?:ReactNode;
  /** When this value changes, the content scrolls back to the top. */
  scrollResetKey?:unknown;
}

/**
 * Draggable sheet with three heights, like a map app:
 * peek = only the header, half = 50% of the parent, full = whole parent.
 * Drag the header at any height, or the content while not at full; at full the content scrolls.
 */
export const BottomSheet=forwardRef<HTMLDivElement,BottomSheetProps>(({snap="peek",placement="floating",onSnapChange,label="12 lugares por aqui",sortLabel="Mais perto primeiro",header,scrollResetKey,children,className,style,...props},ref)=>{
  const sheet=useRef<HTMLDivElement>(null);
  const top=useRef<HTMLDivElement>(null);
  const body=useRef<HTMLDivElement>(null);
  useImperativeHandle(ref,()=>sheet.current as HTMLDivElement);
  const [peek,setPeek]=useState(120);
  const [dragH,setDragH]=useState<number|null>(null);
  const [H,setH]=useState(0);
  const drag=useRef<{id:number;y:number;h:number;t:number;v:number;lastY:number;active:boolean;fromTop:boolean}|null>(null);

  // Peek height = exactly the fixed top part (handle + header), so nothing shows half-cut.
  useLayoutEffect(()=>{ const el=top.current; if(!el) return; const m=()=>setPeek(Math.ceil(el.getBoundingClientRect().height)); m(); const ro=new ResizeObserver(m); ro.observe(el); return ()=>ro.disconnect(); },[]);
  // Parent height, measured in the browser (the server render falls back to the CSS heights).
  useLayoutEffect(()=>{ const el=sheet.current; if(!el) return; const target=(placement==="static"?el.offsetParent:null) as HTMLElement|null;
    const m=()=>setH(target?target.clientHeight:window.innerHeight-80); m();
    const ro=target?new ResizeObserver(m):null; ro?.observe(target as HTMLElement); window.addEventListener("resize",m);
    return ()=>{ro?.disconnect();window.removeEventListener("resize",m);}; },[placement]);
  useEffect(()=>{ body.current?.scrollTo?.({top:0}); },[scrollResetKey]);

  function heightOf(s:Snap){ return s==="peek"?peek:s==="half"?Math.round(H*0.5):H; }

  function onPointerDown(e:ReactPointerEvent<HTMLDivElement>){
    if(!onSnapChange||e.button>0) return;
    const fromTop=!!top.current?.contains(e.target as Node);
    // At full height the content scrolls natively; only the header drags.
    if(snap==="full"&&!fromTop) return;
    const h=sheet.current?.getBoundingClientRect().height??heightOf(snap);
    drag.current={id:e.pointerId,y:e.clientY,lastY:e.clientY,h,t:e.timeStamp,v:0,active:false,fromTop};
  }
  function onPointerMove(e:ReactPointerEvent<HTMLDivElement>){
    const d=drag.current; if(!d||d.id!==e.pointerId) return;
    const dy=e.clientY-d.y;
    if(!d.active){ if(Math.abs(dy)<DRAG_SLOP) return; d.active=true; sheet.current?.setPointerCapture?.(e.pointerId); }
    const dt=Math.max(1,e.timeStamp-d.t); d.v=(e.clientY-d.lastY)/dt; d.lastY=e.clientY; d.t=e.timeStamp;
    setDragH(Math.max(peek,Math.min(heightOf("full"),d.h-dy)));
  }
  function onPointerUp(e:ReactPointerEvent<HTMLDivElement>){
    const d=drag.current; drag.current=null; if(!d||d.id!==e.pointerId||!onSnapChange) return;
    if(!d.active){ setDragH(null); return; }
    // Project the release with the finger speed, then go to the closest height.
    const projected=(d.h-(e.clientY-d.y))-d.v*180;
    const next=SNAPS.reduce((best,s)=>Math.abs(heightOf(s)-projected)<Math.abs(heightOf(best)-projected)?s:best,snap as Snap);
    setDragH(null); onSnapChange(next);
    // A drag must not also count as a tap on whatever is under the finger.
    const stop=(ev:Event)=>{ev.stopPropagation();ev.preventDefault();};
    window.addEventListener("click",stop,{capture:true,once:true}); setTimeout(()=>window.removeEventListener("click",stop,{capture:true}),300);
  }
  function cycle(){ onSnapChange?.(snap==="peek"?"half":snap==="half"?"full":"half"); }

  const height=dragH??(H?heightOf(snap):undefined);
  return <section ref={sheet} aria-label={label} data-snap={snap} data-placement={placement} data-dragging={dragH!==null||undefined}
    className={cn("sheet bg-fundo text-foreground flex flex-col overflow-hidden",className)}
    style={{...style,height,touchAction:snap==="full"?"auto":"none"}}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={()=>{drag.current=null;setDragH(null);}} {...props}>
    <div ref={top} className="shrink-0 px-4 pb-4 pt-[calc(var(--spacing-5)/2)] touch-none select-none">
      <div className="mb-2 flex justify-center">{onSnapChange?<Button variant="secondary" aria-label="Alterar altura do painel" title="Alterar altura do painel" onClick={cycle} onKeyDown={event=>{if(event.key==="ArrowUp"||event.key==="ArrowDown"){event.preventDefault();onSnapChange(SNAPS[Math.max(0,Math.min(2,SNAPS.indexOf(snap)+(event.key==="ArrowUp"?1:-1)))]);}}} className="h-8 w-16 rounded-input border-0 bg-transparent px-0 hover:bg-transparent"><span className="sheet-handle rounded-pill bg-handle"/></Button>:<span aria-hidden="true" className="sheet-handle rounded-pill bg-handle"/>}</div>
      {header??<header className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-sans text-title leading-body font-semibold">{label}</h2><span className="font-sans text-subtitle leading-subtitle text-muted-foreground">{sortLabel}</span></header>}
    </div>
    <div ref={body} className={cn("sheet-body min-h-0 flex-1 px-4",snap==="full"&&dragH===null?"overflow-y-auto overscroll-contain":"overflow-hidden")}>
      <div className="flex flex-col gap-3 pb-[calc(24px+env(safe-area-inset-bottom))] [&>*]:shrink-0">{children}</div>
    </div>
  </section>;
});
