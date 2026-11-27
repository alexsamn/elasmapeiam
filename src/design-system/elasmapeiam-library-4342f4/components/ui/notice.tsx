import {forwardRef,useState,type HTMLAttributes} from "react";
import {Info,Shield,TriangleAlert,X} from "lucide-react";
import {cn} from "../../lib/utils";
import {Button} from "./button";

export interface InfoBannerProps extends Omit<HTMLAttributes<HTMLDivElement>,"title"> {title:string;onDismiss?:()=>void}
/** Dismissible context, never a permanent privacy or report caveat. */
export const InfoBanner=forwardRef<HTMLDivElement,InfoBannerProps>(({title,children,onDismiss,className,...props},ref)=>{
 const [dismissed,setDismissed]=useState(false);
 if(dismissed)return null;
 return <div ref={ref} role="status" className={cn("flex items-start gap-3 rounded-feedback bg-lilas-bg p-4 font-sans text-preto",className)} {...props}>
  <Info className="mt-1 size-5 shrink-0" aria-hidden="true"/>
  <div className="min-w-0 flex-1"><h3 className="text-body leading-body font-semibold break-words">{title}</h3><div className="mt-1 text-subtitle leading-subtitle break-words">{children}</div></div>
  <Button variant="icon" aria-label="Fechar" title="Fechar" className="-my-3 -mr-3 h-error-circle w-error-circle bg-transparent hover:bg-lilas-soft text-preto" onClick={()=>{setDismissed(true);onDismiss?.();}}><X aria-hidden="true"/></Button>
 </div>;
});

export interface FixedNoticeProps extends HTMLAttributes<HTMLDivElement>{variant?:"alert"|"privacy"}
/** Non-dismissible report caveat or approximate-location privacy notice. */
export const FixedNotice=forwardRef<HTMLDivElement,FixedNoticeProps>(({variant="alert",children,className,...props},ref)=>{
 const Glyph=variant==="alert"?TriangleAlert:Shield;
 return <div ref={ref} className={cn("flex items-center gap-3 rounded-input border border-borda bg-branco p-4 font-sans text-notice leading-notice text-preto",className)} {...props}><Glyph aria-hidden="true" className={cn("size-feedback-icon shrink-0",variant==="alert"?"text-vermelho-forte":"text-preto")}/><div className="min-w-0 flex-1 break-words">{children}</div></div>;
});
