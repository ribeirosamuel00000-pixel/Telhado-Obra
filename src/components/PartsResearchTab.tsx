import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp, BadgePercent, Check, ChevronDown, ExternalLink, Filter,
  Info, MapPin, PackageCheck, Search, ShieldCheck, Sparkles, Tag, Truck,
  Wrench, X,
} from 'lucide-react';
import { api, PartsSearchResponse, PartsSearchOffer } from '../services/api';

type SortMode = 'best' | 'lowest';
const partExamples = ['Pastilha de freio', 'Amortecedor dianteiro', 'Filtro de óleo', 'Bateria 60Ah'];
const formatPrice = (value: number | null) => value == null ? 'Consulte' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PartsResearchTab() {
  const [vehicle, setVehicle] = useState({ brand: 'Toyota', model: 'Corolla', year: '2020', engine: '2.0' });
  const [part, setPart] = useState('Pastilha de freio dianteira');
  const [location, setLocation] = useState('São Paulo, SP');
  const [sortMode, setSortMode] = useState<SortMode>('best');
  const [result, setResult] = useState<PartsSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offers = useMemo(() => {
    const filtered = (result?.offers || []).filter((offer) => {
      if (freeShippingOnly && offer.shipping !== 0) return false;
      if (promoOnly && !offer.oldPrice && !offer.coupon) return false;
      return true;
    });
    return [...filtered].sort((a, b) => sortMode === 'lowest'
      ? (a.price ?? Infinity) + (a.shipping ?? 0) - ((b.price ?? Infinity) + (b.shipping ?? 0))
      : (b.price ?? -1) - (a.price ?? -1));
  }, [result, freeShippingOnly, promoOnly, sortMode]);

  const searchLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.engine} • ${part}`;
  const totalPrices = offers.map((o) => o.price == null ? null : o.price + (o.shipping || 0)).filter((v): v is number => v !== null);
  const savings = totalPrices.length > 1 ? Math.max(...totalPrices) - Math.min(...totalPrices) : null;

  const runSearch = async () => {
    if (!vehicle.brand || !vehicle.model || !vehicle.year || !part) {
      setError('Preencha marca, modelo, ano e peça para pesquisar.');
      return;
    }
    setIsSearching(true); setError(null);
    try {
      const data = await api.searchParts({ ...vehicle, part, location });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível consultar as ofertas agora.');
    } finally { setIsSearching(false); }
  };

  const updateVehicle = (key: keyof typeof vehicle, value: string) => setVehicle((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#101b2d] px-5 py-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[28px] border-[#d71920]/20" />
        <div className="relative max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffb4b6]"><Sparkles className="h-3.5 w-3.5" /> Agente de pesquisa automotiva</div>
          <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Encontre a peça certa antes de pagar mais.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Informe o carro e a peça. O agente busca até três anúncios comparáveis, mostra o link original e separa o que foi confirmado do que precisa ser validado na loja.</p>
        </div>
        <div className="relative mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 sm:grid-cols-2 lg:grid-cols-5">
          {(['brand', 'model'] as const).map((key) => <label key={key} className="block"><span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{key === 'brand' ? 'Marca' : 'Modelo'}</span><input value={vehicle[key]} onChange={(e) => updateVehicle(key, e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" /></label>)}
          <label className="block"><span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ano / motor</span><div className="flex gap-2"><input value={vehicle.year} onChange={(e) => updateVehicle('year', e.target.value)} className="h-11 w-20 rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" /><input value={vehicle.engine} onChange={(e) => updateVehicle('engine', e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="2.0" /></div></label>
          <label className="block sm:col-span-2 lg:col-span-1"><span className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Peça que você procura</span><input value={part} onChange={(e) => setPart(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#ff7a7e]" placeholder="Ex.: amortecedor dianteiro" /></label>
          <button onClick={runSearch} disabled={isSearching} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d71920] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-[#ef2930] disabled:cursor-wait disabled:opacity-70"><Search className="h-4 w-4" /> {isSearching ? 'Pesquisando...' : 'Pesquisar peças'}</button>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400"><MapPin className="h-3.5 w-3.5" /><span>Entregar em</span><input value={location} onChange={(e) => setLocation(e.target.value)} className="w-32 border-b border-dashed border-slate-500 bg-transparent px-1 py-0.5 text-slate-200 outline-none focus:border-white" /><span className="text-slate-600">•</span><span>Exemplos:</span>{partExamples.map((example) => <button key={example} onClick={() => setPart(example)} className="rounded-full border border-white/10 px-2 py-1 hover:border-white/30 hover:text-white">{example}</button>)}</div>
      </section>

      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
      {result && <>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Busca atual</span><Wrench className="h-4 w-4 text-[#d71920]" /></div><p className="mt-2 truncate text-sm font-bold text-slate-900">{searchLabel}</p><p className="mt-1 text-xs text-slate-500">{result.offers.length} ofertas retornadas</p></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Economia possível</span><BadgePercent className="h-4 w-4 text-emerald-600" /></div><p className="mt-2 text-2xl font-black tracking-tight text-emerald-900">{formatPrice(savings)}</p><p className="mt-1 text-xs text-emerald-700">calculada só sobre preços confirmados</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Atenção ao cupom</span><Tag className="h-4 w-4 text-amber-600" /></div><p className="mt-2 text-sm font-bold text-amber-950">{result.couponNote}</p><p className="mt-1 text-xs text-amber-800">cupons dependem de conta, região e checkout</p></div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d71920]">Comparativo de ofertas</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Escolha pelo custo final, não só pelo anúncio.</h2></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Filter className="h-3.5 w-3.5" /> Filtros <ChevronDown className={`h-3.5 w-3.5 ${showFilters ? 'rotate-180' : ''}`} /></button><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><ArrowDownUp className="h-3.5 w-3.5" /><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="bg-transparent outline-none"><option value="best">Mais relevante</option><option value="lowest">Menor custo</option></select></label></div></div>
        {showFilters && <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"><button onClick={() => setFreeShippingOnly(!freeShippingOnly)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${freeShippingOnly ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}><Truck className="h-3.5 w-3.5" /> Frete grátis {freeShippingOnly && <Check className="h-3.5 w-3.5" />}</button><button onClick={() => setPromoOnly(!promoOnly)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${promoOnly ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'}`}><BadgePercent className="h-3.5 w-3.5" /> Com promoção {promoOnly && <Check className="h-3.5 w-3.5" />}</button>{(freeShippingOnly || promoOnly) && <button onClick={() => { setFreeShippingOnly(false); setPromoOnly(false); }} className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500"><X className="h-3.5 w-3.5" /> limpar</button>}</div>}
        <div className="mt-4 space-y-3">{offers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-bold text-slate-900">A fonte não retornou ofertas estruturadas</p><p className="mt-1 text-sm text-slate-500">Abra uma busca externa para consultar anúncios atuais sem usar preço inventado.</p><div className="mt-4 flex flex-wrap justify-center gap-2">{result.externalSearchLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-[#d71920]">{item.label} <ExternalLink className="h-3.5 w-3.5" /></a>)}</div></div> : offers.map((offer, index) => <OfferCard key={offer.id} offer={offer} isBest={index === 0} />)}</div>
        <div className="mt-6 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div><p className="font-bold">Transparência da pesquisa</p><p className="mt-1 leading-5 text-blue-800">Fonte: {result.source}. Preços, frete e disponibilidade podem mudar. O agente não afirma que existe cupom sem confirmação no anúncio ou checkout.</p></div></div>
      </>}
    </div>
  );
}

