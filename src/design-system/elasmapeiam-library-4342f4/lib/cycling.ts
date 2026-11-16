export const statusStyles = {
 safe: {label:"Confirmado",surface:"bg-safe-soft",dot:"bg-safe-dot",icon:"ShieldCheck"},
 shop: {label:"Oficina indicada",surface:"bg-shop-soft",dot:"bg-shop-dot",icon:"Wrench"},
 unconfirmed: {label:"Não confirmado",surface:"bg-unconfirmed-soft",dot:"bg-unconfirmed-dot",icon:"Bike"},
 pending: {label:"Pendente",surface:"bg-lilas-soft",dot:"bg-lilas-dot",icon:"Circle"},
 alert: {label:"Alerta de roubos",surface:"bg-alert",dot:"bg-alert",icon:"TriangleAlert"},
 closed: {label:"Fechado",surface:"bg-borda",dot:"bg-muted-foreground",icon:"Circle"},
} as const;
export type PlaceStatus = keyof typeof statusStyles;
export type PinKind = "safe" | "shop" | "unconfirmed";
export const toastDuration = 3000;
export function toggleExpanded(current: string | null, next: string) {return current === next ? null : next;}
