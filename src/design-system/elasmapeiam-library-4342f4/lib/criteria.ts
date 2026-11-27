/**
 * Canonical criterion identities, labels and icons for place forms and cards.
 * Bicicletário: as chaves são as mesmas do JSON que a IA extrai do relato
 * (prompt v1). Oficina: lista fechada, só indicações positivas.
 */
export const criteria = {
  parking: [
    {id:"vigiado",label:"Tem vigia",icon:"ShieldCheck"},
    {id:"camera",label:"Tem câmera",icon:"Cctv"},
    {id:"controle_de_acesso",label:"Cadastro na entrada",icon:"User"},
    {id:"coberto",label:"Coberto",icon:"Umbrella"},
    {id:"movimentado",label:"Movimentado",icon:"Users"},
    {id:"prende_o_quadro",label:"Prende o quadro",icon:"BikeRackIcon"},
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

/** Negative labels shown as "Pontos de atenção" when a criterion is confirmed as "nao". */
const negativeLabels:Record<string,string>={
  vigiado:"Sem vigia",
  camera:"Sem câmera",
  controle_de_acesso:"Sem cadastro na entrada",
  coberto:"Descoberto",
  movimentado:"Pouco movimento",
  prende_o_quadro:"Não prende o quadro",
};

/**
 * Turns the stored criteria object (same shape as the AI output) into card labels.
 * Only values someone confirmed appear; "nao_informado" is never shown.
 */
export function describeCriteria(stored:Record<string,unknown>|null|undefined):{confirmed:string[];attention:string[]} {
  const c=stored??{};
  const confirmed:string[]=[];
  const attention:string[]=[];
  for(const item of [...criteria.parking,...criteria.shop]){
    if(c[item.id]==="sim") confirmed.push(item.label);
    else if(c[item.id]==="nao"&&negativeLabels[item.id]) attention.push(negativeLabels[item.id]);
  }
  if(c["custo"]==="gratuito") confirmed.push("Gratuito");
  if(c["custo"]==="pago") confirmed.push(typeof c["valor"]==="string"&&c["valor"]?`Pago: ${c["valor"]}`:"Pago");
  if(Array.isArray(c["o_que_levar"])&&c["o_que_levar"].length) confirmed.push(`Leve: ${c["o_que_levar"].join(", ")}`);
  if(typeof c["dica_de_acesso"]==="string"&&c["dica_de_acesso"]) confirmed.push(`Acesso: ${c["dica_de_acesso"]}`);
  if(c["costuma_lotar"]==="sim") attention.push(typeof c["horarios_de_lotacao"]==="string"&&c["horarios_de_lotacao"]?`Costuma lotar: ${c["horarios_de_lotacao"]}`:"Costuma lotar");
  return {confirmed,attention};
}