function OfferCard({ offer, isBest }: { offer: PartsSearchOffer; isBest: boolean }) {
  const finalPrice = offer.price == null ? null : offer.price + (offer.shipping || 0);
  return <article className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${isBest ? 'border-[#d71920]/50 ring-1 ring-[#d71920]/10' : 'border-slate-200'}`}>{isBest && <div className="absolute right-0 top-0 rounded-bl-xl bg-[#d71920] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">Mais relevante</div>}<div className="grid gap-4 lg:grid-cols-[1.35fr_1fr_auto] lg:items-center"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-xs font-black text-slate-950">ML</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-900">{offer.store}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{offer.condition}</span></div><h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">{offer.title}</h3><p className="mt-1 text-xs text-slate-500">{offer.shipping === 0 ? 'Frete grátis informado pela fonte' : 'Frete calculado na página da loja'}</p></div></div><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preço</p><p className="mt-1 text-lg font-black text-slate-950">{formatPrice(offer.price)}</p>{offer.oldPrice && <p className="text-[11px] text-slate-400 line-through">{formatPrice(offer.oldPrice)}</p>}</div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo final</p><p className="mt-1 font-black text-slate-900">{formatPrice(finalPrice)}</p><p className="text-[11px] text-slate-500">{offer.shipping === 0 ? 'Frete grátis' : 'frete no checkout'}</p></div></div><div className="flex flex-col items-stretch gap-2 lg:min-w-36"><a href={offer.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-[#d71920]">Ver anúncio <ExternalLink className="h-3.5 w-3.5" /></a><p className="text-center text-[10px] font-semibold text-slate-400">abre em nova aba</p></div></div><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[11px]"><span className="inline-flex items-center gap-1.5 font-semibold text-slate-600"><PackageCheck className="h-3.5 w-3.5 text-emerald-600" /> {offer.highlight}</span><span className="inline-flex items-center gap-1.5 font-semibold text-amber-700"><Tag className="h-3.5 w-3.5" /> {offer.coupon || 'Cupom não confirmado — verificar no checkout'}</span></div></article>;
}
