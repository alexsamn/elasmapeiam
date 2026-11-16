import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>,"type" | "size"> { size?: "sm" | "md" }
export const Checkbox = forwardRef<HTMLInputElement,CheckboxProps>(({className,size="md",...props},ref)=><input ref={ref} type="checkbox" className={cn("shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-40",size === "md" ? "size-5" : "size-4",className)} {...props}/>);
