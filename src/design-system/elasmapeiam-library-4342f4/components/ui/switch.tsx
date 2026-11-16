import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>,"type" | "size"> { size?: "sm" | "md" }
export const Switch = forwardRef<HTMLInputElement,SwitchProps>(({className,size="md",...props},ref)=><input ref={ref} type="checkbox" role="switch" className={cn("system-switch shrink-0 cursor-pointer appearance-none rounded-pill border border-border bg-muted transition-colors checked:bg-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-40",size === "md" ? "h-6 w-11" : "h-5 w-9",className)} {...props}/>);
