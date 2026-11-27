import { useId, useState, type FormEvent } from "react";
import { Button, FilterChip, FixedNotice, Input, Textarea } from "@/design-system/elasmapeiam-library-4342f4";
import { sendReport } from "@/data/places";
import {
  alternarPilula,
  COMENTARIO_MAX,
  montarAvaliacao,
  PILULAS,
  type MotivoNao,
  type PilulaId,
  type Resposta,
} from "@/lib/avaliacao";

const RESPOSTAS: { id: Resposta; label: string; emoji: string }[] = [
  { id: "sim", label: "Sim", emoji: "✅" },
  { id: "ressalvas", label: "Sim, com ressalvas", emoji: "⚠️" },
  { id: "nao", label: "Não", emoji: "❌" },
];
const MOTIVOS: { id: MotivoNao; label: string }[] = [
  { id: "fechado", label: "Fechado" },
  { id: "quebrado", label: "Quebrado" },
  { id: "nao_existe_mais", label: "Não existe mais" },
];

const legend = "mb-3 font-sans text-subtitle leading-subtitle font-semibold";
const opcao =
  "relative flex min-h-12 cursor-pointer items-center gap-3 rounded-input border border-borda bg-branco px-4 py-2 font-sans text-body leading-body font-medium has-checked:border-[1.5px] has-checked:border-preto has-checked:bg-fundo has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-preto";

export interface AvaliarFormProps {
  /** Lugar do mapa. Sem lugar, é uma sugestão de lugar novo. */
  lugar: { id: string; title: string; bairro: string } | null;
  onSent: () => void;
}

/** Formulário de avaliação: "Dá pra parar a bike aqui?", pílulas e comentário opcional. */
export function AvaliarForm({ lugar, onSent }: AvaliarFormProps) {
  const ids = { nome: useId(), comentario: useId(), contador: useId() };
  const [lugarTexto, setLugarTexto] = useState("");
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [motivo, setMotivo] = useState<MotivoNao | null>(null);
  const [pilulas, setPilulas] = useState<PilulaId[]>([]);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    const r = montarAvaliacao({ lugarId: lugar?.id ?? null, lugarTexto, resposta, motivo, pilulas, comentario });
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setEnviando(true);
    const res = await sendReport(r.avaliacao);
    setEnviando(false);
    if (res.ok) onSent();
    else setErro(res.message);
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6" noValidate>
      {lugar ? (
        <p className="font-sans text-subtitle leading-subtitle text-muted-foreground">{lugar.bairro}</p>
      ) : (
        <Input
          id={ids.nome}
          label="Qual lugar?"
          value={lugarTexto}
          maxLength={120}
          onChange={e => setLugarTexto(e.target.value)}
          placeholder="Nome ou endereço. Ex.: Sesc Pinheiros, entrada da R. Paes Leme"
        />
      )}

      <fieldset>
        <legend className={legend}>Dá pra parar a bike aqui?</legend>
        <div className="flex flex-col gap-2">
          {RESPOSTAS.map(o => (
            <label key={o.id} className={`${opcao} w-full`}>
              <input type="radio" name="resposta" value={o.id} checked={resposta === o.id}
                onChange={() => { setResposta(o.id); if (o.id !== "nao") setMotivo(null); }} className="sr-only" />
              <span aria-hidden="true">{o.emoji}</span>{o.label}
            </label>
          ))}
        </div>
        {resposta === "nao" && (
          <fieldset className="mt-4">
            <legend className={legend}>O que aconteceu?</legend>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS.map(m => (
                <label key={m.id} className={opcao}>
                  <input type="radio" name="motivo" value={m.id} checked={motivo === m.id} onChange={() => setMotivo(m.id)} className="sr-only" />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </fieldset>

      <fieldset>
        <legend className={legend}>O que você viu? <span className="font-normal text-muted-foreground">(opcional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {PILULAS.map(p => {
            const ativa = pilulas.includes(p.id);
            return (
              <FilterChip key={p.id} type="button" selected={ativa} icon={ativa ? "Check" : "Plus"}
                onSelectedChange={() => setPilulas(atual => alternarPilula(atual, p.id))}>
                {p.label}
              </FilterChip>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={ids.comentario} className="block font-sans text-subtitle leading-subtitle font-semibold">
          Quer contar mais? <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Textarea id={ids.comentario} value={comentario} maxLength={COMENTARIO_MAX} rows={4}
          aria-describedby={ids.contador} onChange={e => setComentario(e.target.value)}
          placeholder="Horário que lota, onde fica a entrada, o que levar…" />
        <div className="flex items-start justify-between gap-3 font-sans text-chip leading-chip text-muted-foreground">
          <p>Não escreva nomes de pessoas, telefones ou placas.</p>
          <p id={ids.contador} className="shrink-0" aria-live="polite">{comentario.trim().length}/{COMENTARIO_MAX}</p>
        </div>
      </div>

      <FixedNotice variant="privacy">
        Uma pessoa revisa antes de publicar. Se você escrever um comentário, uma IA tira dados pessoais e organiza o texto. Não pedimos nome, telefone nem e-mail.
      </FixedNotice>

      {erro && <p role="alert" className="font-sans text-subtitle leading-subtitle text-error">{erro}</p>}

      <Button type="submit" variant="primary" className="w-full" loading={enviando}>
        {lugar ? "Enviar" : "Enviar sugestão"}
      </Button>
    </form>
  );
}
