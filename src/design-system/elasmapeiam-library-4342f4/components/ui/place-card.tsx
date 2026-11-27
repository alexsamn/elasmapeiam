import {forwardRef,useId,type HTMLAttributes,type ReactNode} from "react";
import {cn} from "../../lib/utils";
import type {PlaceStatus} from "../../lib/cycling";
import {findCriterion} from "../../lib/criteria";
import {Card} from "./card";
import {Button} from "./button";
import {Icon} from "./icon";
import {StatusChip} from "./status-chip";
import {Skeleton} from "./feedback";

export interface PlaceCardProps extends HTMLAttributes<HTMLDivElement> {
  title:string;
  subtitle:string;
  status?:PlaceStatus;
  /** Overrides the chip label (ex.: "Quebrado" on the closed variant). */
  statusLabel?:string;
  expanded?:boolean;
  onExpandedChange:(expanded:boolean)=>void;
  /** Confirmed criteria: catalogue IDs, catalogue labels or ready-made labels. */
  criteria?:readonly string[];
  /** Confirmed negatives and warnings (ex.: "Não prende o quadro", "Costuma lotar"). */
  attention?:readonly string[];
  address?:string;
  confirmations?:number;
  /** Formatted date of the latest confirmation (ex.: "12/11"), shown under the title. */
  lastConfirmed?:string;
  onRoute?:()=>void;
  onShare?:()=>void;
  onDetails?:()=>void;
  loading?:boolean;
  actions?:ReactNode;
  children?:ReactNode;
}

function labelsFor(values:readonly string[]):string[]{
  const out:string[]=[];
  for(const value of values){ const label=findCriterion(value)?.label??value; if(label&&!out.includes(label)) out.push(label); }
  return out;
}

function confirmationText(confirmations:number){
  if(confirmations<=0) return "Ainda sem confirmações";
  return confirmations===1?"Confirmado por 1 ciclista":`Confirmado por ${confirmations} ciclistas`;
}

function lastConfirmedText(confirmations:number,lastConfirmed?:string){
  if(lastConfirmed) return `Última confirmação em ${lastConfirmed}`;
  return confirmations<=0?"Ainda sem confirmação":null;
}

export interface PlaceDetailsProps extends Omit<HTMLAttributes<HTMLDivElement>,"children"> {
  criteria?:readonly string[];
  attention?:readonly string[];
  address?:string;
  confirmations?:number;
  onRoute?:()=>void;
  onShare?:()=>void;
  onDetails?:()=>void;
  actions?:ReactNode;
  children?:ReactNode;
}

/** Body of a place: criteria, warnings, address, confirmations and actions. Used inside PlaceCard and in the map sheet. */
export function PlaceDetails({criteria=[],attention=[],address,confirmations=0,onRoute,onShare,onDetails,actions,children,className,...props}:PlaceDetailsProps){
  const confirmedLabels=labelsFor(criteria);
  const attentionLabels=labelsFor(attention);
  return <div className={cn("flex flex-col gap-5",className)} {...props}>
    {confirmedLabels.length>0&&<section><h3 className="mb-3 font-sans text-body leading-body font-semibold">Critérios confirmados</h3><ul className="flex flex-wrap gap-2">{confirmedLabels.map(label=><li key={label} className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-pill bg-fundo px-3 font-sans text-subtitle leading-subtitle font-regular"><Icon name="Check" className="size-4 shrink-0"/><span className="min-w-0 break-words">{label}</span></li>)}</ul></section>}
    {attentionLabels.length>0&&<section><h3 className="mb-3 font-sans text-body leading-body font-semibold">Pontos de atenção</h3><ul className="flex flex-wrap gap-2">{attentionLabels.map(label=><li key={label} className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-pill border border-borda bg-branco px-3 font-sans text-subtitle leading-subtitle font-regular"><Icon name="TriangleAlert" className="size-4 shrink-0"/><span className="min-w-0 break-words">{label}</span></li>)}</ul></section>}
    {address&&<section><h3 className="mb-2 font-sans text-body leading-body font-semibold">Endereço</h3><p className="font-sans text-body leading-body font-regular">{address}</p></section>}
    <div className="flex items-center gap-3">
      <p className="min-w-0 flex-1 break-words font-sans text-subtitle leading-subtitle font-regular text-muted-foreground">{confirmationText(confirmations)}</p>
      <div className="flex shrink-0 flex-nowrap gap-2"><Button variant="icon" aria-label="Rota" title="Rota" onClick={onRoute} disabled={!onRoute}><Icon name="Navigation"/></Button><Button variant="icon" iconTone="lilac" aria-label="Compartilhar" title="Compartilhar" onClick={onShare} disabled={!onShare}><Icon name="Share2"/></Button></div>
    </div>
    {children}
    {actions??<Button variant="primary" className="w-full border-0" onClick={onDetails} disabled={!onDetails}>Ver detalhes</Button>}
  </div>;
}

export interface PlaceSummaryProps { title:string; subtitle:string; status?:PlaceStatus; statusLabel?:string; confirmations?:number; lastConfirmed?:string; className?:string; actions?:ReactNode }

/** Title, status and last confirmation of a place, for headers outside the card. */
export function PlaceSummary({title,subtitle,status="safe",statusLabel,confirmations=0,lastConfirmed,className,actions}:PlaceSummaryProps){
  const lastLine=lastConfirmedText(confirmations,lastConfirmed);
  return <div className={cn("flex items-start gap-3",className)}>
    <div className="min-w-0 flex-1"><h2 className="break-words font-sans text-title leading-body font-semibold">{title}</h2><p className="mt-1 font-sans text-subtitle leading-subtitle font-regular text-muted-foreground">{subtitle}</p>{lastLine&&<p className="mt-1 font-sans text-subtitle leading-subtitle font-medium text-foreground">{lastLine}</p>}</div>
    <div className="flex shrink-0 items-center gap-2"><StatusChip variant={status}>{statusLabel}</StatusChip>{actions}</div>
  </div>;
}

/** Controlled place card; use one expanded ID in the parent and toggleExpanded. */
export const PlaceCard=forwardRef<HTMLDivElement,PlaceCardProps>(({title,subtitle,status="safe",statusLabel,expanded=false,onExpandedChange,criteria=[],attention=[],address,confirmations=0,lastConfirmed,onRoute,onShare,onDetails,loading=false,actions,children,className,onClick,...props},ref)=>{
  const id=useId();
  const lastLine=lastConfirmedText(confirmations,lastConfirmed);
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
          <span className="block min-w-0"><span className="block break-words font-sans text-title leading-body font-semibold">{title}</span><span className="mt-1 block font-sans text-subtitle leading-subtitle font-regular text-muted-foreground">{subtitle}</span>{lastLine&&<span className="mt-1 block font-sans text-subtitle leading-subtitle font-medium text-foreground">{lastLine}</span>}</span>
        </Button>
        <StatusChip variant={status} className="shrink-0">{statusLabel}</StatusChip>
      </div>
      <PlaceDetails id={id} hidden={!expanded} className={cn("mt-5",expanded?"flex":"hidden")} criteria={criteria} attention={attention} {...(address?{address}:{})} confirmations={confirmations} {...(onRoute?{onRoute}:{})} {...(onShare?{onShare}:{})} {...(onDetails?{onDetails}:{})} actions={actions}>{children}</PlaceDetails>
    </>}
  </Card>;
});
