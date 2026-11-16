import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";
const buttonVariants = cva("h-control rounded-pill px-6 py-0 inline-flex shrink-0 items-center justify-center gap-2 font-sans text-body leading-subtitle font-medium transition-colors focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-preto focus-visible:outline-offset-2 disabled:pointer-events-none disabled:text-muted-foreground", {
  variants: {
    variant: {
      primary: "bg-preto text-branco border border-preto hover:bg-primary-hover disabled:bg-borda disabled:border-borda",
      secondary: "border-[1.5px] border-preto bg-branco text-preto hover:bg-rosa disabled:border-borda disabled:bg-branco",
      icon: "w-control px-0 border border-transparent text-foreground hover:bg-rosa disabled:bg-borda [&_svg]:size-6",
      fab: "h-fab w-fab px-0 border border-transparent bg-rosa text-preto shadow-fab hover:bg-accent-hover disabled:bg-borda [&_svg]:size-6",
    },
    iconTone: { rose: "", lilac: "" },
  },
  compoundVariants: [
    { variant: "icon", iconTone: "rose", className: "bg-rosa-soft" },
    { variant: "icon", iconTone: "lilac", className: "bg-lilas-button" },
  ],
  defaultVariants: { variant: "primary", iconTone: "rose" },
});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { loading?: boolean }
/** Pill action; icon and fab are circular and require a Portuguese aria-label. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", iconTone, loading = false, disabled, children, type = "button", ...props }, ref) => {
  return <button ref={ref} type={type} className={cn(buttonVariants({variant,iconTone}),className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <span className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent" aria-hidden="true"/>}{children ?? (variant === "fab" ? <Icon name="Plus"/> : null)}</button>;
});
