import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { statusStyles, type PlaceStatus } from "../../lib/cycling";
import { Icon } from "./icon";
export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {variant?: PlaceStatus}
/** A noninteractive status, with a stable semantic meaning and visible label. */
export const StatusChip = forwardRef<HTMLSpanElement,StatusChipProps>(({variant="safe",className,children,...props},ref)=>{const status=statusStyles[variant];return <span ref={ref} className={cn("status-chip h-7 font-sans text-chip leading-chip font-medium inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-0 whitespace-nowrap text-foreground",status.surface,className)} {...props}>{variant==="alert"?<Icon name="TriangleAlert" className="size-3.5 text-foreground"/>:<span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-pill",status.dot)}/>} {children??status.label}</span>});
