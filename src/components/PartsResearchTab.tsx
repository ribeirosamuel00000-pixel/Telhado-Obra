import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BadgePercent,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Gauge,
  Info,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Wrench,
  X,
} from 'lucide-react';

type SortMode = 'best' | 'lowest' | 'fastest';

type Offer = {
  id: string;
  store: string;
  logo: string;
  title: string;
  condition: string;
  price: number;
  oldPrice?: number;
  shipping: number;
  delivery: string;
  rating: number;
  reviews: number;
  highlight: string;
  coupon: string | null;
  link: string;
  sourceType: 'marketplace' | 'loja';
};

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const catalog: Record<string, Offer[]> = {
  default: [
    {
      id: 'ml-1',
      store: 'Mercado Livre',
      logo: 'ML',
      title: 'Kit de pastilhas de freio dianteiras — aplicação confirmada',
      condition: 'Novo • Garantia 90 dias',
      price: 189.9,
      oldPrice: 229.9,
      shipping: 0,
      delivery: 'Amanhã',
      rating: 4.9,
      reviews: 128,
      highlight: 'Frete grátis + entrega rápida',
      coupon: 'Cupom a confirmar no checkout',
      link: 'https://lista.mercadolivre.com.br/autopecas',
      sourceType: 'marketplace',
    },
    {
      id: 'auto-1',
      store: 'Auto Peças Brasil',
      logo: 'AP',
      title: 'Pastilha de freio cerâmica — linha premium',
      condition: 'Novo • Nota fiscal',
      price: 204.5,
      oldPrice: 239.9,
      shipping: 14.9,
      delivery: '2 a 4 dias úteis',
      rating: 4.8,
      reviews: 76,
      highlight: 'Desconto direto no produto',
      coupon: null,
      link: 'https://www.google.com/search?q=auto+pe%C3%A7as+pastilha+de+freio',
      sourceType: 'loja',
    },
    {
      id: 'peca-1',
      store: 'Peça Certa',
      logo: 'PC',
      title: 'Jogo de pastilhas dianteiras — compatibilidade garantida',
      condition: 'Novo • Homologado',
      price: 219.0,
      shipping: 0,
      delivery: '3 a 5 dias úteis',
      rating: 4.7,
      reviews: 54,
      highlight: 'Compra protegida',
      coupon: 'Cupom pode aparecer na página da loja',
      link: 'https://www.google.com/search?q=pe%C3%A7a+certa+pastilha+de+freio',
      sourceType: 'loja',
    },
  ],
};

const partExamples = ['Pastilha de freio', 'Amortecedor dianteiro', 'Filtro de óleo', 'Bateria 60Ah'];

