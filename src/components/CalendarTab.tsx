import React, { useState, useEffect, useMemo } from 'react';
import { CalendarTask, ProjectScheduleInfo, RoofDailyReport } from '../types';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Layers,
  Filter,
  Trash2,
  CalendarDays,
  Sun,
  ShieldCheck,
  CloudRain,
  Droplets,
  Share2,
  Copy,
  MessageSquare,
} from 'lucide-react';

export function CalendarTab() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-15');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isRainModalOpen, setIsRainModalOpen] = useState(false);
  const [roofReports, setRoofReports] = useState<RoofDailyReport[]>([]);
  const [scheduleInfo, setScheduleInfo] = useState<ProjectScheduleInfo | null>(null);
  const [rainAlertModal, setRainAlertModal] = useState<{
    show: boolean;
    rainVolume: number;
    date: string;
    scheduleInfo?: ProjectScheduleInfo;
    whatsappMessage: string;
  } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Quick Rain Log Form State
  const [rainData, setRainData] = useState({
    date: '2026-09-15',
    volumeMm: 15,
    period: 'dia_inteiro' as 'manha' | 'tarde' | 'noite' | 'dia_inteiro',
    paralyzedWork: true,
    notes: 'Precipitação registrada no canteiro Savoy. Trabalho em altura paralisado por NR-35.',
  });

  // New Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'translúcida' as CalendarTask['category'],
    date: '2026-09-15',
    startTime: '08:00',
    endTime: '12:00',
    priority: 'media' as 'alta' | 'media' | 'baixa',
    responsible: 'Vanderlei Encarregado & Equipe',
    notes: '',
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [data, rainRes, reports] = await Promise.all([
        api.getCalendarTasks(),
        api.getRainWhatsAppMessage().catch(() => null),
        api.getRoofReports().catch(() => []),
      ]);
      setTasks(data);
      setRoofReports(reports || []);
      if (rainRes?.scheduleInfo) {
        setScheduleInfo(rainRes.scheduleInfo);
      }
    } catch (err) {
      console.error('Erro ao carregar tarefas do calendário:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map of reports indexed by date string (YYYY-MM-DD)
  const reportsByDate = useMemo(() => {
    const map = new Map<string, RoofDailyReport>();
    for (const r of roofReports) {
      map.set(r.dataPreenchimento, r);
    }
    return map;
  }, [roofReports]);

  // Prazo do fornecedor de serviço em verde: do início (17/08/2026) até o prazo final estendido por chuva
  const isProviderDeadline = (dayStr: string) => {
    const start = scheduleInfo?.contractStartDate || '2026-08-17';
    const end = scheduleInfo?.currentEndDate || '2026-11-06';
    return dayStr >= start && dayStr <= end;
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      const res = await api.toggleCalendarTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    } catch (err) {
      console.error('Erro ao alternar tarefa:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Deseja realmente remover esta tarefa do calendário?')) return;
    try {
      await api.deleteCalendarTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Erro ao remover tarefa:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.date) return;
    try {
      const res = await api.createCalendarTask(newTask);
      setTasks((prev) => [...prev, res.task]);
      setIsNewTaskModalOpen(false);
      setNewTask({
        title: '',
        category: 'translúcida',
        date: selectedDate,
        startTime: '08:00',
        endTime: '12:00',
        priority: 'media',
        responsible: 'Vanderlei Encarregado & Equipe',
        notes: '',
      });
    } catch (err) {
      alert('Erro ao salvar tarefa.');
    }
  };

  const handleQuickRainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vol = Number(rainData.volumeMm) || 15;
      const res = await api.quickRainLog({
        date: rainData.date,
        rained: true,
        rainVolumeMm: vol,
        rainPeriod: rainData.period,
        paralyzedWork: rainData.paralyzedWork,
        notes: rainData.notes,
      });
      setTasks((prev) => [res.task, ...prev]);
      setIsRainModalOpen(false);
      setSelectedDate(rainData.date);

      if (res.scheduleInfo) {
        setScheduleInfo(res.scheduleInfo);
      }

      if ((res.gainedExtraDay || vol > 5) && res.whatsappMessage) {
        setRainAlertModal({
          show: true,
          rainVolume: vol,
          date: rainData.date,
          scheduleInfo: res.scheduleInfo,
          whatsappMessage: res.whatsappMessage,
        });
      }
    } catch (err) {
      alert('Erro ao registrar coleta de chuva.');
    }
  };

  // Navigation helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const shiftMonth = (months: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setMonth(current.getMonth() + months);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter tasks by category
  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter === 'todas') return true;
    if (categoryFilter === 'chuva') return t.category === 'chuva' || t.isRain || t.rained;
    return t.category === categoryFilter;
  });

  // Day view tasks
  const dayTasks = filteredTasks.filter((t) => t.date === selectedDate);

  // Week calculation (Monday to Sunday)
  const getWeekDays = () => {
    const curr = new Date(selectedDate + 'T12:00:00');
    const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(firstDay + i));
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };
  const weekDays = getWeekDays();

  // Month calculation
  const getMonthMatrix = () => {
    const curr = new Date(selectedDate + 'T12:00:00');
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjust for Monday start (0: Sun -> 6, 1: Mon -> 0)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push(`${year}-${monthStr}-${dayStr}`);
    }
    return days;
  };
  const monthDays = getMonthMatrix();

  const getCategoryBadgeColor = (cat: CalendarTask['category']) => {
    switch (cat) {
      case 'chuva':
        return 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs';
      case 'translúcida':
        return 'bg-red-50 text-[#d71920] border-red-200';
      case 'fibrocimento':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'calhas':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'segurança':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'bombeiros':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'logística':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER DE EXTENSÃO DO CALENDÁRIO POR CHUVA (>5MM) COM IA SAMUEL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Controle de Prazo Savoy • Dias de Chuva (&gt;5mm) Prorrogam o Calendário
              </h3>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Regra +1 Dia Ativa
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Início: <strong className="text-white">17/08/2026</strong> • Prazo Base: <strong className="text-white">75 dias corridos</strong> • 
              Chuva &gt; 5mm registrada: <strong className="text-amber-400 font-bold">{scheduleInfo?.rainDaysCount ?? 6} dias</strong> (+{scheduleInfo?.rainDaysCount ?? 6} dias no calendário) • 
              Término Atualizado: <strong className="text-emerald-400 text-sm font-black">{scheduleInfo?.formattedCurrentEndDate ?? '06/11/2026'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              const res = await api.getRainWhatsAppMessage();
              setRainAlertModal({
                show: true,
                rainVolume: res.latestRainEvent?.rainVolumeMm || 12,
                date: res.latestRainEvent?.date || '2026-08-25',
                scheduleInfo: res.scheduleInfo,
                whatsappMessage: res.whatsappMessage,
              });
            } catch (err) {
              console.error(err);
            }
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Notificação WhatsApp (Samuel)</span>
        </button>
      </div>

      {/* 1. Header do Calendário Operacional */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-[#d71920]">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Calendário Operacional de Tarefas
              </h2>
              <p className="text-xs text-slate-500">
                Programação diária, semanal e mensal das frentes de serviço e conformidade NR-35
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Visualização: DIA / SEMANA / MÊS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('dia')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('mes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
          </div>

          <button
            onClick={() => {
              setRainData((prev) => ({ ...prev, date: selectedDate }));
              setIsRainModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Registrar dia de chuva no canteiro"
          >
            <CloudRain className="w-4 h-4" />
            <span>Coletar Chuvas</span>
          </button>

          <button
            onClick={() => {
              setNewTask((prev) => ({ ...prev, date: selectedDate }));
              setIsNewTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#d71920] hover:bg-[#b5141a] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Tarefa</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Navegação de Datas e Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Controles de Navegação */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (viewMode === 'mes' ? shiftMonth(-1) : shiftDate(viewMode === 'semana' ? -7 : -1))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-[200px]">
            <span className="block text-sm sm:text-base font-black text-slate-900 capitalize">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
                ...(viewMode === 'dia' ? { weekday: 'short', day: '2-digit' } : {}),
              })}
            </span>
            {viewMode === 'semana' && (
              <span className="text-[11px] font-semibold text-slate-500">
                Semana de {weekDays[0].split('-').reverse().slice(0, 2).join('/')} a{' '}
                {weekDays[6].split('-').reverse().slice(0, 2).join('/')}
              </span>
            )}
          </div>

          <button
            onClick={() => (viewMode === 'mes' ? shiftMonth(1) : shiftDate(viewMode === 'semana' ? 7 : 1))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate('2026-09-15')}
            className="px-3 py-1.5 text-xs font-bold text-[#d71920] hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-red-200"
          >
            Hoje (15/Set)
          </button>
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'chuva', label: '🌧️ Chuvas (Azul)' },
            { id: 'translúcida', label: 'Translúcidas' },
            { id: 'fibrocimento', label: 'Fibrocimento' },
            { id: 'calhas', label: 'Calhas' },
            { id: 'bombeiros', label: 'PT/PA' },
            { id: 'segurança', label: 'NR-35' },
            { id: 'logística', label: 'Logística' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? cat.id === 'chuva' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* LEGENDA OPERACIONAL DAS CORES DO CALENDÁRIO */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px] mr-1">
            Legenda do Calendário:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 font-black shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300" />
            🟩 Verde: Dias de Prazo do Fornecedor de Serviço (17/08 a {scheduleInfo?.formattedCurrentEndDate || '06/11/2026'})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-950 border border-blue-300 font-black shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300" />
            🟦 Azul: Chuva &gt; 5mm (+1 Dia Ganho no Calendário)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 font-black shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300" />
            🟨 Amarelo: Telhas Instaladas no Dia
          </span>
        </div>

        <div className="text-[11px] font-semibold text-slate-600 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          Contrato: 75 dias + {scheduleInfo?.rainDaysCount ?? 6} dias chuva = <strong className="text-emerald-700">{scheduleInfo?.totalDaysGranted ?? 81} dias</strong>
        </div>
      </div>

      {/* ==================== VIEW 1: DIA ==================== */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          {/* Banner verde se estiver dentro do prazo do fornecedor */}
          {isProviderDeadline(selectedDate) && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-300 animate-pulse shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block text-emerald-900">
                    🟢 Dia com Prazo Contratual do Fornecedor de Serviço Ativo
                  </span>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Período Contratual de Execução: <strong>17/08/2026</strong> até{' '}
                    <strong className="text-emerald-900">{scheduleInfo?.formattedCurrentEndDate || '06/11/2026'}</strong>{' '}
                    (75 dias base + {scheduleInfo?.rainDaysCount ?? 6} dias de compensação por chuva &gt; 5mm).
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-lg shrink-0">
                Prazo Fornecedor Ativo
              </span>
            </div>
          )}

          {/* Banner especial se for dia de chuva */}
          {dayTasks.some((t) => t.category === 'chuva' || t.isRain || t.rained) && (
            <div className="p-3.5 rounded-xl bg-blue-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CloudRain className="w-5 h-5 text-white shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">
                    Precipitação Registrada • ITEM AZUL ATIVO
                  </span>
                  <span className="text-[11px] text-blue-100 font-medium">
                    Dia com registro de chuva coletado (&gt; 5mm). +1 dia de extensão concedido ao calendário.
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-white/20 backdrop-blur-xs text-white rounded-lg">
                🌧️ Choveu (Azul)
              </span>
            </div>
          )}

          {/* Card Detalhado de Apontamento de Campo do Dia (Telhas Instaladas, Clima e Linha de Vida) */}
          {reportsByDate.has(selectedDate) && (() => {
            const rep = reportsByDate.get(selectedDate)!;
            const totalTelhasDia = (Number(rep.qtdTranslúcidas) || 0) + (Number(rep.qtdFibrocimento) || 0);

            return (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Apontamento do Dia • Cobertura, Clima & Telhas (RDO Savoy)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Setor: {rep.setorPredio || 'Prédio 4i1'} • Resp: {rep.responsavel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Telhas Instaladas no Dia</span>
                    <span className="text-lg font-black text-amber-900">{totalTelhasDia} un</span>
                    <span className="text-[10px] text-amber-700 block font-medium">
                      {rep.qtdTranslúcidas} translúcidas • {rep.qtdFibrocimento} fibrocimento
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border shadow-2xs ${rep.nivelChuvaMm && rep.nivelChuvaMm > 0 ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Clima & Chuva</span>
                    <span className="text-lg font-black text-slate-900">
                      {rep.nivelChuvaMm && rep.nivelChuvaMm > 0 ? `${rep.nivelChuvaMm} mm` : '0 mm (Seco)'}
                    </span>
                    <span className="text-[10px] text-slate-600 block truncate font-medium">{rep.condicoesClimaticas}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Linha de Vida</span>
                    <span className="text-lg font-black text-emerald-700">+{rep.metragemLinhaVida || 0}m</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Ancoragem NR-35</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-blue-800 block">Calhas no Dia</span>
                    <span className="text-lg font-black text-blue-900">+{rep.metragemCalhas || 0}m</span>
                    <span className="text-[10px] text-blue-600 block font-medium">Vedação PU-40</span>
                  </div>
                </div>

                {rep.descricaoExecucao && (
                  <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                    <strong className="text-slate-800">Serviços executados:</strong> {rep.descricaoExecucao}
                  </p>
                )}
              </div>
            );
          })()}

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-slate-700">
                  Condições Meteorológicas do Dia: 27°C Ensolarado • Vento 9 km/h (SE)
                </span>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Apto para trabalhos em altura e içamento com plataforma/Munck.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'} agendadas
            </span>
          </div>

          {dayTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600">
                Nenhuma tarefa agendada para este dia.
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => {
                    setRainData((prev) => ({ ...prev, date: selectedDate }));
                    setIsRainModalOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  + Coletar Chuva neste dia
                </button>
                <button
                  onClick={() => {
                    setNewTask((prev) => ({ ...prev, date: selectedDate }));
                    setIsNewTaskModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#d71920] hover:underline"
                >
                  + Adicionar Tarefa
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dayTasks.map((t) => {
                const isRainItem = t.category === 'chuva' || t.isRain || t.rained;

                return (
                  <div
                    key={t.id}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group px-3 rounded-xl transition-all my-1 ${
                      isRainItem
                        ? 'bg-blue-50/90 border-2 border-blue-500 shadow-xs ring-1 ring-blue-300'
                        : 'hover:bg-slate-50/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className={`mt-0.5 cursor-pointer transition-all ${
                          isRainItem
                            ? 'text-blue-500 hover:text-blue-700'
                            : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={t.isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
                      >
                        {t.isCompleted ? (
                          <CheckCircle2 className={`w-5 h-5 ${isRainItem ? 'text-blue-700 fill-blue-100' : 'text-emerald-600 fill-emerald-50'}`} />
                        ) : (
                          <Circle className={`w-5 h-5 ${isRainItem ? 'text-blue-400 hover:text-blue-600' : 'text-slate-300 hover:text-slate-500'}`} />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isRainItem
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : getCategoryBadgeColor(t.category)
                            }`}
                          >
                            {isRainItem ? '🌧️ Chuva (Azul)' : t.category}
                          </span>

                          <span
                            className={`text-sm font-bold ${
                              t.isCompleted
                                ? 'line-through text-slate-400'
                                : isRainItem
                                ? 'text-blue-950 font-black'
                                : 'text-slate-900'
                            }`}
                          >
                            {t.title}
                          </span>

                          {t.priority === 'alta' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                              Alta Prioridade
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className={`w-3.5 h-3.5 ${isRainItem ? 'text-blue-500' : 'text-slate-400'}`} />
                            {t.startTime} - {t.endTime}
                          </span>

                          <span className="flex items-center gap-1 font-medium">
                            <User className={`w-3.5 h-3.5 ${isRainItem ? 'text-blue-500' : 'text-slate-400'}`} />
                            {t.responsible}
                          </span>

                          {t.notes && (
                            <span className={`${isRainItem ? 'text-blue-800 font-medium' : 'text-slate-600 italic'}`}>
                              • "{t.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isRainItem
                            ? 'bg-blue-600 text-white'
                            : t.isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'em_andamento'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isRainItem
                          ? 'Chuva Coletada'
                          : t.isCompleted
                          ? 'Concluída'
                          : t.status === 'em_andamento'
                          ? 'Em Andamento'
                          : 'Programada'}
                      </span>

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: SEMANA ==================== */}
      {viewMode === 'semana' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayStr) => {
            const dateObj = new Date(dayStr + 'T12:00:00');
            const dayTasksList = filteredTasks.filter((t) => t.date === dayStr);
            const isToday = dayStr === selectedDate;
            const isRainDay = dayTasksList.some((t) => t.category === 'chuva' || t.isRain || t.rained);
            const isProvider = isProviderDeadline(dayStr);
            const dayReport = reportsByDate.get(dayStr);

            return (
              <div
                key={dayStr}
                className={`rounded-2xl p-3.5 border shadow-xs flex flex-col min-h-[320px] transition-all ${
                  isRainDay
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300'
                    : isToday
                    ? 'bg-white border-[#d71920] ring-2 ring-[#d71920]/30'
                    : isProvider
                    ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="block text-[11px] uppercase font-bold text-slate-400">
                        {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </span>
                      {isProvider && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                          Prazo Fornecedor
                        </span>
                      )}
                      {isRainDay && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                          🌧️ +1d
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-black ${
                        isRainDay
                          ? 'text-blue-900'
                          : isToday
                          ? 'text-[#d71920]'
                          : isProvider
                          ? 'text-emerald-950'
                          : 'text-slate-800'
                      }`}
                    >
                      {dateObj.getDate()}/{dateObj.getMonth() + 1}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isRainDay
                        ? 'bg-blue-600 text-white'
                        : isProvider
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dayTasksList.length + (dayReport ? 1 : 0)}
                  </span>
                </div>

                {/* Métricas do RDO do dia (Telhas & Clima) */}
                {dayReport && (
                  <div
                    onClick={() => {
                      setSelectedDate(dayStr);
                      setViewMode('dia');
                    }}
                    className="mb-2 p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/90 transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-900">
                        RDO Savoy
                      </span>
                      <span className="text-[9px] font-bold text-amber-800">
                        {dayReport.nivelChuvaMm && dayReport.nivelChuvaMm > 0 ? `🌧️ ${dayReport.nivelChuvaMm}mm` : '☀️ Bom'}
                      </span>
                    </div>

                    {((Number(dayReport.qtdTranslúcidas) || 0) + (Number(dayReport.qtdFibrocimento) || 0) > 0) && (
                      <p className="text-[11px] font-black text-amber-950">
                        ✨ {(Number(dayReport.qtdTranslúcidas) || 0) + (Number(dayReport.qtdFibrocimento) || 0)} telhas instaladas
                      </p>
                    )}

                    {(Number(dayReport.metragemLinhaVida) || 0) > 0 && (
                      <p className="text-[10px] font-bold text-emerald-800">
                        🛡️ +{dayReport.metragemLinhaVida}m Linha de Vida
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[340px]">
                  {dayTasksList.map((t) => {
                    const isRainItem = t.category === 'chuva' || t.isRain || t.rained;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedDate(dayStr);
                          setViewMode('dia');
                        }}
                        className={`p-2 rounded-xl text-xs cursor-pointer transition-all space-y-1 ${
                          isRainItem
                            ? 'bg-blue-600 text-white border border-blue-700 shadow-xs hover:bg-blue-700'
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold uppercase px-1 rounded ${
                              isRainItem
                                ? 'bg-white text-blue-800'
                                : getCategoryBadgeColor(t.category)
                            }`}
                          >
                            {isRainItem ? '🌧️ Chuva' : t.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isRainItem ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {t.startTime}
                          </span>
                        </div>
                        <p
                          className={`font-semibold line-clamp-2 ${
                            t.isCompleted
                              ? 'line-through text-slate-400'
                              : isRainItem
                              ? 'text-white font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          {t.title}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setNewTask((prev) => ({ ...prev, date: dayStr }));
                    setIsNewTaskModalOpen(true);
                  }}
                  className="mt-2 w-full py-1 text-[11px] font-bold text-slate-500 hover:text-[#d71920] hover:bg-red-50 rounded-lg transition-all text-center border border-dashed border-slate-200 cursor-pointer"
                >
                  + Tarefa
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== VIEW 3: MÊS ==================== */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          {/* Header dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((dayStr, idx) => {
              if (!dayStr) {
                return <div key={`empty-${idx}`} className="min-h-[105px] rounded-xl bg-slate-50/50" />;
              }

              const dateObj = new Date(dayStr + 'T12:00:00');
              const dayTasksList = filteredTasks.filter((t) => t.date === dayStr);
              const isSelected = dayStr === selectedDate;
              const isRainDay = dayTasksList.some((t) => t.category === 'chuva' || t.isRain || t.rained);
              const isProvider = isProviderDeadline(dayStr);
              const dayReport = reportsByDate.get(dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => {
                    setSelectedDate(dayStr);
                    setViewMode('dia');
                  }}
                  className={`min-h-[105px] p-2 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    isRainDay
                      ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-400 shadow-xs'
                      : isSelected
                      ? 'border-[#d71920] bg-red-50/30 ring-2 ring-[#d71920]/40'
                      : isProvider
                      ? 'border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 ring-1 ring-emerald-300 shadow-2xs'
                      : 'border-slate-200/70 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-black text-xs ${
                        isRainDay
                          ? 'text-blue-900 font-extrabold'
                          : isSelected
                          ? 'text-[#d71920]'
                          : isProvider
                          ? 'text-emerald-950 font-black'
                          : 'text-slate-800'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>

                    <div className="flex items-center gap-1 flex-wrap">
                      {isProvider && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-emerald-600 text-white" title="Prazo contratual do fornecedor de serviço">
                          Prazo
                        </span>
                      )}
                      {isRainDay && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-blue-600 text-white flex items-center gap-0.5">
                          🌧️ +1d
                        </span>
                      )}
                      {dayTasksList.length > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1 rounded-full ${
                            isRainDay ? 'bg-blue-800 text-white' : 'bg-[#d71920] text-white'
                          }`}
                        >
                          {dayTasksList.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações de Telhas e Clima do RDO */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayReport && (
                      <>
                        {((Number(dayReport.qtdTranslúcidas) || 0) + (Number(dayReport.qtdFibrocimento) || 0) > 0) && (
                          <div
                            className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 truncate"
                            title={`Instaladas: ${dayReport.qtdTranslúcidas} translúcidas, ${dayReport.qtdFibrocimento} fibrocimento`}
                          >
                            ✨ {(Number(dayReport.qtdTranslúcidas) || 0) + (Number(dayReport.qtdFibrocimento) || 0)} telhas
                          </div>
                        )}
                        {(Number(dayReport.metragemLinhaVida) || 0) > 0 && (
                          <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 truncate">
                            🛡️ +{dayReport.metragemLinhaVida}m L. Vida
                          </div>
                        )}
                        <div
                          className={`text-[9px] font-semibold px-1 py-0.5 rounded truncate ${
                            (Number(dayReport.nivelChuvaMm) > 0 || isRainDay)
                              ? 'bg-blue-100 text-blue-950 font-black border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {Number(dayReport.nivelChuvaMm) > 0
                            ? `🌧️ ${dayReport.nivelChuvaMm}mm ${dayReport.chuvaMaior5mm ? '(+1d)' : ''}`
                            : isRainDay
                            ? '🌧️ Chuva'
                            : '☀️ ' + (dayReport.condicoesClimaticas ? dayReport.condicoesClimaticas.split('/')[0].trim() : 'Bom')}
                        </div>
                      </>
                    )}

                    {/* Tarefas Agendadas */}
                    {dayTasksList.slice(0, 1).map((t) => {
                      const isRainItem = t.category === 'chuva' || t.isRain || t.rained;

                      return (
                        <div
                          key={t.id}
                          className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                            isRainItem
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isRainItem ? `🌧️ ${t.title}` : t.title}
                        </div>
                      );
                    })}
                    {dayTasksList.length > 1 && !dayReport && (
                      <span className="text-[9px] text-slate-400 font-bold block">
                        +{dayTasksList.length - 1} mais
                      </span>
                    )}
                  </div>

                  <span className={`text-[9px] self-end ${isRainDay ? 'text-blue-700 font-bold' : isProvider ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    {dayTasksList.some((t) => t.isCompleted) ? '✓ OK' : isProvider ? '🟢 Ativo' : isRainDay ? 'Azul' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: NOVA TAREFA */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Agendar Nova Tarefa no Calendário
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atribua horários, equipe responsável e nível de prioridade para a frente de obra.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Içamento de telhas translúcidas setor B"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        category: e.target.value as CalendarTask['category'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="translúcida">Telha Translúcida</option>
                    <option value="fibrocimento">Telha Fibrocimento</option>
                    <option value="calhas">Calhas & Vedação</option>
                    <option value="bombeiros">Liberação Bombeiros (PT/PA)</option>
                    <option value="segurança">Segurança & NR-35</option>
                    <option value="logística">Logística / Entrega</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data Programada *
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Término
                  </label>
                  <input
                    type="time"
                    value={newTask.endTime}
                    onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as 'alta' | 'media' | 'baixa',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Responsável / Equipe
                </label>
                <input
                  type="text"
                  value={newTask.responsible}
                  onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                  placeholder="Nome do encarregado ou engenheiro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Técnicas / EPIs
                </label>
                <textarea
                  rows={2}
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Instruções de segurança ou meta de telhas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d71920] hover:bg-[#b5141a] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLETAR CHUVA (ITEM AZUL NO CALENDÁRIO) */}
      {isRainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <CloudRain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Coleta de Chuvas • Calendário Savoy
                </h3>
                <p className="text-xs text-slate-500">
                  O item ficará <strong className="text-blue-600 font-bold">azul</strong> no calendário para identificação imediata dos dias de chuva.
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickRainSubmit} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data da Precipitação
                  </label>
                  <input
                    type="date"
                    required
                    value={rainData.date}
                    onChange={(e) => setRainData({ ...rainData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Volume Estimado (mm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={rainData.volumeMm}
                    onChange={(e) => setRainData({ ...rainData, volumeMm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    placeholder="Ex: 15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Período da Chuva
                  </label>
                  <select
                    value={rainData.period}
                    onChange={(e) => setRainData({ ...rainData, period: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="dia_inteiro">Dia Inteiro (Intermitente/Contínua)</option>
                    <option value="tarde">Período da Tarde</option>
                    <option value="manha">Período da Manhã</option>
                    <option value="noite">Período Noturno</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trabalho Altura Paralisado?
                  </label>
                  <select
                    value={rainData.paralyzedWork ? 'sim' : 'nao'}
                    onChange={(e) => setRainData({ ...rainData, paralyzedWork: e.target.value === 'sim' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-blue-900"
                  >
                    <option value="sim">Sim • Paralisado por NR-35</option>
                    <option value="nao">Não • Frente coberta mantida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Técnicas / Impacto nas Calhas & Cobertura
                </label>
                <textarea
                  rows={2}
                  value={rainData.notes}
                  onChange={(e) => setRainData({ ...rainData, notes: e.target.value })}
                  placeholder="Ex: Chuva torrencial impediu içamento e telhamento. Calhas inspecionadas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {Number(rainData.volumeMm) > 5 ? (
                <div className="p-3 bg-blue-100/90 rounded-xl border border-blue-300 flex items-start gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5 text-xs text-blue-950 font-medium">
                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span>🌧️ Chuva de {rainData.volumeMm} mm (&gt; 5 mm)</span>
                      <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                        +1 DIA NO PRAZO
                      </span>
                    </p>
                    <p className="text-[11px] text-blue-800">
                      O prestador de serviço ganha +1 dia no calendário final. A <strong>IA Samuel</strong> estenderá a data final e emitirá comunicado WhatsApp.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                  <p className="text-[11px] text-blue-900 font-semibold">
                    Ao salvar, a data será gravada como <strong className="text-blue-700">evento azul</strong> no calendário. Chuvas acima de 5 mm prorrogam o prazo em +1 dia.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRainModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CloudRain className="w-4 h-4" />
                  <span>Salvar Chuva (Item Azul)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICAÇÃO WHATSAPP DA IA SAMUEL */}
      {rainAlertModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <CloudRain className="w-6 h-6 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    🌧️ Notificação de Chuva & Extensão de Prazo
                  </h3>
                  <p className="text-xs text-blue-100">
                    Assistente Samuel • Regra Contratual Savoy (&gt; 5 mm)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRainAlertModal(null)}
                className="text-white/80 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-blue-900">
                    {rainAlertModal.rainVolume} mm
                  </span>
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Chuva &gt; 5 mm
                    </span>
                    <p className="text-xs font-bold text-blue-950 mt-0.5">
                      +1 Dia Adicional Ganho pelo Prestador
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-[11px] text-slate-500 block">Nova Data Final:</span>
                  <span className="text-sm font-black text-emerald-700">
                    {rainAlertModal.scheduleInfo?.formattedCurrentEndDate || '06/11/2026'}
                  </span>
                </div>
              </div>

              {/* Samuel's WhatsApp Preview Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Mensagem de WhatsApp da IA Samuel:
                  </span>
                  <span className="text-[10px] text-slate-400">Pronta para envio</span>
                </label>
                <div className="bg-[#e5ddd5]/30 border border-emerald-200 rounded-2xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {rainAlertModal.whatsappMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(rainAlertModal.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar / Abrir no WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rainAlertModal.whatsappMessage);
                    setCopiedMessage(true);
                    setTimeout(() => setCopiedMessage(false), 3000);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedMessage ? '✓ Mensagem Copiada!' : 'Copiar Texto da Mensagem'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Contrato SANY-CIV-2025/08 • 75 dias corridos</span>
              <button
                onClick={() => setRainAlertModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
