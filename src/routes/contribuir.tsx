import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Button, FixedNotice, Input, Textarea, Toast, Icon } from "@/design-system/elasmapeiam-library-4342f4";
import type { Place } from "@/data/mock-places";
import { fetchPlaces, sendReport } from "@/data/places";
import { pageTitle } from "@/config/app";

export const Route = createFileRoute("/contribuir")({
  head: () => ({
    meta: [
      { title: pageTitle("Contribuir") },
      { name: "description", content: "Conte como foi deixar a bike num bicicletário de São Paulo." },
    ],
  }),
  component: Contribuir,
});

const OUTRO = "__outro__";
const MIN = 10;
const MAX = 1000;

function Contribuir() {
  const navigate = useNavigate();
  const ids = { lugar: useId(), relato: useId(), ajuda: useId(), contador: useId() };
  const [lugares, setLugares] = useState<Place[]>([]);
  const [lugar, setLugar] = useState("");
  const [lugarTexto, setLugarTexto] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPlaces().then(r => { if (alive) setLugares(r.places.filter(p => p.type === "Bicicletário")); });
    return () => { alive = false; };
  }, []);

  const tamanho = texto.trim().length;
  const outro = lugar === OUTRO;
  const podeEnviar = tamanho >= MIN && tamanho <= MAX && !enviando;

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    const r = await sendReport({
      ...(lugar && !outro ? { lugarId: lugar } : {}),
      ...(outro && lugarTexto.trim() ? { lugarTexto: lugarTexto.trim() } : {}),
      texto: texto.trim(),
    });
    setEnviando(false);
    if (r.ok) {
      setEnviado(true);
      setTexto("");
      setLugar("");
      setLugarTexto("");
    } else {
      setErro(r.message);
    }
  }

  return (
    <main className="min-h-dvh bg-fundo text-foreground">
      <div className="mx-auto flex w-full max-w-130 flex-col gap-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <Link to="/" aria-label="Voltar ao mapa" className="flex size-11 items-center justify-center rounded-pill hover:bg-rosa focus-visible:outline-2 focus-visible:outline-preto">
            <Icon name="ArrowRight" className="rotate-180" />
          </Link>
          <h1 className="font-sans text-title leading-body font-semibold">Contar como foi</h1>
        </header>

        <p className="font-sans text-body leading-body">
          Deixou a bike num bicicletário? Conte o que você viu. Seu relato ajuda outras ciclistas a decidir antes de ir.
        </p>

        <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
          <div className="space-y-2">
            <label htmlFor={ids.lugar} className="block font-sans text-subtitle leading-subtitle font-semibold">Qual lugar?</label>
            <select
              id={ids.lugar}
              value={lugar}
              onChange={e => setLugar(e.target.value)}
              className="h-control w-full rounded-input border border-borda bg-branco px-4 font-sans text-body leading-body text-foreground focus:border-2 focus:border-preto focus-visible:outline-none"
            >
              <option value="">Escolha um bicicletário (opcional)</option>
              {lugares.map(p => <option key={p.id} value={p.id}>{p.title} · {p.bairro}</option>)}
              <option value={OUTRO}>Não está no mapa</option>
            </select>
          </div>

          {outro && (
            <Input
              label="Nome ou endereço do lugar"
              value={lugarTexto}
              maxLength={120}
              onChange={e => setLugarTexto(e.target.value)}
              placeholder="Ex.: Sesc Pinheiros, entrada da R. Paes Leme"
            />
          )}

          <div className="space-y-2">
            <label htmlFor={ids.relato} className="block font-sans text-subtitle leading-subtitle font-semibold">Como foi deixar a bike lá?</label>
            <Textarea
              id={ids.relato}
              value={texto}
              maxLength={MAX}
              rows={6}
              aria-describedby={`${ids.ajuda} ${ids.contador}`}
              variant={erro ? "error" : "default"}
              onChange={e => setTexto(e.target.value)}
              placeholder="Tem cobertura? Vigia ou câmera? Prende o quadro? Costuma lotar?"
            />
            <div className="flex items-start justify-between gap-3 font-sans text-chip leading-chip text-muted-foreground">
              <p id={ids.ajuda}>Não escreva nomes de pessoas, telefones ou placas.</p>
              <p id={ids.contador} className="shrink-0" aria-live="polite">{tamanho}/{MAX}</p>
            </div>
          </div>

          <FixedNotice variant="privacy">
            Uma IA organiza seu relato em critérios e uma pessoa revisa antes de publicar. Não pedimos nome, telefone nem e-mail.
          </FixedNotice>

          {erro && <p role="alert" className="font-sans text-subtitle leading-subtitle text-error">{erro}</p>}

          <Button type="submit" variant="primary" className="w-full" loading={enviando} disabled={!podeEnviar}>
            Enviar relato
          </Button>
          {tamanho > 0 && tamanho < MIN && (
            <p className="-mt-3 text-center font-sans text-chip leading-chip text-muted-foreground">Escreva pelo menos {MIN} caracteres.</p>
          )}
        </form>
      </div>

      {enviado && (
        <Toast open onOpenChange={open => { if (!open) { setEnviado(false); void navigate({ to: "/" }); } }}>
          Recebido! Seu relato aparece depois da revisão.
        </Toast>
      )}
    </main>
  );
}
