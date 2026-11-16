import {forwardRef,type HTMLAttributes} from "react";
import {LocateFixed} from "lucide-react";
import {cn} from "../../lib/utils";
import {Button} from "./button";

export interface MapControlsProps extends HTMLAttributes<HTMLDivElement>{
  onLocate?:()=>void;
  onAdd?:()=>void;
  locating?:boolean;
}
/** Location and add actions; positioning and location services belong to the consumer. */
export const MapControls=forwardRef<HTMLDivElement,MapControlsProps>(({className,onLocate,onAdd,locating=false,...props},ref)=><div ref={ref} role="group" aria-label="Ações do mapa" className={cn("inline-flex flex-col items-center gap-3",className)} {...props}>
  <Button variant="icon" aria-label="Minha localização" title="Minha localização" onClick={onLocate} disabled={!onLocate} loading={locating} className="bg-branco shadow-location [&_svg]:size-[calc(var(--spacing-6)-var(--spacing-1)/2)]"><LocateFixed size={22} strokeWidth={2} aria-hidden="true"/></Button>
  <Button variant="fab" aria-label="Adicionar lugar" title="Adicionar lugar" onClick={onAdd} disabled={!onAdd}/>
</div>);