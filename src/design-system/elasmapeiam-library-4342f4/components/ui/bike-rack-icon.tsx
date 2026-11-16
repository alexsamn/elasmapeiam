import {forwardRef, type SVGProps} from "react";
import {cn} from "../../lib/utils";

export interface BikeRackIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}
/** Fixed ground-mounted bike rack artwork, with the Lucide sizing API. */
export const BikeRackIcon = forwardRef<SVGSVGElement, BikeRackIconProps>(
  ({size = 24, strokeWidth = 2, className, children, ...props}, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", className)} {...props}>
      <path d="M7.5 21V7.5a4.5 4.5 0 0 1 9 0V21"/>
      <path d="M6 21h3"/>
      <path d="M15 21h3"/>
      {children}
    </svg>
  ),
);