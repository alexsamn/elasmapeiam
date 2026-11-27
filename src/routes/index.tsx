import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SearchBar, BottomSheet, Modal, PlaceCard, PlaceDetails, PlaceSummary, Button, Icon, Skeleton, InfoBanner, EmptyState, Toast, FixedNotice } from "@/design-system/elasmapeiam-library-4342f4";
import { START_CENTER, START_LABEL, statusForKind, placeSubtitle, distanceMeters, type Place } from "@/data/mock-places";
import { placesInArea, type Area } from "@/lib/area";
import { fetchPlaces } from "@/data/places";
import { APP_DESCRIPTION, pageTitle } from "@/config/app";
import { directionsUrl, sharePlace, type ShareablePlace } from "@/lib/place-actions";
import { searchAddress, type GeoResult } from "@/lib/geocode";
import { AvaliarForm } from "@/components/avaliar/AvaliarForm";
import { LocateFixed } from "lucide-react";

const PlacesMap = lazy(() => import("@/components/map/PlacesMap"));

// Filtros saíram do mapa (21/11): sem oficinas no mapa, "Oficinas" não filtrava nada. Voltam quando houver oficinas.
const active: Filter[] = ["parking"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: pageTitle("Mapa") },
      { name: "description", content: APP_DESCRIPTION },
      { property: "og:title", content: pageTitle("Mapa") },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Oficinas saíram do mapa (16/11): a validação não confirmou a dor. O filtro fica como "Em breve".
type Filter = "parking";
const kindsFor: Record<Filter, string[]> = { parking: ["safe", "unconfirmed"] };

