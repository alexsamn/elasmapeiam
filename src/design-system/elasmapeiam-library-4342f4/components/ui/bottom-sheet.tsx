import {forwardRef,type HTMLAttributes} from "react";
import {cn} from "../../lib/utils";
import {Button} from "./button";
export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement>{
  snap?:"peek"|"half"|"full";
  placement?:"floating"|"static";
  onSnapChange?:(snap:"peek"|"half"|"full")=>void;
  label?:string;
  sortLabel?:string;
}
/** Place list sheet; static placement measures snap heights against its positioned parent. */
export const BottomSheet=forwardRef<HTMLDivElement,BottomSheetProps>(({snap="peek",placement="floating",onSnapChange,label="12 lugares por aqui",sortLabel="Mais perto primeiro",children,className,...props},ref)=>{
  const snaps=["peek","half","full"] as const;
  return <section ref={ref} aria-label={label} data-snap={snap} data-placement={placement} className={cn("sheet bg-fundo text-foreground px-4 pb-6 pt-[calc(var(--spacing-5)/2)]",className)} {...props}>
    <div className="mb-4 flex justify-center">{onSnapChange?<Button variant="secondary" aria-label="Alterar altura do painel" title="Alterar altura do painel" onClick={()=>onSnapChange(snaps[(snaps.indexOf(snap)+1)%snaps.length])} onKeyDown={event=>{if(event.key==="ArrowUp"||event.key==="ArrowDown"){event.preventDefault();onSnapChange(snaps[Math.max(0,Math.min(2,snaps.indexOf(snap)+(event.key==="ArrowUp"?1:-1)))]);}}} className="h-11 w-12 rounded-input border-0 bg-transparent px-0 hover:bg-transparent"><span className="sheet-handle rounded-pill bg-handle"/></Button>:<span aria-hidden="true" className="sheet-handle rounded-pill bg-handle"/>}</div>
    <header className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="font-sans text-title leading-body font-semibold">{label}</h2><span className="font-sans text-subtitle leading-subtitle text-muted-foreground">{sortLabel}</span></header>
    <div className="flex flex-col gap-3 [&>*]:shrink-0">{children}</div>
  </section>;
});
