import { forwardRef, type SVGProps } from "react";
import { ArrowUpRight, ArrowRight, Check, ChevronDown, Copy, Download, Heart, Search, Settings, X, Plus, Minus, Sun, Moon, Menu, Mail, Bell, User, Grid2X2, Palette, Type, Shapes, Layers, Circle, Sparkles, Bike, Wrench, MapPin, TriangleAlert, Phone, MessageCircle, Share2, Navigation, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
export const iconSet = { ArrowUpRight, ArrowRight, Check, ChevronDown, Copy, Download, Heart, Search, Settings, X, Plus, Minus, Sun, Moon, Menu, Mail, Bell, User, Grid2X2, Palette, Type, Shapes, Layers, Circle, Sparkles, Bike, Wrench, MapPin, TriangleAlert, Phone, MessageCircle, Share2, Navigation, ShieldCheck };
export type IconName = keyof typeof iconSet;
export interface IconProps extends SVGProps<SVGSVGElement> { name: IconName; size?: "sm" | "md" | "lg" }
export const Icon = forwardRef<SVGSVGElement,IconProps>(({name,size="md",className,...props},ref)=>{const Component=iconSet[name];return <Component ref={ref} aria-hidden="true" strokeWidth={1.75} className={cn("shrink-0",size==="sm"?"size-5":size==="lg"?"size-8":"size-6",className)} {...props}/>;});
