import {forwardRef,type InputHTMLAttributes} from "react";
import {Search} from "lucide-react";
import {cn} from "../../lib/utils";
import {Input} from "./input";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>,"size"> {}
/** Pill search field for place discovery; the parent owns search results. */
export const SearchBar=forwardRef<HTMLInputElement,SearchBarProps>(({className,placeholder="Buscar rua, bairro ou lugar","aria-label":label="Buscar rua, bairro ou lugar",...props},ref)=><div className={cn("relative flex h-control items-center gap-[calc(var(--spacing-5)/2)] rounded-pill bg-branco px-4 shadow-search focus-within:ring-1 focus-within:ring-borda",className)}>
  <Search size={20} strokeWidth={2} aria-hidden="true" className="pointer-events-none size-5 shrink-0 text-muted-foreground"/>
  <Input ref={ref} type="search" placeholder={placeholder} aria-label={label} className="h-full rounded-pill border-0 bg-transparent px-0 focus:border-0 focus-visible:outline-none" {...props}/>
</div>);