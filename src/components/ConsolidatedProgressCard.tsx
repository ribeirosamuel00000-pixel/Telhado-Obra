import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CloudRain,
  Clock,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';
import { RoofProjectSummary } from '../types';

interface ConsolidatedProgressCardProps {
  summary: RoofProjectSummary | null;
  onNavigateToForm?: () => void;
  onNavigateToCalendar?: () => void;
  className?: string;
}

export const ConsolidatedProgressCard: React.FC<ConsolidatedProgressCardProps> = ({
  summary,
  onNavigateToForm,
  onNavigateToCalendar,
  className = '',
}) => {
  const percentTotal = summary?.progressoTotalPercent ?? 38;
  const translucidasInstaladas = summary?.translucidasInstaladas ?? 370;
  const translucidasMeta = summary?.translucidasMeta ?? 1300;
  const translucidasPercent = summary?.translucidasPercent ?? 28.5;

  const fibrocimentoInstaladas = summary?.fibrocimentoInstaladas ?? 147;
  const fibrocimentoMeta = summary?.fibrocimentoMeta ?? 300;
  const fibrocimentoPercent = summary?.fibrocimentoPercent ?? 49.0;

  const totalTelhasInstaladas = translucidasInstaladas + fibrocimentoInstaladas;
  const totalTelhasMeta = translucidasMeta + fibrocimentoMeta; // 1.600 un
  const totalTelhasPercent = Number(((totalTelhasInstaladas / totalTelhasMeta) * 100).toFixed(1));

  const calhasInstaladas = summary?.calhasInstaladas ?? 1600;
  const calhasMeta = summary?.calhasMeta ?? 3600;
  const calhasPercent = summary?.calhasPercent ?? 44.4;

  const linhaVidaInstalada = summary?.linhaVidaInstalada ?? 2000;
  const linhaVidaMeta = summary?.linhaVidaMeta ?? 2000;
  const linhaVidaPercent = summary?.linhaVidaPercent ?? 100;

  const rainDays = summary?.scheduleInfo?.rainDaysCount ?? 10;
  const currentEndDate = summary?.scheduleInfo?.formattedCurrentEndDate ?? '09/11/2026';

  return (
    <div
      className={`bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner: Título da Obra, Status e Cronograma Dinâmico com Chuva */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-[#d71920]/25 border border-red-500/40 rounded-2xl text-red-400 shrink-0 shadow-inner">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Avanço Físico Consolidado da Obra • Cobertura Prédio 4i1
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Dentro do Cronograma Prorrogado
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>Início: <strong className="text-white">17/08/2026</strong></span>
                <span>•</span>
                <span>Prazo Base: <strong className="text-white">75 dias corridos</strong></span>
                <span>•</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-amber-400" />
                  Intempéries &gt; 5mm: <strong>+{rainDays} dias concedidos</strong>
                </span>
                <span>•</span>
                <span>Término Atualizado: <strong className="text-emerald-400 font-black">{currentEndDate}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {onNavigateToCalendar && (
              <button
                onClick={onNavigateToCalendar}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Calendário & Curva S</span>
              </button>
            )}
            {onNavigateToForm && (
              <button
                onClick={onNavigateToForm}
                className="px-4 py-2 rounded-xl bg-[#d71920] hover:bg-[#b9141b] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>+ Novo Apontamento</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal: Destaque do % Consolidado + Telhas Instaladas + Status Linha de Vida */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Coluna 1 (5 colunas): Grande Medidor de Avanço Físico Global (38%) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-red-50/40 rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#d71920]" />
                Percentual Consolidado da Cobertura
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                Ponderado
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-[#d71920] tracking-tight">
                {percentTotal}%
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Executado</span>
                <span className="text-[11px] text-slate-400 font-mono">Meta: 100%</span>
              </div>
            </div>

            {/* Barra de Progresso Sofisticada */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200/80 rounded-full h-4 overflow-hidden border border-slate-300/80 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-[#d71920] to-amber-500 rounded-full transition-all duration-700 relative"
                  style={{ width: `${Math.min(100, Math.max(5, percentTotal))}%` }}
                >
                  <span className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                <span>0% (Início 17/08)</span>
                <span>Meta da Fase Atual</span>
                <span>100% (Conclusão 09/11)</span>
              </div>
            </div>
          </div>

          {/* Nota Técnica da Fórmula de Engenharia */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Critério Ponderado de Cobertura:</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Telhas Translúcidas (peso 45%) • Telhas Fibrocimento (peso 25%) • Calhas e Rufos (peso 30%).
              <strong className="text-slate-700"> A Linha de Vida (100% concluída)</strong> atua como EPC de segurança preventiva (NR-35) e não inflaciona o avanço das telhas.
            </p>
          </div>
        </div>

        {/* Coluna 2 (7 colunas): Telhas Instaladas e Status da Linha de Vida */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Subcard A: Integração de Telhas Instaladas (Translúcidas + Fibrocimento) */}
          <div className="bg-slate-50/90 rounded-2xl p-4.5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Telhas Instaladas no Fechamento Superior
                </h4>
              </div>
              <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-white text-slate-900 border border-slate-200 shadow-2xs">
                {totalTelhasInstaladas} de {totalTelhasMeta} un ({totalTelhasPercent}%)
              </span>
            </div>

            {/* 2 Telhas em Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Telhas Translúcidas */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">
                    Telhas Translúcidas UV
                  </span>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                    {translucidasPercent}%
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {translucidasInstaladas}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {translucidasMeta} un</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, translucidasPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Peso no projeto: 45%
                </span>
              </div>

              {/* Telhas Fibrocimento */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">
                    Telhas de Fibrocimento
                  </span>
                  <span className="text-[10px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                    {fibrocimentoPercent}%
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {fibrocimentoInstaladas}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {fibrocimentoMeta} un</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, fibrocimentoPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Peso no projeto: 25%
                </span>
              </div>
            </div>
          </div>

          {/* Subcard B: Status da Linha de Vida (NR-35) e Calhas Pluviais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status da Linha de Vida NR-35 */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border-2 border-emerald-300/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Linha de Vida NR-35
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs font-mono">
                    100% Concluído
                  </span>
                </div>

                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-950 font-mono">
                    {linhaVidaInstalada}m
                  </span>
                  <span className="text-xs text-emerald-700 font-mono">/ {linhaVidaMeta}m lineares</span>
                </div>

                <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Laudo de Ancoragem Ativo
                </span>
                <span className="text-emerald-700 font-semibold">Trabalho Liberado</span>
              </div>
            </div>

            {/* Calhas & Rufos Pluviais */}
            <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                    Calhas & Rufos
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                    {calhasPercent}%
                  </span>
                </div>

                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {calhasInstaladas}m
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ {calhasMeta}m lineares</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, calhasPercent)}%` }}
                  />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-600">
                  Drenagem pluvial ativa
                </span>
                <span className="text-blue-700 font-bold font-mono">
                  {calhasMeta - calhasInstaladas}m restantes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Droplets(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  );
}
