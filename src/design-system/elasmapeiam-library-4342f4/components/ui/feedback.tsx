import {forwardRef,useEffect,useRef,type HTMLAttributes,type ReactNode} from "react";
import {Check,Plus,WifiOff} from "lucide-react";
import {cn} from "../../lib/utils";
import {toastDuration} from "../../lib/cycling";
import {Button} from "./button";
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement>{variant?:"card"|"line"}
export const Skeleton=forwardRef<HTMLDivElement,SkeletonProps>(({variant="card",className,...props},ref)=><div ref={ref} aria-hidden="true" className={cn("animate-pulse bg-skeleton",variant==="card"?"h-40 rounded-card":"h-4 rounded-input",className)} {...props}/>);
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement>{title:string;children?:ReactNode;action?:ReactNode;onAdd?:()=>void;loading?:boolean}
export const EmptyState=forwardRef<HTMLDivElement,EmptyStateProps>(({title,children,action,onAdd,loading=false,className,...props},ref)=><div ref={ref} className={cn("space-y-5 rounded-card border border-borda bg-branco p-6 text-left text-preto",className)} {...props}><div className="flex gap-2" aria-hidden="true">{["bg-verde","bg-azul","bg-amarelo","bg-rosa"].map(color=><span key={color} className={cn("size-feedback-dot rounded-pill",color)}/>)}</div><h2 className="font-display text-empty leading-empty font-regular uppercase break-words">{title}</h2><div className="font-sans text-body leading-body text-feedback-muted break-words">{children}</div>{action??<Button variant="primary" onClick={onAdd} disabled={!onAdd} loading={loading}><Plus className="size-6" aria-hidden="true"/>Adicionar</Button>}</div>);

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement>{title:string;onRetry?:()=>void;loading?:boolean;children?:ReactNode;action?:ReactNode}
export const ErrorState=forwardRef<HTMLDivElement,ErrorStateProps>(({title,children,onRetry,loading=false,action,className,...props},ref)=><div ref={ref} role="alert" className={cn("space-y-5 rounded-card border border-borda bg-branco p-6 text-preto",className)} {...props}><div className="flex size-error-circle items-center justify-center rounded-pill bg-fundo"><WifiOff className="size-6" aria-hidden="true"/></div><h2 className="font-sans text-body leading-body font-semibold break-words">{title}</h2><div className="font-sans text-body leading-body text-feedback-muted break-words">{children}</div>{action??<Button variant="secondary" onClick={onRetry} disabled={!onRetry} loading={loading}>Tentar de novo</Button>}</div>);

export interface ToastProps extends HTMLAttributes<HTMLDivElement>{open:boolean;onOpenChange:(open:boolean)=>void;onAction?:()=>void;actionLabel?:string;placement?:"floating"|"static"}
export const Toast=forwardRef<HTMLDivElement,ToastProps>(({open,onOpenChange,onAction,actionLabel="Ver",placement="floating",children,className,...props},ref)=>{
 const changeRef=useRef(onOpenChange);
 useEffect(()=>{changeRef.current=onOpenChange;},[onOpenChange]);
 useEffect(()=>{if(!open)return;const timer=setTimeout(()=>changeRef.current(false),toastDuration);return ()=>clearTimeout(timer);},[open]);
 if(!open)return null;
 return <div ref={ref} role="status" className={cn("flex items-center gap-3 rounded-feedback bg-preto px-4 py-feedback-padding font-sans text-body leading-body font-medium text-branco",placement==="floating"&&"fixed inset-x-6 bottom-6 z-50 mx-auto max-w-md",className)} {...props}><span className="flex size-feedback-circle shrink-0 items-center justify-center rounded-pill bg-verde text-preto"><Check className="size-5" aria-hidden="true"/></span><div className="min-w-0 flex-1 break-words">{children}</div>{onAction&&<Button variant="secondary" onClick={onAction} className="-my-2 h-error-circle border-0 bg-transparent px-2 text-rosa hover:bg-primary-hover focus-visible:outline-branco">{actionLabel}</Button>}</div>;
});
