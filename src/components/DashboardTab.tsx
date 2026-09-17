import React, { useState, useEffect } from 'react';
import { ConstructionData, RoofProjectSummary } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  Calendar,
  Shield,
  TrendingDown,
  Sun,
  Sliders,
  FileText,
  BadgeCheck,
  Bot,
  MessageSquare,
  Mail,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Wind,
  CloudRain,
  Truck,
  Eye,
  Layers,
} from 'lucide-react';

interface DashboardTabProps {
  projectData: ConstructionData;
  onNavigateTab: (tab: string) => void;
  onOpenAIModal: () => void;
  onOpenReportModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  projectData,
  onNavigateTab,
  onOpenAIModal,
  onOpenReportModal,
}) => {
  const pendingAction = projectData?.pendingActions?.[0];
  const [roofSummary, setRoofSummary] = useState<RoofProjectSummary | null>(
    projectData?.roofSummary || null
  );

  useEffect(() => {
    api.getRoofSummary()
      .then((data) => {
        if (data) setRoofSummary(data);
      })
      .catch((err) => {
        console.error('Erro ao carregar resumo de cobertura no dashboard:', err);
      });
  }, []);

  return (
    <div className="flex flex-col w-full pb-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* 1. Operational Context Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Obra Turnkey Industrial
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#191c20] tracking-tight truncate">
              {projectData.projectName}
            </h1>
            <span className="text-xs text-slate-500 font-medium">
              {projectData.location} • Contrato {projectData.contractNumber}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-mono text-xs font-bold shrink-0 flex items-center gap-1.5 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-[#d71920] animate-ping" />
            <span>{projectData.deviationPercent > 0 ? `+${projectData.deviationPercent}` : projectData.deviationPercent}% DESVIO</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold truncate">
              {projectData.generalEngineer} ({projectData.creaNumber})
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-xs text-slate-900">
            <span className="text-slate-500">Geral:</span>
            <strong className="text-[#d71920] font-bold">{projectData.physicalProgress}%</strong>
          </div>
        </div>

        {/* Global Progress Bar Realized vs Planned */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium">Avanço Físico Consolidado</span>
            <span className="text-slate-900 font-mono font-bold">
              {projectData.physicalProgress}% de {projectData.plannedProgress}% meta
            </span>
          </div>
          <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            {/* Planned gray marker */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-slate-400/50 rounded-full"
              style={{ width: `${projectData.plannedProgress}%` }}
            />
            {/* Realized red bar */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#d71920] rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${projectData.physicalProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-0.5">
            <span>0%</span>
            <span className="text-[#d71920] font-semibold">• Realizado {projectData.physicalProgress}%</span>
            <span>Planejado {projectData.plannedProgress}% | 100%</span>
          </div>
        </div>
      </div>

      {/* 2. PROACTIVE ASSISTENTE SAMUEL APONTAMENTOS & APPROVAL BANNER */}
      {pendingAction && (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#d71920] flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-200 font-mono tracking-wider uppercase">
                  Assistente Samuel • Apontamentos de Obra & Gestão
                </span>
                {pendingAction.status === 'pending_approval' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                    Aguardando Aprovação de Samuel Ribeiro de Souza
                  </span>
                )}
                {pendingAction.status === 'approved' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    Aprovado por Samuel • Pronto para Envio
                  </span>
                )}
                {pendingAction.status === 'email_sent' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                    E-mail Despachado ao Fornecedor
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
                {pendingAction.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Atraso de {projectData.delayDays} dias úteis detectado na entrega de telhas translúcidas. Alinhamento no WhatsApp (12) 99870-7590.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={onOpenAIModal}
              className="flex-1 md:flex-initial py-2.5 px-4 rounded-xl bg-[#d71920] hover:bg-[#b9141b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Consultar Assistente Samuel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Key Performance Indicators (Bento Grid 2x2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Prazo */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cronograma</span>
            <Calendar className="w-4 h-4 text-[#d71920]" />
          </div>
          <div className="my-2">
            <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              Sem 06<span className="text-slate-400 font-normal text-sm">/10</span>
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-0.5">
              Término: <span className="text-emerald-700 font-bold">{roofSummary?.scheduleInfo?.formattedCurrentEndDate || projectData.plannedCompletionDate}</span>
            </div>
            {roofSummary?.scheduleInfo?.rainDaysCount ? (
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                +{roofSummary.scheduleInfo.rainDaysCount} dias por chuvas (&gt;5mm)
              </div>
            ) : null}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-slate-700 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Segurança</span>
            <Shield className="w-4 h-4 text-[#d71920]" />
          </div>
          <div className="my-2">
            <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              0 <span className="text-xs font-semibold text-slate-500 font-sans">Acidentes</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">NR-35 100% válida</div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] text-center font-bold border border-emerald-200">
            Grau Risco 0 • Seguro
          </div>
        </div>

        {/* Curva S (Físico) */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Curva S (Físico)</span>
            <TrendingDown className="w-4 h-4 text-[#d71920]" />
          </div>
          <div className="my-2">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#d71920]">
              {projectData.physicalProgress}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Previsto: {projectData.plannedProgress}%</div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#d71920] font-bold">
            <span>▼</span>
            <span>Atraso de {projectData.delayDays} dias úteis</span>
          </div>
        </div>

        {/* Condições Climáticas */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Campinas/SP</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2">
            <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              {projectData.weather.temperature}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Vento: {projectData.weather.wind}</div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] text-center font-medium">
            {projectData.weather.safeForAltitudeWork ? 'Apto trabalho altura' : 'Atenção rajadas'}
          </div>
        </div>
      </div>

      {/* 4. Avanço Físico de Cobertura e Metragens (Fibrocimento, Translúcidas, Calhas e Linha de Vida) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-50 text-[#d71920]">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Avanço Físico de Cobertura • Metragens e Porcentagens
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores acumulados e porcentagem em relação ao total contratado (Pavilhão 4i1 Savoy)
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('telhado')}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <span>Acessar Diário de Obra</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Cards Bento: Fibrocimento, Translúcidas, Calhas, Linha de Vida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Fibrocimento */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Telhas Fibrocimento
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {roofSummary?.fibrocimentoPercent ?? 32.3}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {roofSummary?.fibrocimentoInstaladas ?? 97}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  / {roofSummary?.fibrocimentoMeta ?? 300} unidades
                </span>
              </div>
            </div>

            <div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-800 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, roofSummary?.fibrocimentoPercent ?? 32.3)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>Porcentagem do total:</span>
                <span className="font-bold text-slate-800">{roofSummary?.fibrocimentoPercent ?? 32.3}%</span>
              </div>
            </div>
          </div>

          {/* 2. Translúcidas */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#d71920] uppercase tracking-wider">
                  Telhas Translúcidas
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 text-[#d71920]">
                  {roofSummary?.translucidasPercent ?? 21.5}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {roofSummary?.translucidasInstaladas ?? 280}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  / {roofSummary?.translucidasMeta ?? 1300} unidades
                </span>
              </div>
            </div>

            <div>
              <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#d71920] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, roofSummary?.translucidasPercent ?? 21.5)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>Porcentagem do total:</span>
                <span className="font-bold text-[#d71920]">{roofSummary?.translucidasPercent ?? 21.5}%</span>
              </div>
            </div>
          </div>

          {/* 3. Calhas */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Metragem de Calhas
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {roofSummary?.calhasPercent ?? 2.8}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {roofSummary?.calhasInstaladas ?? 100}m
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  / {roofSummary?.calhasMeta ?? 3600}m lineares
                </span>
              </div>
            </div>

            <div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, roofSummary?.calhasPercent ?? 2.8))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>Meta contratada: 3.600m</span>
                <span className="font-bold text-blue-700">{roofSummary?.calhasPercent ?? 2.8}%</span>
              </div>
            </div>
          </div>

          {/* 4. Linha de Vida */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Linha de Vida (NR-35)
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {roofSummary?.linhaVidaPercent ?? 100}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900">
                  {roofSummary?.linhaVidaInstalada ?? 2000}m
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  / {roofSummary?.linhaVidaMeta ?? 2000}m lineares
                </span>
              </div>
            </div>

            <div>
              <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, roofSummary?.linhaVidaPercent ?? 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>Meta contratada: 2.000m</span>
                <span className="font-bold text-emerald-700">{roofSummary?.linhaVidaPercent ?? 100}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Progresso por Subsistema (Breakdown) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Progresso por Subsistema</h2>
            <p className="text-xs text-slate-500">Mapeamento estrutural de cobertura NBR</p>
          </div>
          <Sliders className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-3">
          {(projectData?.subsystems || []).map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-xl border transition-all ${
                sub.status === 'delayed'
                  ? 'bg-red-50/40 border-red-200'
                  : 'bg-slate-50/70 border-slate-200/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#d71920]">{sub.itemCode}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{sub.name}</span>
                    {sub.status === 'delayed' && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.2 rounded-full">
                        Atraso de Fornecedor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{sub.norm}</p>
                </div>
                <span className="font-mono text-lg font-bold text-slate-900">{sub.progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.status === 'delayed' ? 'bg-[#d71920]' : 'bg-slate-800'
                    }`}
                    style={{ width: `${sub.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 mt-0.5">
                  <span className="text-slate-700 font-medium">
                    Executado: {sub.executedValue.toLocaleString('pt-BR')} {sub.unit}
                  </span>
                  <span>Meta: {sub.totalValue.toLocaleString('pt-BR')} {sub.unit}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2 font-medium">{sub.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Construction Field Visual Evidence */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Registro Fotográfico Técnico</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Frente Operacional Savoy</h3>
          </div>
          <span className="font-mono text-xs text-slate-500">HOJE 10:45</span>
        </div>

        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-800 shadow-inner">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBubuoBg3DpVToBUzWwmYgjrsNWhZtKMvQ065Y-EZnF8PiRqkxPcgALH00aCrBGSUsKObJ1gdrxLKtxsm-Kg3YoQPgR8IkJW8gBy6aMr-56CQaS7QLv5HFCQbRcKsoXAKNXXKTQbR9G44yk4xPXBIvLwTuM01jci6hn5rKa0GCaFtVw86HwepR5U2Jd6NqghdLeQFDaRAqIRzErKvdPlgoD3v4conCTgVXfFL7Q8uncdH-cyKs65GV9"
            alt="Frente Operacional Savoy Campinas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
            <div className="flex items-center justify-between w-full text-white">
              <span className="text-xs font-semibold">Içamento de fardos de telhas via Linha de Vida</span>
              <span className="px-2 py-0.5 rounded bg-[#d71920] text-white font-mono text-[11px] font-bold uppercase">
                SAVOY-ROOF-06
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Operational Alerts & Site Dispatch */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#d71920]" />
          <h3 className="text-base font-bold text-slate-900">Alertas de Atenção em Campo</h3>
        </div>

        <div className="space-y-2.5">
          {/* Weather Alert */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <CloudRain className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-bold text-slate-900">Alerta Meteorológico Sexta-Feira</span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-200 px-2 py-0.2 rounded font-semibold">
                  Risco Chuva
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Previsão de rajadas de vento &gt; 35km/h a partir das 14h. Necessário antecipar o fechamento de vãos abertos e lonamento provisório.
              </p>
            </div>
          </div>

          {/* Munck Truck Alert */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-[#d71920]">
              <Truck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-bold text-slate-900">Caminhão Munck SANY Liberado</span>
                <span className="text-[10px] font-mono text-slate-700 bg-slate-200 px-2 py-0.2 rounded font-semibold">
                  Logística
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                PAT e ART de operação validadas pelo SESMT. Içamento dos paletes de telhas translúcidas agendado para amanhã às 07:30.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => onNavigateTab('semanal')}
          className="flex-1 h-12 bg-[#d71920] hover:bg-[#b9141b] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Atualizar Medição Semanal</span>
        </button>

        <button
          onClick={onOpenReportModal}
          className="flex-1 h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-4 h-4 text-[#d71920]" />
          <span>Exportar Relatório Gerencial (PDF)</span>
        </button>

        <button
          onClick={onOpenAIModal}
          className="h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Agente IA</span>
        </button>
      </div>
    </div>
  );
};
