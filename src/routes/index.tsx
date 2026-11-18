import { createFileRoute, ClientOnly, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SearchBar, FilterChip, FilterChipRow, MapControls, BottomSheet, PlaceCard, PlaceDetails, PlaceSummary, Button, Icon, Skeleton, InfoBanner, EmptyState, Toast, FixedNotice } from "@/design-system/elasmapeiam-library-4342f4";
import { PINHEIROS_CENTER, statusForKind, placeSubtitle, distanceMeters, type Place } from "@/data/mock-places";
import { fetchPlaces } from "@/data/places";
import { APP_DESCRIPTION, APP_NAME, pageTitle } from "@/config/app";
import { directionsUrl, sharePlace, type ShareablePlace } from "@/lib/place-actions";

const PlacesMap = lazy(() => import("@/components/map/PlacesMap"));

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
  const [active, setActive] = useState<Filter[]>(["parking"]);
  const [shopInfo, setShopInfo] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [center, setCenter] = useState({ position: PINHEIROS_CENTER, key: 0 });
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<[number, number] | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const navigate = useNavigate();
  const goContribute = () => void navigate({ to: "/contribuir" });
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
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (!menuOpen) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [menuOpen]);
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

  useEffect(() => { let alive = true; fetchPlaces().then(r => { if (!alive) return; setAllPlaces(r.places); setLoading(false); }); return () => { alive = false; }; }, []);

  const places = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return allPlaces.filter(p => (active.some(f => kindsFor[f].includes(p.kind))) && (!q || `${p.title} ${p.subtitle} ${p.address}`.toLocaleLowerCase("pt-BR").includes(q)));
  }, [allPlaces, active, query]);

  // Ordena pela distância até a usuária (se ela liberou a localização) ou até o centro de Pinheiros.
  const origin = user ?? PINHEIROS_CENTER;
  const sorted = useMemo(() => [...places].sort((a, b) => distanceMeters(origin, a.position) - distanceMeters(origin, b.position)), [places, origin]);
  const sortLabel = user ? "Perto de você" : "Perto de Pinheiros";
  const ordered = useMemo(() => { const s = sorted.find(p => p.id === selectedId); return s ? [s, ...sorted.filter(p => p !== s)] : sorted; }, [sorted, selectedId]);

  // Como no Google Maps: tocar no pin abre o lugar na metade da tela; tocar no mapa baixa o painel.
  function select(id: string) { setSelectedId(id); setSnap("half"); }
  function closePlace() { setSelectedId(null); setSnap("peek"); }
  const selected = !desktop && selectedId ? places.find(p => p.id === selectedId) ?? null : null;

  function locate() {
    const fallback = () => { setGeoDenied(true); setCenter(c => ({ position: PINHEIROS_CENTER, key: c.key + 1 })); setLocating(false); };
    if (!navigator.geolocation) return fallback();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGeoDenied(false); setUser([pos.coords.latitude, pos.coords.longitude]); setCenter(c => ({ position: [pos.coords.latitude, pos.coords.longitude], key: c.key + 1 })); setLocating(false); },
      fallback, { timeout: 8000 },
    );
  }

  const label = loading ? "Carregando lugares" : places.length === 1 ? "1 lugar por aqui" : `${places.length} lugares por aqui`;
  const list = (<>
        {loading ? (
          [0, 1, 2].map(i => <PlaceCard key={i} loading title="" subtitle="" onExpandedChange={() => {}} />)
        ) : ordered.length === 0 ? (
          <EmptyState title="Nada por aqui" action={<></>}>Nenhum lugar corresponde aos filtros. Tente mudar a busca ou os filtros.</EmptyState>
        ) : (
          ordered.map(p => (
            <PlaceCard key={p.id} ref={el => { if (el) cardRefs.current.set(p.id, el); else cardRefs.current.delete(p.id); }} title={p.title} subtitle={placeSubtitle(p, user)} status={p.status ?? statusForKind[p.kind]} {...(p.statusLabel ? { statusLabel: p.statusLabel } : {})} address={p.address}
              criteria={p.criteria} attention={p.attention ?? []}
              confirmations={p.confirmations} {...(p.lastConfirmed ? { lastConfirmed: p.lastConfirmed } : {})}
              onRoute={() => routeTo(p)} onShare={() => void share(p)} onDetails={() => notify("Em breve: página de detalhes")}
              expanded={p.id === selectedId} onExpandedChange={open => (open ? select(p.id) : setSelectedId(null))} />
          ))
        )}
  </>);
  const mapFallback = <Skeleton className="absolute inset-0 h-full rounded-none" />;

  const map = (
    <ClientOnly fallback={mapFallback}>
      <Suspense fallback={mapFallback}>
        <PlacesMap places={places} selectedId={selectedId} onSelect={select} center={center} bottomPadding={desktop ? 0 : sheetH} topPadding={140} />
      </Suspense>
    </ClientOnly>
  );
  const toastEl = toast && <Toast key={toast.key} open onOpenChange={open => { if (!open) setToast(null); }}>{toast.message}</Toast>;
  const banners = (<>
    {shopInfo && <InfoBanner title="Oficinas chegam em breve" onDismiss={() => setShopInfo(false)}>Por enquanto o mapa mostra só bicicletários.</InfoBanner>}
    {geoDenied && <InfoBanner title="Não conseguimos sua localização" onDismiss={() => setGeoDenied(false)}>Mostrando Pinheiros. Libere a localização no navegador para ver lugares perto de você.</InfoBanner>}
  </>);
  const chips = (
    <FilterChipRow aria-label="Filtrar lugares" className={desktop ? "px-0" : undefined}>
      <FilterChip surface="map" icon="Bike" selected={active.includes("parking")} onSelectedChange={on => setActive(a => (on ? [...a, "parking"] : a.filter(k => k !== "parking")))}>Bicicletários</FilterChip>
      <FilterChip surface="map" icon="Wrench" selected={false} onSelectedChange={() => setShopInfo(true)}>Oficinas</FilterChip>
    </FilterChipRow>
  );

  if (desktop) {
    // Menu compacto (rail) como no Google Maps: só ícones com rótulos pequenos.
    const nav = [
      { label: "Explorar", icon: "MapPin" as const, active: true },
      { label: "Contribuir", icon: "Plus" as const, onClick: goContribute },
      { label: "Perfil", icon: "User" as const, onClick: () => notify("Em breve") },
    ];
    const railItem = "flex w-16 flex-col items-center gap-1 rounded-input py-2 font-sans text-[11px] leading-subtitle font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-preto";
    return (
      <div className="relative flex h-dvh w-full overflow-hidden bg-fundo text-foreground">
        <nav aria-label="Navegação principal" className="z-30 flex w-18 shrink-0 flex-col items-center gap-2 border-r border-borda bg-branco py-3">
          <button type="button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)} className={`${railItem} hover:bg-fundo`}>
            <Icon name="Menu" /><span className="sr-only">Menu</span>
          </button>
          {nav.map(n => (
            <button key={n.label} type="button" aria-current={n.active ? "page" : undefined} onClick={n.onClick} className={`${railItem} ${n.active ? "" : "hover:bg-fundo"}`}>
              <span className={`flex h-8 w-14 items-center justify-center rounded-pill ${n.active ? "bg-fundo" : ""}`}><Icon name={n.icon} /></span>
              {n.label}
            </button>
          ))}
        </nav>
        {menuOpen && (<>
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 z-20 cursor-default bg-preto/10" onClick={() => setMenuOpen(false)} />
          <div role="dialog" aria-label="Menu" className="absolute bottom-0 left-18 top-0 z-30 flex w-64 flex-col gap-6 border-r border-borda bg-branco p-6 shadow-lg">
            <p className="font-sans text-title leading-body font-semibold">{APP_NAME}</p>
            <FixedNotice variant="privacy">Versão de demonstração: lugares e indicações são fictícios.</FixedNotice>
          </div>
        </>)}
        <section aria-label={label} className="flex w-100 shrink-0 flex-col overflow-y-auto border-r border-borda bg-fundo px-4 py-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="font-sans text-title leading-body font-semibold">{label}</h2><span className="font-sans text-subtitle leading-subtitle text-muted-foreground">{sortLabel}</span></header>
          <div className="flex flex-col gap-3 [&>*]:shrink-0">
            <FixedNotice variant="privacy">Versão de demonstração: lugares e indicações são fictícios.</FixedNotice>
            {list}
          </div>
        </section>
        <main className="relative min-w-0 flex-1">
          {map}
          <div className="absolute left-4 right-4 top-4 z-10 flex max-w-130 flex-col gap-3 pointer-events-none [&>*]:pointer-events-auto">
            <SearchBar value={query} onChange={e => setQuery(e.target.value)} />
            {chips}
            {banners}
          </div>
          <MapControls className="absolute bottom-6 right-6 z-10" onLocate={locate} onAdd={goContribute} locating={locating} />
        </main>
        {toastEl}
      </div>
    );
  }

  return (
    <main className="relative mx-auto h-dvh w-full max-w-md md:max-w-none overflow-hidden bg-fundo">
      <ClientOnly fallback={mapFallback}>
        <Suspense fallback={mapFallback}>
          <PlacesMap places={places} selectedId={selectedId} onSelect={select} onMapClick={() => setSnap("peek")} center={center} bottomPadding={sheetH} topPadding={snap === "peek" ? 170 : 150} />
        </Suspense>
      </ClientOnly>

      <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 pt-4 pointer-events-none [&>*]:pointer-events-auto">
        <div className="px-4"><SearchBar value={query} onChange={e => setQuery(e.target.value)} /></div>
        <FilterChipRow aria-label="Filtrar lugares">
          <FilterChip surface="map" icon="Bike" selected={active.includes("parking")} onSelectedChange={on => setActive(a => (on ? [...a, "parking"] : a.filter(k => k !== "parking")))}>Bicicletários</FilterChip>
          <FilterChip surface="map" icon="Wrench" selected={false} onSelectedChange={() => setShopInfo(true)}>Oficinas</FilterChip>
        </FilterChipRow>
        <p className="mx-4 self-start rounded-pill border border-borda bg-branco px-3 py-1 font-sans text-chip leading-chip text-foreground">Demonstração · lugares e indicações fictícios</p>
        {shopInfo && (
          <div className="px-4">
            <InfoBanner title="Oficinas chegam em breve" onDismiss={() => setShopInfo(false)}>
              Por enquanto o mapa mostra só bicicletários.
            </InfoBanner>
          </div>
        )}
        {geoDenied && (
          <div className="px-4">
            <InfoBanner title="Não conseguimos sua localização" onDismiss={() => setGeoDenied(false)}>
              Mostrando Pinheiros. Libere a localização no navegador para ver lugares perto de você.
            </InfoBanner>
          </div>
        )}
      </div>

      <MapControls className={`absolute right-4 z-10 ${snap === "full" ? "hidden" : ""}`} style={{ bottom: sheetH + 16 }} onLocate={locate} onAdd={goContribute} locating={locating} />

      <BottomSheet ref={sheetRef} placement="static" snap={snap} onSnapChange={setSnap} label={selected ? selected.title : label} sortLabel={sortLabel} scrollResetKey={selectedId} className="z-20 md:mx-auto md:max-w-120"
        {...(selected ? { header: (
          <PlaceSummary title={selected.title} subtitle={placeSubtitle(selected, user)} status={selected.status ?? statusForKind[selected.kind]} {...(selected.statusLabel ? { statusLabel: selected.statusLabel } : {})}
            confirmations={selected.confirmations} {...(selected.lastConfirmed ? { lastConfirmed: selected.lastConfirmed } : {})}
            actions={<Button variant="icon" aria-label="Fechar e voltar à lista" title="Fechar" onClick={closePlace}><Icon name="X" /></Button>} />
        ) } : {})}>
        {selected ? (<>
          <PlaceDetails criteria={selected.criteria} attention={selected.attention ?? []} address={selected.address} confirmations={selected.confirmations}
            onRoute={() => routeTo(selected)} onShare={() => void share(selected)} onDetails={() => notify("Em breve: página de detalhes")} />
          {sorted.length > 1 && <h3 className="mt-4 font-sans text-title leading-body font-semibold">Outros bicicletários</h3>}
          {sorted.filter(p => p.id !== selected.id).map(p => (
            <PlaceCard key={p.id} title={p.title} subtitle={placeSubtitle(p, user)} status={p.status ?? statusForKind[p.kind]} {...(p.statusLabel ? { statusLabel: p.statusLabel } : {})}
              confirmations={p.confirmations} {...(p.lastConfirmed ? { lastConfirmed: p.lastConfirmed } : {})}
              expanded={false} onExpandedChange={open => { if (open) select(p.id); }} />
          ))}
        </>) : (<>
          <FixedNotice variant="privacy">Versão de demonstração: lugares e indicações são fictícios.</FixedNotice>
          {list}
        </>)}
      </BottomSheet>
      {toastEl}
    </main>
  );
}

