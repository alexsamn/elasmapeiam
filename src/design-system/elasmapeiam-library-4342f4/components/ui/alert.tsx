import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface AlertProps extends HTMLAttributes<HTMLDivElement> { variant?: "info" | "success" | "warning" | "error" }
const variants={info:"border-lilas bg-lilas-bg",success:"border-lilas bg-lilas-bg",warning:"border-lilas bg-lilas-bg",error:"border-destructive bg-rosa-soft"};
export const Alert = forwardRef<HTMLDivElement,AlertProps>(({className,variant="info",...props},ref)=><div ref={ref} role={variant === "error" ? "alert" : "status"} className={cn("rounded-input border p-4 text-subtitle leading-subtitle text-preto",variants[variant],className)} {...props}/>);
