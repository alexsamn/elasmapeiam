import {forwardRef,useId,useState,type InputHTMLAttributes,type ReactNode} from "react";
import {Check,Umbrella,Cctv,Users,Receipt,HeartHandshake,Clock,MessageCircle} from "lucide-react";
import {cn} from "../../lib/utils";
import {Icon,type IconName} from "./icon";
import {BikeRackIcon} from "./bike-rack-icon";
import {findCriterion,type CriterionId} from "../../lib/criteria";
const criteriaIcons={Umbrella,Cctv,BikeRackIcon,Users,Receipt,HeartHandshake,Clock,MessageCircle};
export interface CriteriaCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>,"type"|"size"> {children?:ReactNode;icon?:IconName|keyof typeof criteriaIcons;criterion?:CriterionId}
/** Native independent criterion selection with a visible trailing checkbox. */
export const CriteriaCheckbox=forwardRef<HTMLInputElement,CriteriaCheckboxProps>(({children,icon:customIcon,criterion,className,id,checked,defaultChecked=false,onChange,...props},ref)=>{
  const definition=findCriterion(criterion??(typeof children==="string"?children:""));
  const icon=definition?.icon??customIcon??"ShieldCheck";
  const generated=useId();
  const [localChecked,setLocalChecked]=useState(defaultChecked);
  const selected=checked??localChecked;
  const CriterionIcon=Object.prototype.hasOwnProperty.call(criteriaIcons,icon)?criteriaIcons[icon as keyof typeof criteriaIcons]:null;
  return <label htmlFor={id??generated} className={cn("relative flex h-14 w-full items-center gap-3 rounded-input border border-borda bg-branco px-4 py-0 text-foreground has-checked:border-[1.5px] has-checked:border-preto has-checked:bg-safe-tint has-disabled:opacity-40 [&:not(:has(:checked)):not(:has(:disabled)):hover]:border-muted-foreground",className)}>
    <input ref={ref} id={id??generated} type="checkbox" role="checkbox" aria-checked={selected} checked={checked} defaultChecked={checked===undefined?defaultChecked:undefined} onChange={event=>{setLocalChecked(event.target.checked);onChange?.(event);}} className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-input focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-preto focus-visible:outline-offset-2 disabled:cursor-not-allowed" {...props}/>
    {CriterionIcon?<CriterionIcon size={20} strokeWidth={2} aria-hidden="true" className="size-5 shrink-0 text-foreground"/>:<Icon name={icon as IconName} size="sm" strokeWidth={2} className="text-foreground"/>}
    <span className="min-w-0 flex-1 font-sans text-body leading-body font-medium text-foreground">{definition?.label??children}</span>
    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-checkbox border-[1.5px] border-checkbox-border bg-branco peer-checked:border-preto peer-checked:bg-preto peer-checked:[&_svg]:visible"><Check size={16} strokeWidth={3} className="invisible size-4 text-branco"/></span>
  </label>;
});