import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: "pink" | "green" | "blue" | "yellow" | "lilac" | "neutral" }
const variants = {pink:"bg-rosa-soft",green:"bg-safe-soft",blue:"bg-shop-soft",yellow:"bg-unconfirmed-soft",lilac:"bg-lilas-soft",neutral:"bg-secondary text-secondary-foreground"};
export const Badge = forwardRef<HTMLSpanElement,BadgeProps>(({className,variant="pink",...props},ref)=><span ref={ref} className={cn("inline-flex items-center gap-1 rounded-pill px-3 py-1 text-chip leading-chip font-medium text-preto",variants[variant],className)} {...props}/>);