function Index() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Área do mapa que a pessoa está vendo; com um lugar aberto, a lista fica congelada na área de antes.
  const [mapArea, setMapArea] = useState<Area | null>(null);
  const [frozenArea, setFrozenArea] = useState<Area | null>(null);
  const [fitAllKey, setFitAllKey] = useState(0);
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [center, setCenter] = useState({ position: START_CENTER, key: 0 });
  const [query, setQuery] = useState("");
  // Busca de endereço (Enter): resultados do Nominatim e o ponto escolhido.
  const [addr, setAddr] = useState<{ status: "idle" | "loading" | "done" | "error"; results: GeoResult[] }>({ status: "idle", results: [] });
  const [point, setPoint] = useState<GeoResult | null>(null);
  const addrAbort = useRef<AbortController | null>(null);
  const [user, setUser] = useState<[number, number] | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loadError, setLoadError] = useState(false);
  // "Contribuir" abre um painel (modal) com o lugar já escolhido; "Sugerir lugar" abre o mesmo painel sem lugar.
  const [avaliar, setAvaliar] = useState<{ lugar: Place | null; key: number } | null>(null);
  const openSuggest = () => setAvaliar(a => ({ lugar: null, key: (a?.key ?? 0) + 1 }));
  const avaliarButton = (p: Place) => <Button variant="primary" className="w-full border-0" onClick={() => setAvaliar(a => ({ lugar: p, key: (a?.key ?? 0) + 1 }))}>Contribuir</Button>;
  function notify(message: string) { setToast(previous => ({ message, key: (previous?.key ?? 0) + 1 })); }
  function routeTo(place: ShareablePlace) { window.open(directionsUrl(place), "_blank", "noopener,noreferrer"); }
  async function share(place: ShareablePlace) {
    try {
      if (await sharePlace(place, navigator) === "copied") notify("Link copiado");
    } catch {
      notify("Não foi possível compartilhar. Tente novamente.");
    }
  }
  const [desktop, setDesktop] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(min-width: 992px)"); const on = () => setDesktop(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => { if (desktop && selectedId) cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [desktop, selectedId]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState(136);
  useEffect(() => {
    const el = sheetRef.current; if (!el) return;
    const measure = () => { const parent = el.offsetParent?.getBoundingClientRect(); const r = el.getBoundingClientRect(); setSheetH(Math.max(0, (parent?.bottom ?? window.innerHeight) - r.top)); };
    measure(); const ro = new ResizeObserver(measure); ro.observe(el);
    el.addEventListener("transitionend", measure); return () => { ro.disconnect(); el.removeEventListener("transitionend", measure); };
  }, []);
  useEffect(() => { const t = setTimeout(() => sheetRef.current && setSheetH(Math.max(0, (sheetRef.current.offsetParent?.getBoundingClientRect().bottom ?? 0) - sheetRef.current.getBoundingClientRect().top)), 350); return () => clearTimeout(t); }, [snap]);

  useEffect(() => { let alive = true; fetchPlaces().then(r => { if (!alive) return; setAllPlaces(r.places); setLoadError(r.source === "error"); setLoading(false); }); return () => { alive = false; }; }, []);

  const places = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return allPlaces.filter(p => (active.some(f => kindsFor[f].includes(p.kind))) && (!q || `${p.title} ${p.subtitle} ${p.address}`.toLocaleLowerCase("pt-BR").includes(q)));
  }, [allPlaces, query]);

  // Ordena pela distância até a usuária (se ela liberou a localização) ou até o centro inicial (Av. Paulista).
  const origin = point?.position ?? user ?? START_CENTER;
  const near: [number, number] | null = point?.position ?? user;
  const nearSuffix = point ? "daqui" : "de você";
  const subtitleFor = (p: Place) => placeSubtitle(p, near, nearSuffix);
  const sorted = useMemo(() => [...places].sort((a, b) => distanceMeters(origin, a.position) - distanceMeters(origin, b.position)), [places, origin]);
  const sortLabel = point ? `Perto de ${point.label}` : user ? "Perto de você" : `Perto da ${START_LABEL}`;
  const byName = query.trim().length > 0;
  const area = selectedId ? frozenArea : mapArea;
  const filteringByArea = !byName && area !== null;
  const visible = useMemo(() => placesInArea(sorted, area, { byName, selectedId }), [sorted, area, byName, selectedId]);
  const ordered = useMemo(() => { const s = visible.find(p => p.id === selectedId); return s ? [s, ...visible.filter(p => p !== s)] : visible; }, [visible, selectedId]);
  const showAll = () => setFitAllKey(k => k + 1);

  // Como no Google Maps: tocar no pin abre o lugar na metade da tela; tocar no mapa baixa o painel.
  function select(id: string) { if (!selectedId) setFrozenArea(mapArea); setSelectedId(id); setSnap("half"); }
  function closePlace() { setSelectedId(null); setSnap("peek"); }
  const selected = !desktop && selectedId ? places.find(p => p.id === selectedId) ?? null : null;

  function locate() {
    const fallback = () => { setGeoDenied(true); setCenter(c => ({ position: START_CENTER, key: c.key + 1 })); setLocating(false); };
    if (!navigator.geolocation) return fallback();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGeoDenied(false); setPoint(null); setUser([pos.coords.latitude, pos.coords.longitude]); setCenter(c => ({ position: [pos.coords.latitude, pos.coords.longitude], key: c.key + 1 })); setLocating(false); },
      fallback, { timeout: 8000 },
    );
  }

  function changeQuery(value: string) {
    setQuery(value);
    addrAbort.current?.abort();
    setAddr({ status: "idle", results: [] });
  }
  async function submitSearch() {
    const q = query.trim();
    if (q.length < 3) return;
    addrAbort.current?.abort();
    const controller = new AbortController();
    addrAbort.current = controller;
    setAddr({ status: "loading", results: [] });
    try {
      const results = await searchAddress(q, controller.signal);
      if (!controller.signal.aborted) setAddr({ status: "done", results });
    } catch {
      if (!controller.signal.aborted) setAddr({ status: "error", results: [] });
    }
  }
  function chooseAddress(r: GeoResult) {
    (document.activeElement as HTMLElement | null)?.blur(); // fecha o teclado no celular
    setPoint(r);
    setQuery("");
    setAddr({ status: "idle", results: [] });
    setSelectedId(null);
    setSnap("peek");
    setCenter(c => ({ position: r.position, key: c.key + 1 }));
  }
  function clearPoint() { setPoint(null); }

  const resultRow = "flex min-h-11 w-full flex-col items-start justify-center gap-0.5 px-4 py-2 text-left font-sans hover:bg-fundo focus-visible:bg-fundo focus-visible:outline-none";
  const searchBox = (
    <div className="flex flex-col gap-2">
      <form role="search" onSubmit={e => { e.preventDefault(); void submitSearch(); }}>
        <SearchBar value={query} enterKeyHint="search" onChange={e => changeQuery(e.target.value)} className="h-11!" />
      </form>
      {addr.status === "idle" && query.trim().length >= 3 && (
        // Testadora buscou "Pedroso" e não viu nada: buscar endereço só acontecia com Enter.
        <div className="overflow-hidden rounded-input border border-borda bg-branco shadow-map-chip">
          <button type="button" className={resultRow} onClick={() => void submitSearch()}>
            <span className="flex items-center gap-2 text-body leading-body font-medium text-foreground"><Icon name="Search" className="size-4 shrink-0" />Buscar endereço “{query.trim()}”</span>
          </button>
        </div>
      )}
      {addr.status !== "idle" && (
        <div className="overflow-hidden rounded-input border border-borda bg-branco shadow-search" aria-live="polite">
          {addr.status === "loading" && <p className="px-4 py-3 font-sans text-subtitle leading-subtitle text-muted-foreground">Procurando endereço…</p>}
          {addr.status === "error" && <p className="px-4 py-3 font-sans text-subtitle leading-subtitle text-muted-foreground">Sem conexão com a busca de endereços. Tente de novo.</p>}
          {addr.status === "done" && addr.results.length === 0 && <p className="px-4 py-3 font-sans text-subtitle leading-subtitle text-muted-foreground">Não achei esse endereço em São Paulo. Tente o nome completo da rua, ex.: Rua Pedroso de Morais.</p>}
          {addr.status === "done" && addr.results.length > 0 && (
            <ul aria-label="Endereços encontrados" className="divide-y divide-borda">
              {addr.results.map(r => (
                <li key={r.id}>
                  <button type="button" className={resultRow} onClick={() => chooseAddress(r)}>
                    <span className="flex items-center gap-2 text-body leading-body font-medium text-foreground"><Icon name="MapPin" className="size-4 shrink-0" />{r.label}</span>
                    {r.detail && <span className="pl-6 text-chip leading-chip text-muted-foreground">{r.detail}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {point && addr.status === "idle" && (
        <div className="flex items-center gap-2 self-start rounded-pill border border-borda bg-branco py-1 pl-3 pr-1 font-sans text-chip leading-chip text-foreground">
          <Icon name="MapPin" className="size-4 shrink-0" /><span className="max-w-60 truncate">{point.label}</span>
          <button type="button" aria-label="Limpar endereço buscado" onClick={clearPoint} className="flex size-8 items-center justify-center rounded-pill hover:bg-fundo"><Icon name="X" className="size-4" /></button>
        </div>
      )}
    </div>
  );

  const label = loading ? "Carregando lugares" : loadError ? "Não conseguimos carregar os lugares"
    : filteringByArea ? (visible.length === 1 ? "1 nesta área" : `${visible.length} nesta área`)
    : places.length === 1 ? "1 lugar por aqui" : `${places.length} lugares por aqui`;
  const showAllButton = <Button variant="secondary" onClick={showAll}>Ver todos</Button>;
  const list = (<>
        {loading ? (
          [0, 1, 2].map(i => <PlaceCard key={i} loading title="" subtitle="" onExpandedChange={() => {}} />)
        ) : loadError ? (
          <EmptyState title="Não conseguimos carregar os lugares" action={<></>}>Confira sua internet e tente de novo em instantes.</EmptyState>
        ) : ordered.length === 0 && filteringByArea && places.length > 0 ? (
          <EmptyState title="Nenhum bicicletário nesta área" action={showAllButton}>Afaste o mapa ou veja todos os {places.length} lugares.</EmptyState>
        ) : ordered.length === 0 ? (
          <EmptyState title="Nada por aqui" action={<></>}>{query.trim().length >= 3 ? "Nenhum bicicletário com esse nome. Para ir até um endereço, aperte Enter (ou Buscar no teclado)." : "Nenhum lugar corresponde aos filtros. Tente mudar a busca ou os filtros."}</EmptyState>
        ) : (
          <>{filteringByArea && visible.length < places.length && (
            <p className="mb-2 font-sans text-subtitle leading-subtitle text-muted-foreground">
              Só os que aparecem no mapa.{" "}
              <button type="button" onClick={showAll} className="min-h-11 font-semibold text-foreground underline">Ver todos os {places.length}</button>
            </p>
          )}
          {ordered.map(p => (
            <PlaceCard key={p.id} ref={el => { if (el) cardRefs.current.set(p.id, el); else cardRefs.current.delete(p.id); }} title={p.title} subtitle={subtitleFor(p)} status={p.status ?? statusForKind[p.kind]} {...(p.statusLabel ? { statusLabel: p.statusLabel } : {})} address={p.address}
              criteria={p.criteria} attention={p.attention ?? []}
              confirmations={p.confirmations} {...(p.lastConfirmed ? { lastConfirmed: p.lastConfirmed } : {})}
              onRoute={() => routeTo(p)} onShare={() => void share(p)} actions={avaliarButton(p)}
              expanded={p.id === selectedId} onExpandedChange={open => (open ? select(p.id) : setSelectedId(null))} />
          ))}</>
        )}
  </>);
  const mapFallback = <Skeleton className="absolute inset-0 h-full rounded-none" />;

  const map = (
    <ClientOnly fallback={mapFallback}>
      <Suspense fallback={mapFallback}>
        <PlacesMap places={places} selectedId={selectedId} onSelect={select} center={center} searchPoint={point?.position ?? null} bottomPadding={desktop ? 0 : sheetH} topPadding={76} onAreaChange={setMapArea} fitAllKey={fitAllKey} />
      </Suspense>
    </ClientOnly>
  );
  const toastEl = (<>
    {toast && <Toast key={toast.key} open onOpenChange={open => { if (!open) setToast(null); }}>{toast.message}</Toast>}
    <Modal open={avaliar !== null} onOpenChange={open => { if (!open) setAvaliar(null); }} size="large"
      title={avaliar?.lugar ? avaliar.lugar.title : "Sugerir lugar"}>
      {avaliar && <AvaliarForm key={avaliar.key} lugar={avaliar.lugar}
        onSent={() => { setAvaliar(null); notify("Recebido! Sua contribuição aparece depois da revisão."); }} />}
    </Modal>
  </>);
  // Minha localização + "Sugerir lugar" (antes era um + sem texto, que parecia "adicionar ponto").
  const mapActions = (className: string, style?: CSSProperties) => (
    <div role="group" aria-label="Ações do mapa" className={`flex flex-col items-end gap-3 ${className}`} style={style}>
      <Button variant="icon" aria-label="Minha localização" title="Minha localização" onClick={locate} loading={locating} className="size-11! bg-branco shadow-location [&_svg]:size-5">
        <LocateFixed size={20} strokeWidth={2} aria-hidden="true" />
      </Button>
      <Button variant="primary" onClick={openSuggest} className="h-10! gap-1.5 rounded-pill border-0 bg-rosa px-4 font-sans text-subtitle leading-subtitle text-preto shadow-fab hover:bg-accent-hover">
        <Icon name="Plus" className="size-4" />Sugerir lugar
      </Button>
    </div>
  );
  const banners = (<>
    {geoDenied && <InfoBanner title="Não conseguimos sua localização" onDismiss={() => setGeoDenied(false)}>Mostrando a região da Av. Paulista. Libere a localização no navegador para ver lugares perto de você.</InfoBanner>}
  </>);

  if (desktop) {
    // Menu compacto (rail) como no Google Maps: só ícones com rótulos pequenos.
    const nav = [
      { label: "Explorar", icon: "MapPin" as const, active: true },
      { label: "Sugerir lugar", icon: "Plus" as const, onClick: openSuggest },
    ];
    const railItem = "flex w-16 flex-col items-center gap-1 rounded-input py-2 font-sans text-[11px] leading-subtitle font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-preto";
    return (
      <div className="relative flex h-dvh w-full overflow-hidden bg-fundo text-foreground">
        <nav aria-label="Navegação principal" className="z-30 flex w-18 shrink-0 flex-col items-center gap-2 border-r border-borda bg-branco py-3">
          {nav.map(n => (
            <button key={n.label} type="button" aria-current={n.active ? "page" : undefined} onClick={n.onClick} className={`${railItem} ${n.active ? "" : "hover:bg-fundo"}`}>
              <span className={`flex h-8 w-14 items-center justify-center rounded-pill ${n.active ? "bg-fundo" : ""}`}><Icon name={n.icon} /></span>
              {n.label}
            </button>
          ))}
        </nav>
        <section aria-label={label} className="flex w-100 shrink-0 flex-col overflow-y-auto border-r border-borda bg-fundo px-4 py-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="font-sans text-title leading-body font-semibold">{label}</h2><span className="font-sans text-subtitle leading-subtitle text-muted-foreground">{sortLabel}</span></header>
          <div className="flex flex-col gap-3 [&>*]:shrink-0">
            <FixedNotice variant="privacy">Informações enviadas por ciclistas, com a data do último relato. Confira no local.</FixedNotice>
            {list}
          </div>
        </section>
        <main className="relative min-w-0 flex-1">
          {map}
          <div className="absolute left-4 right-4 top-4 z-10 flex max-w-130 flex-col gap-3 pointer-events-none [&>*]:pointer-events-auto">
            {searchBox}
            {banners}
          </div>
          {mapActions("absolute bottom-6 right-6 z-10")}
        </main>
        {toastEl}
      </div>
    );
  }

  return (
    <main className="relative mx-auto h-dvh w-full max-w-md md:max-w-none overflow-hidden bg-fundo">
      <ClientOnly fallback={mapFallback}>
        <Suspense fallback={mapFallback}>
          <PlacesMap places={places} selectedId={selectedId} onSelect={select} onMapClick={() => setSnap("peek")} center={center} searchPoint={point?.position ?? null} bottomPadding={sheetH} topPadding={76} onAreaChange={setMapArea} fitAllKey={fitAllKey} />
        </Suspense>
      </ClientOnly>

      <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 pt-4 pointer-events-none [&>*]:pointer-events-auto">
        <div className="px-4">{searchBox}</div>
        {geoDenied && (
          <div className="px-4">
            <InfoBanner title="Não conseguimos sua localização" onDismiss={() => setGeoDenied(false)}>
              Mostrando a região da Av. Paulista. Libere a localização no navegador para ver lugares perto de você.
            </InfoBanner>
          </div>
        )}
      </div>

      {mapActions(`absolute right-4 z-10 ${snap === "full" ? "hidden" : ""}`, { bottom: sheetH + 16 })}

      <BottomSheet ref={sheetRef} placement="static" snap={snap} onSnapChange={setSnap} label={selected ? selected.title : label} sortLabel={sortLabel} scrollResetKey={selectedId} className="z-20 md:mx-auto md:max-w-120"
        {...(selected ? { header: (
          <PlaceSummary title={selected.title} subtitle={subtitleFor(selected)} status={selected.status ?? statusForKind[selected.kind]} {...(selected.statusLabel ? { statusLabel: selected.statusLabel } : {})}
            confirmations={selected.confirmations} {...(selected.lastConfirmed ? { lastConfirmed: selected.lastConfirmed } : {})}
            actions={<Button variant="icon" aria-label="Fechar e voltar à lista" title="Fechar" onClick={closePlace}><Icon name="X" /></Button>} />
        ) } : { header: (
          // Cabeçalho compacto (21/11): título e ordem numa linha, para o painel fechado ocupar menos mapa.
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="min-w-0 truncate font-sans text-body leading-body font-semibold">{label}</h2>
            <span className="shrink-0 font-sans text-chip leading-chip text-muted-foreground">{sortLabel}</span>
          </header>
        ) })}>
        {selected ? (<>
          <PlaceDetails criteria={selected.criteria} attention={selected.attention ?? []} address={selected.address} confirmations={selected.confirmations}
            onRoute={() => routeTo(selected)} onShare={() => void share(selected)} actions={avaliarButton(selected)} />
          {visible.length > 1 && <h3 className="mt-4 font-sans text-title leading-body font-semibold">{filteringByArea ? "Outros nesta área" : "Outros bicicletários"}</h3>}
          {visible.filter(p => p.id !== selected.id).map(p => (
            <PlaceCard key={p.id} title={p.title} subtitle={subtitleFor(p)} status={p.status ?? statusForKind[p.kind]} {...(p.statusLabel ? { statusLabel: p.statusLabel } : {})}
              confirmations={p.confirmations} {...(p.lastConfirmed ? { lastConfirmed: p.lastConfirmed } : {})}
              expanded={false} onExpandedChange={open => { if (open) select(p.id); }} />
          ))}
        </>) : (<>
          <FixedNotice variant="privacy">Informações enviadas por ciclistas, com a data do último relato. Confira no local.</FixedNotice>
          {list}
        </>)}
      </BottomSheet>
      {toastEl}
    </main>
  );
}

