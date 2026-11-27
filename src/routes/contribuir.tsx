import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon, Skeleton, Toast } from "@/design-system/elasmapeiam-library-4342f4";
import type { Place } from "@/data/mock-places";
import { fetchPlaces } from "@/data/places";
import { pageTitle } from "@/config/app";
import { parseContribuirSearch } from "@/lib/contribuir";
import { AvaliarForm } from "@/components/avaliar/AvaliarForm";

// Página para links diretos (/contribuir?lugar=<id>). No app, avaliar e sugerir
// lugar abrem num painel sobre o mapa (21/11/2026).
export const Route = createFileRoute("/contribuir")({
  validateSearch: parseContribuirSearch,
  head: () => ({
    meta: [
      { title: pageTitle("Contribuir") },
      { name: "description", content: "Conte se dá pra parar a bike num bicicletário de São Paulo." },
    ],
  }),
  component: Contribuir,
});

function Contribuir() {
  const navigate = useNavigate();
  const { lugar: lugarId } = Route.useSearch();
  const [lugar, setLugar] = useState<Place | null>(null);
  const [carregando, setCarregando] = useState(Boolean(lugarId));
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!lugarId) return;
    let alive = true;
    fetchPlaces().then(r => {
      if (!alive) return;
      setLugar(r.places.find(p => p.id === lugarId) ?? null);
      setCarregando(false);
    });
    return () => { alive = false; };
  }, [lugarId]);

  return (
    <main className="min-h-dvh bg-fundo text-foreground">
      <div className="mx-auto flex w-full max-w-130 flex-col gap-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <Link to="/" aria-label="Voltar ao mapa" className="flex size-11 items-center justify-center rounded-pill hover:bg-rosa focus-visible:outline-2 focus-visible:outline-preto">
            <Icon name="ArrowRight" className="rotate-180" />
          </Link>
          <h1 className="font-sans text-title leading-body font-semibold">{lugar ? lugar.title : carregando ? "Contribuir" : "Sugerir lugar"}</h1>
        </header>
        {carregando ? <Skeleton className="h-96" /> : <AvaliarForm lugar={lugar} onSent={() => setEnviado(true)} />}
      </div>

      {enviado && (
        <Toast open onOpenChange={open => { if (!open) { setEnviado(false); void navigate({ to: "/" }); } }}>
          Recebido! Sua contribuição aparece depois da revisão.
        </Toast>
      )}
    </main>
  );
}