export function PartsResearchTab() {
  const [vehicle, setVehicle] = useState({ brand: 'Toyota', model: 'Corolla', year: '2020', engine: '2.0' });
  const [part, setPart] = useState('Pastilha de freio dianteira');
  const [location, setLocation] = useState('São Paulo, SP');
  const [sortMode, setSortMode] = useState<SortMode>('best');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);

  const searchLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.engine} • ${part}`;

  const offers = useMemo(() => {
    const filtered = catalog.default.filter((offer) => {
      if (freeShippingOnly && offer.shipping > 0) return false;
      if (promoOnly && !offer.oldPrice && !offer.coupon) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'lowest') return a.price + a.shipping - (b.price + b.shipping);
      if (sortMode === 'fastest') return a.delivery.localeCompare(b.delivery);
      return (b.rating * 10 + (b.shipping === 0 ? 2 : 0)) - (a.rating * 10 + (a.shipping === 0 ? 2 : 0));
    });
  }, [freeShippingOnly, promoOnly, sortMode]);

  const totalLowest = Math.min(...catalog.default.map((offer) => offer.price + offer.shipping));
  const totalHighest = Math.max(...catalog.default.map((offer) => offer.price + offer.shipping));
  const savings = totalHighest - totalLowest;

  const runSearch = () => {
    setIsSearching(true);
    window.setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 650);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#101b2d] px-5 py-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[28px] border-[#d71920]/20" />
        <div className="absolute -bottom-32 right-28 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffb4b6]">
            <Sparkles className="h-3.5 w-3.5" /> Agente de pesquisa automotiva
          </div>
          <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Encontre a peça certa antes de pagar mais.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Informe o carro e a peça. O agente organiza três ofertas por preço, frete, prazo e sinais de promoção para você decidir com segurança.</p>
        </div>

        <div className="relative mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-1">
            <span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Marca</span>
            <input value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#ff7a7e]" placeholder="Ex.: Toyota" />
          </label>
          <label className="block lg:col-span-1">
            <span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Modelo</span>
            <input value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="Ex.: Corolla" />
          </label>
          <label className="block">
            <span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ano / motor</span>
            <div className="flex gap-2">
              <input value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} className="h-11 w-20 rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="2020" />
              <input value={vehicle.engine} onChange={(e) => setVehicle({ ...vehicle, engine: e.target.value })} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="2.0" />
            </div>
          </label>
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Peça que você procura</span>
            <input value={part} onChange={(e) => setPart(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="Ex.: amortecedor dianteiro" />
          </label>
          <button onClick={runSearch} disabled={isSearching} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d71920] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-[#ef2930] disabled:cursor-wait disabled:opacity-70 lg:col-span-1">
            <Search className="h-4 w-4" /> {isSearching ? 'Pesquisando...' : 'Pesquisar peças'}
          </button>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <MapPin className="h-3.5 w-3.5" /><span>Entregar em</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-32 border-b border-dashed border-slate-500 bg-transparent px-1 py-0.5 text-slate-200 outline-none focus:border-white" />
          <span className="text-slate-600">•</span><span>Exemplos:</span>
          {partExamples.map((example) => <button key={example} onClick={() => setPart(example)} className="rounded-full border border-white/10 px-2 py-1 hover:border-white/30 hover:text-white">{example}</button>)}
        </div>
      </section>

      {hasSearched && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Busca atual</span><Wrench className="h-4 w-4 text-[#d71920]" /></div><p className="mt-2 truncate text-sm font-bold text-slate-900">{searchLabel}</p><p className="mt-1 text-xs text-slate-500">3 ofertas encontradas</p></div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Economia possível</span><BadgePercent className="h-4 w-4 text-emerald-600" /></div><p className="mt-2 text-2xl font-black tracking-tight text-emerald-900">{formatPrice(savings)}</p><p className="mt-1 text-xs text-emerald-700">entre a maior e a menor oferta</p></div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Atenção ao cupom</span><Tag className="h-4 w-4 text-amber-600" /></div><p className="mt-2 text-sm font-bold text-amber-950">Confirme no checkout</p><p className="mt-1 text-xs text-amber-800">cupons podem depender da conta e do CEP</p></div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d71920]">Comparativo de ofertas</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Escolha pelo custo final, não só pelo anúncio.</h2></div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${showFilters ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><Filter className="h-3.5 w-3.5" /> Filtros <ChevronDown className={`h-3.5 w-3.5 transition ${showFilters ? 'rotate-180' : ''}`} /></button>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><ArrowDownUp className="h-3.5 w-3.5" /><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="bg-transparent outline-none"><option value="best">Melhor equilíbrio</option><option value="lowest">Menor custo final</option><option value="fastest">Entrega mais rápida</option></select></label>
            </div>
          </div>

          {showFilters && <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"><button onClick={() => setFreeShippingOnly(!freeShippingOnly)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${freeShippingOnly ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}><Truck className="h-3.5 w-3.5" /> Frete grátis {freeShippingOnly && <Check className="h-3.5 w-3.5" />}</button><button onClick={() => setPromoOnly(!promoOnly)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${promoOnly ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'}`}><BadgePercent className="h-3.5 w-3.5" /> Com promoção {promoOnly && <Check className="h-3.5 w-3.5" />}</button>{(freeShippingOnly || promoOnly) && <button onClick={() => { setFreeShippingOnly(false); setPromoOnly(false); }} className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500 hover:text-slate-900"><X className="h-3.5 w-3.5" /> limpar</button>}</div>}

          <div className="mt-4 space-y-3">
            {offers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-bold text-slate-900">Nenhuma oferta com esses filtros</p><p className="mt-1 text-sm text-slate-500">Tente remover um filtro para ampliar a pesquisa.</p></div> : offers.map((offer, index) => {
              const finalPrice = offer.price + offer.shipping;
              const isBest = index === 0;
              return <article key={offer.id} className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${isBest ? 'border-[#d71920]/50 ring-1 ring-[#d71920]/10' : 'border-slate-200'}`}>
                {isBest && <div className="absolute right-0 top-0 rounded-bl-xl bg-[#d71920] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">Melhor equilíbrio</div>}
                <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr_auto] lg:items-center">
                  <div className="flex gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${offer.store === 'Mercado Livre' ? 'bg-yellow-300 text-slate-950' : 'bg-slate-100 text-slate-800'}`}>{offer.logo}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-900">{offer.store}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{offer.sourceType === 'marketplace' ? 'Marketplace' : 'Loja especializada'}</span></div><h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">{offer.title}</h3><p className="mt-1 text-xs text-slate-500">{offer.condition} <span className="mx-1">•</span> <span className="text-amber-600">★ {offer.rating}</span> ({offer.reviews})</p></div></div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preço</p><p className="mt-1 text-lg font-black text-slate-950">{formatPrice(offer.price)}</p>{offer.oldPrice && <p className="text-[11px] text-slate-400 line-through">{formatPrice(offer.oldPrice)}</p>}</div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo final</p><p className="mt-1 font-black text-slate-900">{formatPrice(finalPrice)}</p><p className={`text-[11px] font-semibold ${offer.shipping === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{offer.shipping === 0 ? 'Frete grátis' : `+ ${formatPrice(offer.shipping)} frete`}</p></div><div className="col-span-2 sm:col-span-1 lg:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entrega / sinal</p><p className="mt-1 font-semibold text-slate-700">{offer.delivery}</p><p className="text-[11px] text-emerald-600">{offer.highlight}</p></div></div>
                  <div className="flex flex-col items-stretch gap-2 lg:min-w-36"><a href={offer.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#d71920]">Ver anúncio <ExternalLink className="h-3.5 w-3.5" /></a><p className="text-center text-[10px] font-semibold text-slate-400">abre em nova aba</p></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[11px]"><span className="inline-flex items-center gap-1.5 font-semibold text-slate-600"><PackageCheck className="h-3.5 w-3.5 text-emerald-600" /> {offer.highlight}</span>{offer.coupon ? <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700"><Tag className="h-3.5 w-3.5" /> {offer.coupon}</span> : <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500"><Info className="h-3.5 w-3.5" /> Nenhum cupom identificado</span>}</div>
              </article>;
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 sm:flex-row sm:items-start"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div><p className="font-bold">Transparência da pesquisa</p><p className="mt-1 leading-5 text-blue-800">Esta tela está em modo demonstração: os valores e ofertas são exemplos para validar o fluxo. Antes de publicar, conecte APIs oficiais dos marketplaces para preço, estoque, frete e cupons em tempo real. O agente nunca deve afirmar que um cupom existe sem confirmar na loja.</p></div></div>
        </>
      )}
    </div>
  );
}
