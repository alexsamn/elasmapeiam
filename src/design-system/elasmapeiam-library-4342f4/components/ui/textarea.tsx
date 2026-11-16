import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { variant?: "default" | "error" }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({className,variant="default",...props},ref)=><textarea ref={ref} aria-invalid={variant === "error" || undefined} className={cn("min-h-24 w-full rounded-input border bg-card p-3 font-sans text-body leading-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40",variant === "error" ? "border-destructive" : "border-input",className)} {...props}/>);
