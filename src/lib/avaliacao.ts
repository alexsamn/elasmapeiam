/**
 * Avaliação estruturada (21/11/2026, feedback das testadoras):
 * "Dá pra parar a bike aqui?" é obrigatório; pílulas e comentário são opcionais.
 * Só o comentário passa pela IA.
 */
export type Resposta = "sim" | "ressalvas" | "nao";
export type MotivoNao = "fechado" | "quebrado" | "nao_existe_mais";
export type Situacao = "sim" | "ressalvas" | MotivoNao;

/** Pílulas: as chaves são as mesmas dos critérios que a IA extrai. */
export const PILULAS = [
  { id: "coberto", label: "Coberto" },
  { id: "vigiado", label: "Tem vigia" },
  { id: "camera", label: "Tem câmera" },
  { id: "controle_de_acesso", label: "Cadastro na entrada" },
  { id: "prende_o_quadro", label: "Prende o quadro" },
  { id: "movimentado", label: "Movimentado" },
  { id: "costuma_lotar", label: "Costuma lotar" },
  { id: "gratuito", label: "Gratuito" },
  { id: "pago", label: "Pago" },
] as const;
export type PilulaId = (typeof PILULAS)[number]["id"];

export const COMENTARIO_MIN = 10;
export const COMENTARIO_MAX = 1000;

export interface EstadoAvaliacao {
  lugarId: string | null;
  lugarTexto: string;
  resposta: Resposta | null;
  motivo: MotivoNao | null;
  pilulas: PilulaId[];
  comentario: string;
}

export interface Avaliacao {
  lugarId?: string;
  lugarTexto?: string;
  situacao: Situacao;
  marcadores: Record<string, string>;
  texto?: string;
}

/** Gratuito e Pago não podem ficar marcados juntos. */
export function alternarPilula(atual: PilulaId[], id: PilulaId): PilulaId[] {
  if (atual.includes(id)) return atual.filter(p => p !== id);
  const oposto = id === "gratuito" ? "pago" : id === "pago" ? "gratuito" : null;
  return [...atual.filter(p => p !== oposto), id];
}

/** Monta o envio ou devolve a primeira coisa que falta, em texto para a pessoa. */
export function montarAvaliacao(e: EstadoAvaliacao): { ok: true; avaliacao: Avaliacao } | { ok: false; erro: string } {
  const lugarTexto = e.lugarTexto.trim();
  if (!e.lugarId && lugarTexto.length < 3) return { ok: false, erro: "Diga o nome ou o endereço do lugar." };
  if (!e.resposta) return { ok: false, erro: "Responda se dá pra parar a bike aqui." };
  if (e.resposta === "nao" && !e.motivo) return { ok: false, erro: "Conte o que aconteceu: fechado, quebrado ou não existe mais." };
  const comentario = e.comentario.trim();
  if (comentario && comentario.length < COMENTARIO_MIN) return { ok: false, erro: `O comentário precisa de pelo menos ${COMENTARIO_MIN} caracteres (ou deixe em branco).` };
  if (comentario.length > COMENTARIO_MAX) return { ok: false, erro: `O comentário pode ter até ${COMENTARIO_MAX} caracteres.` };

  const marcadores: Record<string, string> = {};
  for (const p of e.pilulas) {
    if (p === "gratuito" || p === "pago") marcadores["custo"] = p;
    else marcadores[p] = "sim";
  }
  const situacao: Situacao = e.resposta === "nao" ? e.motivo! : e.resposta;
  return {
    ok: true,
    avaliacao: {
      ...(e.lugarId ? { lugarId: e.lugarId } : { lugarTexto }),
      situacao,
      marcadores,
      ...(comentario ? { texto: comentario } : {}),
    },
  };
}
