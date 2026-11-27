import {forwardRef,type ButtonHTMLAttributes} from "react";
import {cn} from "../../lib/utils";
import type {PinKind} from "../../lib/cycling";
import {Button} from "./button";
import {MarkerSvg,ClusterSvg} from "./marker-svg";
export interface MapPinProps extends ButtonHTMLAttributes<HTMLButtonElement>{variant?:PinKind;selected?:boolean}
const kinds={safe:"bike_parking",shop:"repair_shop",unconfirmed:"unconfirmed"} as const;
/** Semantic place marker. Theft alerts are aggregated areas, never pins. */
export const MapPin=forwardRef<HTMLButtonElement,MapPinProps>(({variant="safe",selected=false,className,...props},ref)=><Button ref={ref} variant="secondary" aria-pressed={selected} className={cn("w-control border-transparent bg-transparent hover:bg-muted min-h-11 min-w-11 p-1",className)} {...props}><MarkerSvg variant={kinds[variant]} selected={selected}/></Button>);
export interface MapClusterProps extends ButtonHTMLAttributes<HTMLButtonElement>{count:number}
export const MapCluster=forwardRef<HTMLButtonElement,MapClusterProps>(({count,className,...props},ref)=><Button variant="secondary" ref={ref} aria-label={`Explorar ${count} lugares`} className={cn("w-control border-transparent bg-transparent hover:bg-muted min-h-11 min-w-11 px-0",className)} {...props}><ClusterSvg count={count}/></Button>);
