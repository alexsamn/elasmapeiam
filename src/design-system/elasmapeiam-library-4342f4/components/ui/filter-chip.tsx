import { forwardRef, useState, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Icon, type IconName } from "./icon";
export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  variant?: "default" | "alert";
  surface?: "default" | "map";
  icon?: IconName;
}
/** Multi-select map filter; selected is expressed with aria-pressed. */
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ selected, defaultSelected = false, onSelectedChange, variant = "default", surface = "default", icon = "Bike", children, className, onClick, ...props }, ref) => {
    const [internalSelected, setInternalSelected] = useState(defaultSelected);
    const active = selected ?? internalSelected;
    return <Button ref={ref} variant="secondary" aria-pressed={active}
      className={cn("border-transparent bg-transparent text-foreground hover:bg-muted disabled:bg-borda filter-chip h-10 min-h-10 shrink-0 gap-2 rounded-pill border px-4 py-0 font-sans text-subtitle leading-subtitle font-medium whitespace-nowrap", active ? "border-preto bg-preto text-branco hover:bg-preto" : "border-borda bg-branco text-foreground hover:bg-branco", surface === "map" && "shadow-map-chip", className)}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (selected === undefined) setInternalSelected(!active);
        onSelectedChange?.(!active);
      }} {...props}>
      <Icon name={variant === "alert" ? "TriangleAlert" : icon} className={cn("size-4.5", active ? "text-branco" : variant === "alert" ? "text-vermelho-forte" : "text-foreground")} />
      {children}
    </Button>;
  },
);

export interface FilterChipRowProps extends HTMLAttributes<HTMLDivElement> {}
/** A single horizontally scrollable row for independent map filters. */
export const FilterChipRow = forwardRef<HTMLDivElement, FilterChipRowProps>(
  ({ className, ...props }, ref) => <div ref={ref} role="group" className={cn("filter-chip-row flex min-w-0 max-w-full flex-nowrap gap-2 overflow-x-auto px-4 py-0", className)} {...props} />,
);
