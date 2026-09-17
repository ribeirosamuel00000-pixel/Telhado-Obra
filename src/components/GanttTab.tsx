import React, { useState, useRef } from 'react';
import { ConstructionData } from '../types';
import {
  CalendarDays,
  Target,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Flag,
  ChevronRight,
  PlusCircle,
  Download,
  Calendar,
} from 'lucide-react';

interface GanttTabProps {
  projectData: ConstructionData;
  onOpenReportModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const GanttTab: React.FC<GanttTabProps> = ({
  projectData,
  onOpenReportModal,
  onNavigateTab,
}) => {
  const [scale, setScale] = useState<'weeks' | 'days'>('weeks');
  const [filterCategory, setFilterCategory] = useState<'all' | 'telhado' | 'calhas' | 'inspecao'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToToday = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 320, behavior: 'smooth' });
    }
  };

  const tasks = [
    {
      id: '1',
      title: '1. Mobilização, Vistoria & NR-35',
      dates: '10/Mar - 21/Mar (100%)',
      startCol: 0,
      spanCols: 2,
      progress: 100,
      color: 'bg-slate-700',
      category: 'inspecao',
      milestone: 'Marco: Linhas de Vida NR-35 Liberadas',
    },
    {
      id: '2',
      title: '2. Item 3.1: Telhas Fibrocimento (NBR 15210)',
      dates: '22/Mar - 25/Abr (72%)',
      startCol: 2,
      spanCols: 5,
      progress: 72,
      color: 'bg-[#d71920]',
      category: 'telhado',
      sublabel: '28% Restante',
    },
    {
      id: '3',
      title: '3. Item 3.2: Telhas Translúcidas Policarbonato UV',
      dates: '05/Abr - 02/Mai (65%)',
      startCol: 3.5,
      spanCols: 4.5,
      progress: 65,
      color: 'bg-[#ae0011]',
      category: 'telhado',
      sublabel: 'Iluminação Zenital • Atraso Fornecedor',
    },
    {
      id: '4',
      title: '4. Item 3.3: Manutenção de Calhas & Rufos',
      dates: '14/Abr - 09/Mai (70%)',
      startCol: 5,
      spanCols: 4,
      progress: 70,
      color: 'bg-amber-600',
      category: 'calhas',
      sublabel: 'Tratamento Poliuretano PU-40',
      milestone: 'Marco: Teste Chuva Artificial',
    },
    {
      id: '5',
      title: '5. Desmobilização & Aceite Definitivo',
      dates: '10/Mai - 20/Mai (0%)',
      startCol: 8.5,
      spanCols: 1.5,
      progress: 0,
      color: 'bg-slate-300',
      category: 'inspecao',
      sublabel: 'Aguardando',
    },
  ];

  const filteredTasks = tasks.filter((t) => filterCategory === 'all' || t.category === filterCategory);

  return (
    <div className="flex flex-col w-full pb-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* 1. TOP SUMMARY & STATS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#d71920] text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Cronograma Executivo EAP
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#d71920] animate-ping" />
            <span className="font-mono text-xs font-bold text-slate-900">
              SEM 06 / 10
            </span>
          </div>
        </div>

        {/* Quick Stats Bento Strip */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Avanço Físico</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#d71920]">
                {projectData.physicalProgress}
              </span>
              <span className="font-mono text-xs text-slate-500">%</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Previsto: 71.0%</span>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Dias Úteis</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">42</span>
              <span className="font-mono text-xs text-slate-500">/ 60</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Término: 20/Mai</span>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Segurança</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-600">100</span>
              <span className="font-mono text-xs text-slate-500">%</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">NR-35 Vigente</span>
          </div>
        </div>
      </div>

      {/* 2. CONTROL TOOLBAR */}
      <div className="flex flex-col gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Scale Segmented Switch */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-slate-600">
            <button
              onClick={() => setScale('weeks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scale === 'weeks' ? 'bg-[#d71920] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semanas (S1-S10)
            </button>
            <button
              onClick={() => setScale('days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scale === 'days' ? 'bg-[#d71920] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dias (Diário)
            </button>
          </div>

          {/* Quick Jump to Today */}
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold cursor-pointer"
          >
            <Target className="w-4 h-4 text-[#d71920]" />
            <span>Hoje (Semana 06)</span>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Fases ({tasks.length})
          </button>
          <button
            onClick={() => setFilterCategory('telhado')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterCategory === 'telhado'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Equipe Telhado
          </button>
          <button
            onClick={() => setFilterCategory('calhas')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterCategory === 'calhas'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Calhas & Rufos
          </button>
          <button
            onClick={() => setFilterCategory('inspecao')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterCategory === 'inspecao'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vistoria / Aceite
          </button>
        </div>
      </div>

      {/* 3. INTERACTIVE GANTT TIMELINE CANVAS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estrutura Analítica da Obra (WBS)
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">Savoy-CP-2025</span>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto relative rounded-xl bg-slate-50 p-3 sm:p-4 border border-slate-200/70"
        >
          <div className="min-w-[720px] relative">
            {/* Header Columns Weeks 1-10 */}
            <div className="grid grid-cols-10 text-center font-mono text-xs pb-3 border-b border-slate-200 text-slate-600">
              {[
                { w: 'SEM 01', d: '10/Mar' },
                { w: 'SEM 02', d: '17/Mar' },
                { w: 'SEM 03', d: '24/Mar' },
                { w: 'SEM 04', d: '31/Mar' },
                { w: 'SEM 05', d: '07/Abr' },
                { w: 'SEM 06', d: '14/Abr', active: true },
                { w: 'SEM 07', d: '21/Abr' },
                { w: 'SEM 08', d: '28/Abr' },
                { w: 'SEM 09', d: '05/Mai' },
                { w: 'SEM 10', d: '12/Mai' },
              ].map((col, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center py-1 rounded-lg ${
                    col.active ? 'bg-red-50 text-[#d71920] font-bold border border-red-200' : ''
                  }`}
                >
                  <span className={col.active ? 'text-[#d71920] font-bold' : 'text-slate-800'}>{col.w}</span>
                  <span className="text-[10px] text-slate-400">{col.d}</span>
                </div>
              ))}
            </div>

            {/* Background Grid Lines & Vertical Marker */}
            <div className="relative mt-3 space-y-4 pt-1">
              {/* Vertical TODAY marker inside week 6 */}
              <div
                className="absolute top-0 bottom-0 left-[55%] w-0.5 bg-[#d71920] z-20 pointer-events-none flex flex-col items-center"
                style={{ transform: 'translateX(-50%)' }}
              >
                <span className="px-1.5 py-0.5 rounded-full bg-[#d71920] text-white text-[9px] font-mono font-bold shadow-md -translate-y-2.5">
                  HOJE
                </span>
              </div>

              {/* Tasks */}
              {filteredTasks.map((t) => {
                const leftPercent = (t.startCol / 10) * 100;
                const widthPercent = (t.spanCols / 10) * 100;

                return (
                  <div key={t.id} className="relative z-10 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-sm">{t.title}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{t.dates}</span>
                    </div>

                    <div className="w-full h-8 bg-slate-200/70 rounded-lg relative flex items-center overflow-hidden border border-slate-300/50">
                      <div
                        className="absolute h-full flex items-center rounded-md overflow-hidden bg-slate-300 shadow-xs"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        {/* Executed colored portion */}
                        <div
                          className={`h-full ${t.color} flex items-center px-2 text-white font-mono text-xs font-bold transition-all`}
                          style={{ width: `${t.progress}%` }}
                        >
                          {t.progress > 0 && `${t.progress}%`}
                        </div>
                        {t.sublabel && (
                          <span className="font-sans text-[10px] text-slate-600 pl-2 truncate font-medium">
                            {t.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {t.milestone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-2">
                        <Flag className="w-3 h-3 text-[#d71920]" />
                        <span>{t.milestone}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700" />
            <span>Concluído (100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#d71920]" />
            <span>Em Andamento (SANY)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600" />
            <span>Atenção / Calhas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span>Não Iniciado</span>
          </div>
        </div>
      </div>

      {/* 4. INSPECTION PHOTO FEED */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Evidências de Campo (Campinas)</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Inspeções Fotográficas Recentes</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Savoy Pavilhão A</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
            <div className="relative h-32 w-full">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbaSUqSoBlQJHgk4BZjGc-ZILWMkd3UuFCRTOwEhiPJRD-3lI-jWGbt7ILkhzoAdTU9UypR4KaUxO1vKuVv9ciHtQKI4MHMI0vszXPsDX_whg8ozjcDIeLy58cFRQP0YLhyoA5k7urcKDUvy8UUClWjzU4HIExIuNN3JXyG2qPLbJjf89up-8swQT7HUnmupRUwsTsQTxdm_2qpmY2MCLTU8ECpELiRC4C52Zw7PZ2fbAOFMeigREL"
                alt="Item 3.1 Telhas Fibrocimento"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded font-mono text-[10px]">
                Item 3.1: 72%
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-slate-900">Telhas NBR 15210</p>
              <p className="text-[11px] text-slate-500">Fixações autobrocantes inox sem amianto</p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
            <div className="relative h-32 w-full">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIaZ0dBIksxw7QJW1lstqIW24I3DUpd0mXq3VSvFtOJ2ILUapG6Lm6XIdMFYL3o7_iG5XA5ymmTMzrI0N5suhUjtRdpfambdzuVtJEUUKfwpULDJqDISXqQIK1v2cCde0nnPcGNYh4FQpDtWsV4pdtkbmoosyvRJUhsD9eqWnjf-16E7hUEODy5K39JDm_mQVDwtQCRq_nyoxEzFsg0RN85PjKaqjYiC7Y_ivNvEo72mXJDEs-4384"
                alt="Item 3.2 Telhas Translúcidas UV"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-[#d71920] text-white px-2 py-0.5 rounded font-mono text-[10px]">
                Item 3.2: 65%
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-slate-900">Translúcidas UV</p>
              <p className="text-[11px] text-slate-500">Ganho lumínico 450 lux • Aguardando remessa complementar</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MARCOS DE ACEITAÇÃO CONTRATUAL */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#d71920]" />
            <span>Marcos de Aceitação Contratual</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Turnkey Savoy</span>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-3 border border-slate-200/60">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">Vistoria Prévia & Linhas de Vida NR-35</p>
                <span className="font-mono text-xs text-slate-700 font-bold">21/Mar</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">ART recolhida, tração de cabos e pontos de ancoragem certificados.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-3 border border-slate-200/60">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">Teste de Estanqueidade com Chuva Artificial</p>
                <span className="font-mono text-xs text-amber-700 font-bold">09/Mai</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Pressurização de bicos aspersores sobre rufos e calhas centrais.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-3 border border-slate-200/60">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">Emissão do Termo de Aceite Definitivo (PAC)</p>
                <span className="font-mono text-xs text-slate-500 font-bold">20/Mai</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Entrega das garantias estruturais Savoy e laudo de as-built.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Action Triggers */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigateTab('campo')}
          className="flex-1 py-3 px-4 rounded-xl bg-[#d71920] hover:bg-[#b9141b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apontamento Diário</span>
        </button>
        <button
          onClick={onOpenReportModal}
          className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
          title="Exportar Relatório EAP (PDF)"
        >
          <Download className="w-5 h-5 text-[#d71920]" />
        </button>
      </div>
    </div>
  );
};
