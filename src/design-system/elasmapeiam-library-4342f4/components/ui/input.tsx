import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { variant?: "default" | "error"; scale?: "sm" | "md"; label?:ReactNode; helper?:ReactNode }
/** Single-line field with optional associated label and helper/error text. */
export const Input = forwardRef<HTMLInputElement, InputProps>(({className,variant="default",scale="md",label,helper,id,"aria-describedby":describedBy,...props},ref)=>{
  const generated=useId();
  const fieldId=id??generated;
  const helperId=`${fieldId}-helper`;
  const field=<input ref={ref} id={fieldId} aria-invalid={variant==="error"||undefined} aria-describedby={[describedBy,helper?helperId:undefined].filter(Boolean).join(" ")||undefined} className={cn("w-full min-w-0 rounded-input border bg-branco px-4 font-sans text-body leading-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-40",scale==="md"?"h-control":"h-11",variant==="error"?"border-2 border-error":"border-borda focus:border-2 focus:border-preto",className)} {...props}/>;
  if(!label&&!helper) return field;
  return <div className="min-w-0 space-y-2">{label&&<label htmlFor={fieldId} className="block font-sans text-subtitle leading-subtitle font-semibold">{label}</label>}{field}{helper&&<p id={helperId} className={cn("font-sans text-chip leading-chip",variant==="error"?"text-error":"text-muted-foreground")}>{helper}</p>}</div>;
});
