import {forwardRef,useId,type HTMLAttributes,type ReactNode} from "react";
import {cn} from "../../lib/utils";
import type {PlaceStatus} from "../../lib/cycling";
import {resolveCriteria} from "../../lib/criteria";
import {Card} from "./card";
import {Button} from "./button";
import {Icon} from "./icon";
import {StatusChip} from "./status-chip";
import {Skeleton} from "./feedback";

export interface PlaceCardProps extends HTMLAttributes<HTMLDivElement> {
  title:string;
  subtitle:string;
  status?:PlaceStatus;
  expanded?:boolean;
  onExpandedChange:(expanded:boolean)=>void;
  /** Confirmed criterion IDs or canonical labels from the shared criteria catalogue. */
  criteria?:readonly string[];
  address?:string;
  contributor?:string;
  confirmations?:number;
  onRoute?:()=>void;
  onShare?:()=>void;
  onDetails?:()=>void;
  loading?:boolean;
  actions?:ReactNode;
  children?:ReactNode;
}
/** Controlled place card; use one expanded ID in the parent and toggleExpanded. */
export const PlaceCard=forwardRef<HTMLDivElement,PlaceCardProps>(({title,subtitle,status="safe",expanded=false,onExpandedChange,criteria=[],address,contributor,confirmations=0,onRoute,onShare,onDetails,loading=false,actions,children,className,onClick,...props},ref)=>{
  const id=useId();
  const confirmedCriteria=resolveCriteria(criteria);
  const initials=contributor?.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toLocaleUpperCase("pt-BR");
  return <Card ref={ref} variant="default" className={cn(className,"h-auto min-h-0 max-h-none min-w-0 overflow-visible break-words bg-branco border-borda p-5 sm:p-5",expanded&&!loading&&"border-2 border-lilas")} aria-busy={loading||undefined} {...props} onClick={event=>{
    onClick?.(event);
    if(event.defaultPrevented||expanded||loading) return;
    if(event.target instanceof Element&&event.target.closest("button,a,input,select,textarea,[role='button']")) return;
    onExpandedChange(true);
  }}>
    {loading?<div role="status" aria-label="Carregando local" className="flex items-start gap-3">
      <div className="min-w-0 flex-1 space-y-2"><Skeleton variant="line" className="w-place-skeleton-title max-w-full h-place-skeleton-title"/><Skeleton variant="line" className="w-place-skeleton-subtitle max-w-full h-place-skeleton-subtitle"/></div>
      <Skeleton className="w-place-skeleton-chip h-7 shrink-0 rounded-pill"/>
    </div>:<>
      <div className="flex items-start gap-3">
        <Button variant="secondary" aria-expanded={expanded} aria-controls={id} onClick={()=>onExpandedChange(!expanded)} className="h-auto! min-h-11 min-w-0 flex-1 shrink items-start justify-start whitespace-normal rounded-input border-0 bg-transparent p-0 text-left text-foreground hover:bg-transparent">
          <span className="block min-w-0"><span className="block break-words font-sans text-title leading-body font-semibold">{title}</span><span className="mt-1 block font-sans text-subtitle leading-subtitle font-regular text-muted-foreground">{subtitle}</span></span>
        </Button>
        <StatusChip variant={status} className="shrink-0"/>
      </div>
      <div id={id} hidden={!expanded} className={cn("mt-5 flex-col gap-5",expanded?"flex":"hidden")}>
        {confirmedCriteria.length>0&&<section><h3 className="mb-3 font-sans text-body leading-body font-semibold">Critérios confirmados</h3><ul className="flex flex-wrap gap-2">{confirmedCriteria.map(c=><li key={c.id} className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-pill bg-fundo px-3 font-sans text-subtitle leading-subtitle font-regular"><Icon name="Check" className="size-4 shrink-0"/><span className="min-w-0 break-words">{c.label}</span></li>)}</ul></section>}
        {address&&<section><h3 className="mb-2 font-sans text-body leading-body font-semibold">Endereço</h3><p className="font-sans text-body leading-body font-regular">{address}</p></section>}
        <div className="flex flex-wrap items-center gap-3">
          {contributor&&<>
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-lilas font-sans text-body leading-body font-semibold text-foreground">{initials}</span>
            <div className="min-w-[6.5rem] flex-1"><p className="break-words font-sans text-body leading-body font-semibold">{contributor} indicou</p><p className="font-sans text-subtitle leading-subtitle font-regular text-muted-foreground">{confirmations} {confirmations===1?"confirmação":"confirmações"}</p></div>
          </>}
          <div className="ml-auto flex shrink-0 flex-nowrap gap-2"><Button variant="icon" aria-label="Rota" title="Rota" onClick={onRoute} disabled={!onRoute}><Icon name="Navigation"/></Button><Button variant="icon" iconTone="lilac" aria-label="Compartilhar" title="Compartilhar" onClick={onShare} disabled={!onShare}><Icon name="Share2"/></Button></div>
        </div>
        {children}
        {actions??<Button variant="primary" className="w-full border-0" onClick={onDetails} disabled={!onDetails}>Ver detalhes</Button>}
      </div>
    </>}
  </Card>;
});