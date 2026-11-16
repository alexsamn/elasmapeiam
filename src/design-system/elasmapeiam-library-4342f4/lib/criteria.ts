/** Canonical criterion identities, labels and icons for place forms and cards. */
export const criteria = {
  parking: [
    {id:"covered",label:"Coberto",icon:"Umbrella"},
    {id:"surveillance",label:"Tem vigia ou câmera",icon:"Cctv"},
    {id:"fixed_rack",label:"Paraciclo fixo no chão",icon:"BikeRackIcon"},
    {id:"night_activity",label:"Movimentado à noite",icon:"Users"},
  ],
  shop: [
    {id:"price_explained",label:"Preço explicado antes",icon:"Receipt"},
    {id:"respectful_service",label:"Atendimento respeitoso",icon:"HeartHandshake"},
    {id:"deadline_met",label:"Prazo cumprido",icon:"Clock"},
    {id:"service_explained",label:"Explica o serviço",icon:"MessageCircle"},
  ],
} as const;
export type Criterion = (typeof criteria)[keyof typeof criteria][number];
export type CriterionId = Criterion["id"];
export function findCriterion(value:string):Criterion|undefined {
  return [...criteria.parking,...criteria.shop].find(criterion=>criterion.id===value||criterion.label===value);
}
/** Accept canonical IDs or existing canonical labels; omit unknown legacy criteria. */
export function resolveCriteria(values:readonly string[]):Criterion[] {
  const resolved:Criterion[]=[];
  for(const value of values){
    const criterion=findCriterion(value);
    if(criterion&&!resolved.some(item=>item.id===criterion.id)) resolved.push(criterion);
  }
  return resolved;
}