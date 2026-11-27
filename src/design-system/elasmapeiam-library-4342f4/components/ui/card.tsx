import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface CardProps extends HTMLAttributes<HTMLDivElement> { variant?: "default" | "soft" | "selected" }
export const Card = forwardRef<HTMLDivElement,CardProps>(({className,variant="default",...props},ref)=><div ref={ref} className={cn("rounded-card border p-5 sm:p-6 font-sans text-body leading-body text-card-foreground",variant === "soft" ? "bg-muted border-border" : variant === "selected" ? "bg-card border-[1.5px] border-lilas" : "bg-card border-border",className)} {...props}/>);
