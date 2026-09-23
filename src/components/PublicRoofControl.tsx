import React, { useState, useEffect } from 'react';
import { RoofDailyReport, RoofProjectSummary } from '../types';
import { api } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  CloudSun,
  ShieldCheck,
  Truck,
  Wrench,
  Send,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Info,
  CloudRain,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Sliders,
  CalendarDays,
  Check,
  Zap,
  Maximize2,
  Activity,
  Sparkles,
} from 'lucide-react';

interface PublicRoofControlProps {
  onOpenDeveloperLogin: () => void;
  isDeveloperAuthenticated?: boolean;
}

export function PublicRoofControl({
  onOpenDeveloperLogin,
  isDeveloperAuthenticated = false,
}: PublicRoofControlProps) {
  const [summary, setSummary] = useState<RoofProjectSummary | null>(null);
  const [reports, setReports] = useState<RoofDailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'chart' | 'history'>('chart');
  const [chartMode, setChartMode] = useState<'composed' | 'stacked' | 'grouped' | 'cumulative'>('composed');
  const [chartRange, setChartRange] = useState<'all' | 'last14' | 'last7' | 'setembro' | 'agosto'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    title: string;
    subtitle: string;
    targetPhone: string;
    targetPhoneFormatted: string;
    date: string;
    whatsappMessage: string;
    whatsappUrl: string;
    isRainExtension?: boolean;
    rainVolume?: number;
    scheduleInfo?: any;
  } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    dataPreenchimento: new Date().toISOString().split('T')[0],
    setorPredio: 'Prédio 4i1',
    responsavel: 'Sávio Rodrigues de Souza',
    equipeFuncionarios:
      'Vanderlei Encarregado, Ezequiel Soldador, Iraldo Caldeireiro, Juliano Resgatista, Joeson Caldeireiro, Matheus Caldeireiro, Hugo Caldeireiro, Jonas Caldeireiro',
    tiposServico: ['Telha Translúcida', 'Telha de Fibrocimento', 'Linha de vida'],
    qtdTranslúcidas: '',
    qtdFibrocimento: '',
    metragemCalhas: '',
    metragemLinhaVida: '',
    metragem: '',
    nivelChuvaMm: '',
    statusGeral: 'Em andamento' as 'Em andamento' | 'Concluído' | 'Paralisado',
    descricaoExecucao: '',
    condicoesClimaticas: 'Ensolarado / Favorável em todos os períodos',
    periodosAfetadosClima: 'Sem paralisação',
    houveEntregaMateriais: 'Não havia entrega prevista para hoje',
    materiaisRecebidos: '',
    equipamentosEmUso: ['Ferramentas manuais', 'Cabos e acessórios de fixação', 'Linha de vida', 'Meios de transporte / Plataforma elevatória / Munck'],
    condicaoEquipamentos: 'Todos operacionais',
    registroOcorrencias: 'Nenhuma ocorrência (Dia 100% seguro)',
    descricaoOcorrencia: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, reps] = await Promise.all([
        api.getRoofSummary(),
        api.getRoofReports(),
      ]);
      setSummary(sum);
      setReports(reps);
    } catch (err) {
      console.error('Erro ao carregar dados de telhado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckboxChange = (
    field: 'tiposServico' | 'equipamentosEmUso',
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dataPreenchimento) {
      alert('Selecione a data de preenchimento.');
      return;
    }

    try {
      setSubmitting(true);
      const mCalhas = Number(formData.metragemCalhas) || 0;
      const mLinhaVida = Number(formData.metragemLinhaVida) || 0;
      const mTotal = mCalhas + mLinhaVida || Number(formData.metragem) || 0;
      const volChuva = Number(formData.nivelChuvaMm) || 0;

      const res = await api.submitRoofReport({
        ...formData,
        qtdTranslúcidas: Number(formData.qtdTranslúcidas) || 0,
        qtdFibrocimento: Number(formData.qtdFibrocimento) || 0,
        metragemCalhas: mCalhas,
        metragemLinhaVida: mLinhaVida,
        metragem: mTotal,
        nivelChuvaMm: volChuva,
      });

      setSummary(res.summary);
      setReports((prev) => [res.report, ...prev]);

      const targetPhone = res.targetPhone || '5512974080523';
      const targetPhoneFormatted = res.targetPhoneFormatted || '+55 (12) 97408-0523';
      const waMsg = res.dailyWhatsappMessage || res.whatsappMessage || '';
      const waUrl = res.whatsappUrl || `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMsg)}`;
      const isRainExt = Boolean(res.gainedExtraDay || volChuva > 5);

      setWhatsappModal({
        show: true,
        title: isRainExt
          ? '🌧️ Chuva > 5mm & Atualização Diária da Cobertura'
          : '📱 Atualização Diária de Cobertura • WhatsApp',
        subtitle: `Assistente Samuel • Envio direto para SVA Engenharia (${targetPhoneFormatted})`,
        targetPhone,
        targetPhoneFormatted,
        date: formData.dataPreenchimento,
        whatsappMessage: waMsg,
        whatsappUrl: waUrl,
        isRainExtension: isRainExt,
        rainVolume: volChuva,
        scheduleInfo: res.scheduleInfo || res.summary?.scheduleInfo,
      });

      if (isRainExt) {
        setSuccessToast(`🌧️ Chuva de ${volChuva}mm registrada (> 5mm)! O prestador de serviço ganhou +1 dia no prazo final e a IA Samuel preparou o comunicado para o WhatsApp (${targetPhoneFormatted}).`);
      } else {
        setSuccessToast(`Relatório salvo com sucesso! A IA Samuel preparou a atualização diária para envio no WhatsApp (${targetPhoneFormatted}).`);
      }
      setTimeout(() => setSuccessToast(null), 7000);

      // Reset quantities and description for next entry
      setFormData((prev) => ({
        ...prev,
        qtdTranslúcidas: '',
        qtdFibrocimento: '',
        metragemCalhas: '',
        metragemLinhaVida: '',
        metragem: '',
        nivelChuvaMm: '',
        descricaoExecucao: '',
        materiaisRecebidos: '',
        descricaoOcorrencia: '',
      }));

      setActiveSubTab('chart');
    } catch (err: any) {
      alert('Erro ao registrar relatório: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare Cumulative & Detailed Chart Data (sorted by date ascending)
  let runTrans = 0;
  let runFibro = 0;
  let runTotal = 0;

  const rawSorted = [...reports].sort(
    (a, b) =>
      new Date(a.dataPreenchimento).getTime() -
      new Date(b.dataPreenchimento).getTime()
  );

  const fullChartData = rawSorted.map((r) => {
    const parts = r.dataPreenchimento.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.dataPreenchimento;
    const trans = Number(r.qtdTranslúcidas) || 0;
    const fibro = Number(r.qtdFibrocimento) || 0;
    const totalDia = trans + fibro;
    runTrans += trans;
    runFibro += fibro;
    runTotal += totalDia;

    const chuvaMm = Number(r.nivelChuvaMm) || 0;
    const isRainGained = Boolean(r.ganhouDiaAdicional || r.chuvaMaior5mm || chuvaMm > 5);

    // Format week day name
    let diaSemana = '';
    try {
      const d = new Date(`${r.dataPreenchimento}T12:00:00`);
      const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      diaSemana = nomes[d.getDay()];
    } catch {
      diaSemana = '';
    }

    return {
      data: formattedDate,
      dataFull: r.dataPreenchimento,
      diaSemana,
      labelComDia: diaSemana ? `${formattedDate} (${diaSemana})` : formattedDate,
      translucidas: trans,
      fibrocimento: fibro,
      totalDia,
      cumTranslucidas: runTrans,
      cumFibrocimento: runFibro,
      cumTotal: runTotal,
      status: r.statusGeral,
      clima: r.condicoesClimaticas,
      nivelChuvaMm: chuvaMm,
      ganhouDiaAdicional: isRainGained,
      linhaVida: Number(r.metragemLinhaVida) || 0,
      calhas: Number(r.metragemCalhas) || 0,
      responsavel: r.responsavel,
    };
  });

  const chartData = fullChartData.filter((item, idx, arr) => {
    if (chartRange === 'last7') return idx >= arr.length - 7;
    if (chartRange === 'last14') return idx >= arr.length - 14;
    if (chartRange === 'setembro') return item.dataFull.includes('-09-');
    if (chartRange === 'agosto') return item.dataFull.includes('-08-');
    return true;
  });

  // KPI calculations for chart overview
  const totalTelhasRange = chartData.reduce((acc, c) => acc + c.totalDia, 0);
  const totalTransRange = chartData.reduce((acc, c) => acc + c.translucidas, 0);
  const totalFibroRange = chartData.reduce((acc, c) => acc + c.fibrocimento, 0);
  const daysWithProduction = chartData.filter((c) => c.totalDia > 0).length;
  const avgProductionDay = daysWithProduction > 0 ? (totalTelhasRange / daysWithProduction).toFixed(1) : '0';
  const maxDayItem = chartData.reduce((max, c) => (c.totalDia > max.totalDia ? c : max), { totalDia: 0, data: '-', dataFull: '-' } as any);
  const rainDaysCountRange = chartData.filter((c) => c.ganhouDiaAdicional).length;

  // Filtered reports for history tab
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      searchFilter === '' ||
      r.dataPreenchimento.includes(searchFilter) ||
      r.descricaoExecucao.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.responsavel.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.equipeFuncionarios.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' || r.statusGeral === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[240px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div>
              <p className="font-extrabold text-sm text-white">
                {d.dataFull} ({d.diaSemana})
              </p>
              <p className="text-[10px] text-slate-400">
                Responsável: {d.responsavel || 'SVA Engenharia'}
              </p>
            </div>
            {d.ganhouDiaAdicional && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-bold">
                🌧️ +1 Dia Prazo
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#d71920]" />
                Translúcidas no dia:
              </span>
              <span className="font-bold text-red-400">+{d.translucidas} un</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#64748b]" />
                Fibrocimento no dia:
              </span>
              <span className="font-bold text-slate-200">+{d.fibrocimento} un</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="font-bold text-slate-200">Total Instalado no Dia:</span>
              <span className="font-black text-amber-400 text-sm">{d.totalDia} telhas</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Acumulado Geral:
              </span>
              <span className="font-black text-emerald-400">{d.cumTotal} telhas</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
            <p>• Clima: {d.clima ? d.clima.split('(')[0] : 'Estável'}</p>
            {d.nivelChuvaMm > 0 && (
              <p className="text-blue-300 font-medium">
                • Chuva registrada: {d.nivelChuvaMm} mm {d.ganhouDiaAdicional ? '(Prorrogação contratual concedida)' : ''}
              </p>
            )}
            {(d.linhaVida > 0 || d.calhas > 0) && (
              <p className="text-slate-300">
                • Linha de Vida: {d.linhaVida}m | Calhas: {d.calhas}m
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#f8f9fa] text-slate-900 pb-16">
      {/* 1. Header estilo SANY (Matching Image 1) */}
      <header className="bg-black text-white px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[#d71920] font-black text-2xl tracking-tighter">
              SANY
            </span>
            <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                Controle de Instalação de Telhas
              </h1>
              <p className="text-xs text-slate-400">
                Responsável: {summary?.responsavelGeral || 'Sávio Rodrigues de Souza'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <span className="text-white font-bold px-1.5 py-0.5 bg-[#d71920] rounded">PT</span>
              <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">EN</span>
              <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">中文</span>
            </div>

            <button
              onClick={onOpenDeveloperLogin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDeveloperAuthenticated
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isDeveloperAuthenticated ? 'Painel Gestão Ativo' : 'Acesso Desenvolvedor'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {successToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* BANNER DE CRONOGRAMA DINÂMICO & REGRA DE CHUVAS (IA SAMUEL) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Calendário de Obras Savoy • Regra de Extensão por Chuva (&gt;5mm)
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  IA Samuel Conectada
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Início: <strong className="text-white">17/08/2026</strong> • Prazo Base: <strong className="text-white">75 dias corridos</strong> • 
                Dias com chuva &gt; 5mm: <strong className="text-amber-400 font-bold">{summary?.scheduleInfo?.rainDaysCount ?? 6} dias</strong> (+{summary?.scheduleInfo?.rainDaysCount ?? 6} dias ao prazo) • 
                Data Final Atualizada: <strong className="text-emerald-400 text-sm font-black">{summary?.scheduleInfo?.formattedCurrentEndDate ?? '06/11/2026'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={async () => {
                try {
                  const data = await api.getDailyRoofUpdateWhatsApp();
                  setWhatsappModal({
                    show: true,
                    title: '📱 Atualização Diária da Cobertura • WhatsApp',
                    subtitle: `Assistente Samuel • Envio direto para (${data.targetPhoneFormatted})`,
                    targetPhone: data.targetPhone,
                    targetPhoneFormatted: data.targetPhoneFormatted,
                    date: data.report?.dataPreenchimento || '',
                    whatsappMessage: data.dailyWhatsappMessage,
                    whatsappUrl: data.whatsappUrl,
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp (12 97408-0523)</span>
            </button>

            <button
              onClick={async () => {
                try {
                  const data = await api.getSvaReminderWhatsApp();
                  setWhatsappModal({
                    show: true,
                    title: '⏰ Lembrete Diário 08h30 • SVA Engenharia',
                    subtitle: `Assistente Samuel • Disparo para (${data.targetPhoneFormatted})`,
                    targetPhone: data.targetPhone,
                    targetPhoneFormatted: data.targetPhoneFormatted,
                    date: '',
                    whatsappMessage: data.reminderMessage,
                    whatsappUrl: data.whatsappUrl,
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Lembrete 08h30 SVA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Progresso Total do Projeto (Matching Image 1) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm sm:text-base font-bold text-slate-800">
              Progresso Total do Projeto:
            </span>
            <span className="text-base sm:text-xl font-black text-[#d71920]">
              {summary ? `${summary.progressoTotalPercent}%` : '23%'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
            <div
              className="bg-[#d71920] h-full rounded-full transition-all duration-500"
              style={{ width: `${summary ? summary.progressoTotalPercent : 23}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>Meta Global: 1600 Telhas e 3600m Calhas</span>
            <span>Total Apontamentos Registrados: {summary?.totalRelatorios || reports.length}</span>
          </div>
        </div>

        {/* 3. 5 Cards de Métricas com Calhas e Linha de Vida separadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          {/* Card 1: Translúcidas */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Translúcidas
              </span>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {summary?.translucidasPercent ?? 21.5}%
              </span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.translucidasInstaladas ?? 280}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {' '}/ {summary?.translucidasMeta ?? 1300} un
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Meta: 1.300 unidades
            </span>
          </div>

          {/* Card 2: Fibrocimento */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fibrocimento
              </span>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {summary?.fibrocimentoPercent ?? 32.3}%
              </span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.fibrocimentoInstaladas ?? 97}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {' '}/ {summary?.fibrocimentoMeta ?? 300} un
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Meta: 300 unidades
            </span>
          </div>

          {/* Card 3: Calhas */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Calhas
              </span>
              <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {summary?.calhasPercent ?? 0}%
              </span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.calhasInstaladas ?? 0}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {' '}/ {summary?.calhasMeta ?? 3600}m
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Meta: {summary?.calhasInstaladas ?? 0} de {summary?.calhasMeta ?? 3600}m
            </span>
          </div>

          {/* Card 4: Linha de Vida (Última posição aferida, não acumula) */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Linha de Vida (Última Posição)
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {summary?.linhaVidaPercent ?? 100}%
              </span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.linhaVidaInstalada ?? 2000}m
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {' '}/ {summary?.linhaVidaMeta ?? 2000}m
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">
              Última atualização aferida (não se soma)
            </span>
          </div>

          {/* Card 5: Último Status do Serviço */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden border-t-4 border-t-[#d71920]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Status do Serviço
            </span>
            <div className="my-2.5 flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  summary?.ultimoStatus === 'Paralisado'
                    ? 'bg-amber-500 animate-pulse'
                    : summary?.ultimoStatus === 'Concluído'
                    ? 'bg-blue-600'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span className="text-lg font-black text-slate-900 truncate">
                {summary?.ultimoStatus || 'Em andamento'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {summary?.ultimaDataPreenchimento || '14/09/2026'}
            </span>
          </div>
        </div>

        {/* 4. Sub-Aba Navigation (Gráfico / Formulário / Histórico) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('chart')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'chart'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Gráfico de Instalação de Telhas
            </button>
            <button
              onClick={() => setActiveSubTab('form')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'form'
                  ? 'bg-[#d71920] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              + Preenchimento Diário do Serviço
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Histórico de Apontamentos ({reports.length})
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Base Pública SANY Turnkey Ativa</span>
          </div>
        </div>

        {/* ==================== SUB-TAB 1: GRÁFICO DE BARRAS & EVOLUÇÃO ==================== */}
        {activeSubTab === 'chart' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs mb-6">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-red-50 text-[#d71920] rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Acompanhamento Gráfico da Cobertura • Prédio 4i1
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Visualização analítica de telhas translúcidas e fibrocimento instaladas pela SVA Engenharia
                </p>
              </div>

              {/* Chart Controls: Modes & Ranges */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartMode('composed')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'composed'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Misto: Barras do dia com curva de acumulação"
                  >
                    Misto + Acumulado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('stacked')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'stacked'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Barras Empilhadas: Visualiza total do dia em uma só coluna"
                  >
                    Empilhado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('grouped')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'grouped'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Barras Lado a Lado: Comparativo direto"
                  >
                    Lado a Lado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('cumulative')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'cumulative'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Curva S de Evolução Acumulada"
                  >
                    Curva S (Área)
                  </button>
                </div>

                {/* Range Filter */}
                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={chartRange}
                    onChange={(e) => setChartRange(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#d71920] cursor-pointer"
                  >
                    <option value="all">Todo o Período ({reports.length} dias)</option>
                    <option value="last14">Últimos 14 Dias</option>
                    <option value="last7">Últimos 7 Dias</option>
                    <option value="setembro">Mês de Setembro ({fullChartData.filter(d => d.dataFull.includes('-09-')).length} dias)</option>
                    <option value="agosto">Mês de Agosto ({fullChartData.filter(d => d.dataFull.includes('-08-')).length} dias)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar directly above chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Produção no Período
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">{totalTelhasRange}</span>
                  <span className="text-xs font-medium text-slate-500">telhas instaladas</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {totalTransRange} translúcidas • {totalFibroRange} fibro
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Média por Dia Ativo
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">{avgProductionDay}</span>
                  <span className="text-xs font-medium text-slate-500">telhas / dia</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Em {daysWithProduction} dias com produção
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pico de Produção Diário
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-[#d71920]">{maxDayItem.totalDia}</span>
                  <span className="text-xs font-medium text-slate-500">telhas</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate block">
                  Em {maxDayItem.data} ({maxDayItem.diaSemana || 'Dia recorde'})
                </span>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  Extensões por Chuva (&gt;5mm)
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-blue-900">+{rainDaysCountRange}</span>
                  <span className="text-xs font-medium text-blue-700">dias contratuais</span>
                </div>
                <span className="text-[10px] text-blue-600 font-medium">
                  Regra Savoy aplicada na cobertura
                </span>
              </div>
            </div>

            {/* Main Interactive Chart */}
            <div className="h-96 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'composed' ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 15, right: 30, left: 5, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{
                        value: 'Telhas no Dia (un)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#059669' }}
                      label={{
                        value: 'Acumulado Total (un)',
                        angle: 90,
                        position: 'insideRight',
                        style: { fontSize: 11, fill: '#059669', fontWeight: 600 },
                      }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      formatter={(value) => {
                        if (value === 'translucidas') return <span className="text-xs font-bold text-slate-700">Translúcidas no Dia (un)</span>;
                        if (value === 'fibrocimento') return <span className="text-xs font-bold text-slate-700">Fibrocimento no Dia (un)</span>;
                        if (value === 'cumTotal') return <span className="text-xs font-bold text-emerald-700">Progresso Acumulado Geral (Curva S)</span>;
                        return value;
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="translucidas"
                      name="translucidas"
                      fill="#d71920"
                      stackId="dia"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="fibrocimento"
                      name="fibrocimento"
                      fill="#334155"
                      stackId="dia"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumTotal"
                      name="cumTotal"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#059669' }}
                      activeDot={{ r: 6, fill: '#047857' }}
                    />
                  </ComposedChart>
                ) : chartMode === 'stacked' ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 20, left: 5, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{
                        value: 'Total de Telhas no Dia (un)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      formatter={(value) => (
                        <span className="text-xs font-bold text-slate-700">
                          {value === 'translucidas' ? 'Telhas Translúcidas (UV)' : 'Telhas Fibrocimento (Sem Amianto)'}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="translucidas"
                      name="translucidas"
                      fill="#d71920"
                      stackId="telhas"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="fibrocimento"
                      name="fibrocimento"
                      fill="#334155"
                      stackId="telhas"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : chartMode === 'grouped' ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 20, left: 5, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{
                        value: 'Qtd. Telhas Instaladas (un)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      formatter={(value) => (
                        <span className="text-xs font-bold text-slate-700">
                          {value === 'translucidas' ? 'Telhas Translúcidas (UV)' : 'Telhas Fibrocimento (Sem Amianto)'}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="translucidas"
                      name="translucidas"
                      fill="#d71920"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="fibrocimento"
                      name="fibrocimento"
                      fill="#334155"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 15, right: 20, left: 5, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient id="colorCumTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d71920" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#d71920" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorCumTrans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{
                        value: 'Evolução Acumulada (un)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      formatter={(value) => (
                        <span className="text-xs font-bold text-slate-700">
                          {value === 'cumTotal'
                            ? 'Total Acumulado de Telhas'
                            : value === 'cumTranslucidas'
                            ? 'Translúcidas Acumuladas'
                            : 'Fibrocimento Acumulado'}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumTotal"
                      name="cumTotal"
                      stroke="#d71920"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCumTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumTranslucidas"
                      name="cumTranslucidas"
                      stroke="#0284c7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCumTrans)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Weather & Rain Days Indicator Strip */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-700">
                  Dias com Chuva &gt; 5mm (Prorrogação Savoy de +1 dia contratual):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {chartData
                  .filter((c) => c.ganhouDiaAdicional)
                  .map((c) => (
                    <span
                      key={c.dataFull}
                      className="px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 font-mono text-[11px] font-bold border border-blue-200"
                      title={`Chuva de ${c.nivelChuvaMm}mm em ${c.dataFull}`}
                    >
                      {c.data} ({c.nivelChuvaMm}mm)
                    </span>
                  ))}
              </div>
            </div>

            {/* Quick Action to fill report */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400" />
                <span>
                  O gráfico reflete em tempo real os {reports.length} apontamentos limpos e estruturados da base oficial do Prédio 4i1.
                </span>
              </div>
              <button
                onClick={() => setActiveSubTab('form')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#d71920] hover:bg-[#b5141a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Novo Apontamento de Campo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== SUB-TAB 2: FORMULÁRIO DE PREENCHIMENTO (MATCHING IMAGE 2) ==================== */}
        {activeSubTab === 'form' && (
          <form
            onSubmit={handleSubmitReport}
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-6 space-y-8"
          >
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Preenchimento Diário - Serviço de Troca de Telhas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Formulário simplificado de campo. Todas as respostas alimentam diretamente o banco de dados e os gráficos de acompanhamento.
              </p>
            </div>

            {/* SEÇÃO 1: IDENTIFICAÇÃO E EQUIPE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-[#d71920] pl-3 py-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  1. Identificação e Equipe (Hoje)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Data de Preenchimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataPreenchimento}
                    onChange={(e) =>
                      setFormData({ ...formData, dataPreenchimento: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Setor / Prédio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.setorPredio}
                    onChange={(e) =>
                      setFormData({ ...formData, setorPredio: e.target.value })
                    }
                    placeholder="Ex: Prédio 4i1 / Pavilhão A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Responsável pelo Preenchimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.responsavel}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel: e.target.value })
                    }
                    placeholder="Nome completo do responsável"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Equipe / Nome dos Funcionários Presentes e Cargos
                </label>
                <textarea
                  rows={2}
                  value={formData.equipeFuncionarios}
                  onChange={(e) =>
                    setFormData({ ...formData, equipeFuncionarios: e.target.value })
                  }
                  placeholder="Ex: Vanderlei Encarregado, Ezequiel Soldador, Iraldo Caldeireiro, Juliano Resgatista..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                />
              </div>
            </div>

            {/* SEÇÃO 2: EXECUÇÃO DO SERVIÇO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-[#d71920] pl-3 py-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  2. Execução do Serviço (Hoje)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de Serviço / Estrutura Trabalhada no Dia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['Linha de vida', 'Telha Translúcida', 'Telha de Fibrocimento', 'Calhas'].map(
                    (tipo) => {
                      const selected = formData.tiposServico.includes(tipo);
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleCheckboxChange('tiposServico', tipo)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                            selected
                              ? 'bg-red-50 border-[#d71920] text-[#d71920]'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            readOnly
                            className="rounded text-[#d71920] focus:ring-0"
                          />
                          <span>{tipo}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telhas Translúcidas (unidades)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qtdTranslúcidas}
                    onChange={(e) =>
                      setFormData({ ...formData, qtdTranslúcidas: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Acumulado: {summary?.translucidasInstaladas ?? 280} / {summary?.translucidasMeta ?? 1300} un ({summary?.translucidasPercent ?? 21.5}%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telhas Fibrocimento (unidades)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qtdFibrocimento}
                    onChange={(e) =>
                      setFormData({ ...formData, qtdFibrocimento: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Acumulado: {summary?.fibrocimentoInstaladas ?? 97} / {summary?.fibrocimentoMeta ?? 300} un ({summary?.fibrocimentoPercent ?? 32.3}%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Calhas Instaladas (metros)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.metragemCalhas}
                    onChange={(e) =>
                      setFormData({ ...formData, metragemCalhas: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Meta: {summary?.calhasInstaladas ?? 0} de {summary?.calhasMeta ?? 3600}m ({summary?.calhasPercent ?? 0}%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Linha de Vida no Dia (metros)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.metragemLinhaVida}
                    onChange={(e) =>
                      setFormData({ ...formData, metragemLinhaVida: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Última posição: {summary?.linhaVidaInstalada ?? 2000}m / {summary?.linhaVidaMeta ?? 2000}m (a linha de vida não se soma, reflete a última posição)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Status Geral do Serviço no Dia *
                  </label>
                  <select
                    value={formData.statusGeral}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusGeral: e.target.value as 'Em andamento' | 'Concluído' | 'Paralisado',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Paralisado">Paralisado (Chuva, vento ou materiais)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Descrição Detalhada do que foi Executado
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descricaoExecucao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricaoExecucao: e.target.value })
                    }
                    placeholder="Ex: Liberação de PT/PA junto aos bombeiros, aferição de pressão, troca de 25 telhas no eixo oeste..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: CONDIÇÕES CLIMÁTICAS E OPERACIONAIS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-[#d71920] pl-3 py-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  3. Condições Climáticas e Operacionais
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Condições Hábeis para Trabalhar no Telhado
                  </label>
                  <select
                    value={formData.condicoesClimaticas}
                    onChange={(e) =>
                      setFormData({ ...formData, condicoesClimaticas: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Ensolarado / Favorável em todos os períodos">
                      Ensolarado / Favorável em todos os períodos
                    </option>
                    <option value="Parcialmente nublado (Trabalho normal)">
                      Parcialmente nublado (Trabalho normal)
                    </option>
                    <option value="Chuva / Garoa (Trabalho paralisado em altura)">
                      Chuva / Garoa (Trabalho paralisado em altura)
                    </option>
                    <option value="Vento forte acima de 40 km/h">
                      Vento forte acima de 40 km/h
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Períodos Afetados pelo Clima
                  </label>
                  <select
                    value={formData.periodosAfetadosClima}
                    onChange={(e) =>
                      setFormData({ ...formData, periodosAfetadosClima: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Sem paralisação">Sem paralisação</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Manhã, Tarde">Manhã e Tarde (Integral)</option>
                  </select>
                </div>

                {/* ITEM SOLICITADO: NÍVEL DE CHUVA MEDIDO (MM) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                      Nível de Chuva Medido (mm)
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      &gt; 5 mm = +1 Dia Prazo
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.nivelChuvaMm}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = Number(val);
                      setFormData((prev) => ({
                        ...prev,
                        nivelChuvaMm: val,
                        condicoesClimaticas:
                          numVal > 0 ? 'Chuva / Garoa (Trabalho paralisado em altura)' : prev.condicoesClimaticas,
                        statusGeral: numVal > 5 ? 'Paralisado' : prev.statusGeral,
                        periodosAfetadosClima:
                          numVal > 5 && prev.periodosAfetadosClima === 'Sem paralisação'
                            ? 'Manhã, Tarde'
                            : prev.periodosAfetadosClima,
                      }));
                    }}
                    placeholder="Ex: 15 ou 0"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ${
                      Number(formData.nivelChuvaMm) > 5
                        ? 'border-blue-500 text-blue-900 bg-blue-50/50 ring-2 ring-blue-300'
                        : 'border-slate-200 text-slate-800 focus:ring-[#d71920]'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Precipitação aferida no pluviômetro do canteiro
                  </span>
                </div>
              </div>

              {/* FEEDBACK DINÂMICO DA REGRA DE EXTENSÃO DE PRAZO */}
              {Number(formData.nivelChuvaMm) > 5 ? (
                <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
                    <CloudRain className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-blue-900">
                        🌧️ Precipitação de {formData.nivelChuvaMm} mm (&gt; 5 mm) Registrada!
                      </span>
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        +1 DIA NO CALENDÁRIO FINAL
                      </span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      Pela diretriz contratual de intempéries, o <strong>prestador de serviço ganha +1 dia corrido adicional</strong> no prazo final da obra (Início: 17/08/2026, 75 dias base).
                      Ao enviar o formulário, a <strong>IA Samuel</strong> estenderá o calendário de obras e preparará a notificação de WhatsApp automaticamente!
                    </p>
                  </div>
                </div>
              ) : Number(formData.nivelChuvaMm) > 0 ? (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    Chuva leve aferida ({formData.nivelChuvaMm} mm). A prorrogação contratual (+1 dia) ocorre quando a chuva acumulada no dia supera <strong>5 mm</strong>.
                  </span>
                </div>
              ) : null}
            </div>

            {/* SEÇÃO 4: ENTREGA DE MATERIAIS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-[#d71920] pl-3 py-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  4. Entrega de Materiais
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Houve Entrega Programada de Materiais Hoje?
                  </label>
                  <select
                    value={formData.houveEntregaMateriais}
                    onChange={(e) =>
                      setFormData({ ...formData, houveEntregaMateriais: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Não havia entrega prevista para hoje">
                      Não havia entrega prevista para hoje
                    </option>
                    <option value="Sim, entregues conforme planejado">
                      Sim, entregues conforme planejado
                    </option>
                    <option value="Parcialmente entregues">Parcialmente entregues</option>
                    <option value="Não foram entregues">Não foram entregues (Atraso fornecedor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Materiais Recebidos no Canteiro
                  </label>
                  <input
                    type="text"
                    value={formData.materiaisRecebidos}
                    onChange={(e) =>
                      setFormData({ ...formData, materiaisRecebidos: e.target.value })
                    }
                    placeholder="Ex: 3500 parafusos inox, 120 bisnagas de PU, 2 plataformas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: EQUIPAMENTOS E SEGURANÇA */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-[#d71920] pl-3 py-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  5. Equipamentos e Segurança (NR-35)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Equipamentos e Estruturas em Uso
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Ferramentas manuais',
                    'Cabos e acessórios de fixação',
                    'Meios de transporte / Plataforma elevatória / Munck',
                    'Linha de vida',
                  ].map((eq) => {
                    const selected = formData.equipamentosEmUso.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => handleCheckboxChange('equipamentosEmUso', eq)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="rounded text-red-600 focus:ring-0"
                        />
                        <span>{eq}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Condição dos Equipamentos
                  </label>
                  <select
                    value={formData.condicaoEquipamentos}
                    onChange={(e) =>
                      setFormData({ ...formData, condicaoEquipamentos: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Todos operacionais">Todos operacionais</option>
                    <option value="Equipamento em reparo">Equipamento em reparo</option>
                    <option value="Substituição necessária">Substituição necessária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registro de Ocorrências / Incidentes
                  </label>
                  <select
                    value={formData.registroOcorrencias}
                    onChange={(e) =>
                      setFormData({ ...formData, registroOcorrencias: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                  >
                    <option value="Nenhuma ocorrência (Dia 100% seguro)">
                      Nenhuma ocorrência (Dia 100% seguro)
                    </option>
                    <option value="Incidente leve sem afastamento">
                      Incidente leve sem afastamento
                    </option>
                    <option value="Outro">Outro (detalhar)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BOTÃO DE SUBMISSÃO */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Os dados serão salvos permanentemente na base de dados SANY e atualizarão os indicadores em tempo real.
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#d71920] hover:bg-[#b5141a] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando Apontamento...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Salvar e Atualizar Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ==================== SUB-TAB 3: HISTÓRICO DE APONTAMENTOS ==================== */}
        {activeSubTab === 'history' && (
          <div className="space-y-4 mb-6">
            {/* Filtros de Histórico */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por data, descrição, equipe..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Paralisado">Paralisado</option>
                </select>
              </div>
            </div>

            {/* Lista de Relatórios */}
            <div className="space-y-3">
              {filteredReports.map((rep) => {
                const isExpanded = expandedReportId === rep.id;
                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              {new Date(rep.dataPreenchimento + 'T12:00:00').toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              {rep.setorPredio}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {rep.descricaoExecucao}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-2 text-xs">
                          {rep.qtdTranslúcidas > 0 && (
                            <span className="px-2 py-1 rounded bg-red-50 text-[#d71920] font-bold">
                              {rep.qtdTranslúcidas} Translúcidas
                            </span>
                          )}
                          {rep.qtdFibrocimento > 0 && (
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-bold">
                              {rep.qtdFibrocimento} Fibrocimento
                            </span>
                          )}
                          {(Number(rep.metragemLinhaVida) || 0) > 0 && (
                            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-bold" title="Aferição da Linha de Vida no dia (não cumulativo)">
                              🛡️ {rep.metragemLinhaVida}m Linha de Vida
                            </span>
                          )}
                          {(Number(rep.metragemCalhas) || 0) > 0 && (
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold">
                              +{rep.metragemCalhas}m Calhas
                            </span>
                          )}
                          {!(Number(rep.metragemLinhaVida) || 0) && !(Number(rep.metragemCalhas) || 0) && rep.metragem > 0 && (
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold">
                              {rep.metragem}m
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            rep.statusGeral === 'Paralisado'
                              ? 'bg-amber-100 text-amber-800'
                              : rep.statusGeral === 'Concluído'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rep.statusGeral}
                        </span>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px]">
                              Responsável & Equipe
                            </span>
                            <p className="font-medium text-slate-800 mt-0.5">
                              {rep.responsavel}
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              {rep.equipeFuncionarios}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px]">
                              Clima & Paralisação
                            </span>
                            <p className="font-medium text-slate-800 mt-0.5">
                              {rep.condicoesClimaticas}
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              Período afetado: {rep.periodosAfetadosClima}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px]">
                              Materiais Recebidos
                            </span>
                            <p className="font-medium text-slate-800 mt-0.5">
                              {rep.houveEntregaMateriais}
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              {rep.materiaisRecebidos || 'Nenhum'}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px]">
                              Segurança & Ocorrências
                            </span>
                            <p className="font-medium text-slate-800 mt-0.5">
                              {rep.registroOcorrencias}
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              {rep.condicaoEquipamentos}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-slate-500 uppercase text-[10px]">
                            Descrição Completa dos Serviços
                          </span>
                          <p className="font-medium text-slate-800 mt-0.5 bg-white p-3 rounded-xl border border-slate-200">
                            {rep.descricaoExecucao}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE COMUNICADO WHATSAPP DA IA SAMUEL (DIÁRIO / CHUVA / LEMBRETE 08H30) */}
      {whatsappModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {whatsappModal.title}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {whatsappModal.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(null)}
                className="text-white/80 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Target Phone Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Destinatário Oficial WhatsApp
                  </span>
                  <p className="text-sm font-black text-emerald-950 mt-0.5">
                    SVA Engenharia • {whatsappModal.targetPhoneFormatted}
                  </p>
                </div>
                {whatsappModal.isRainExtension && (
                  <div className="text-right">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Chuva &gt; 5 mm (+1 dia ganho)
                    </span>
                    <span className="text-xs font-bold text-blue-900 block mt-0.5">
                      {whatsappModal.rainVolume} mm registrados
                    </span>
                  </div>
                )}
              </div>

              {/* Samuel's WhatsApp Preview Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Mensagem de WhatsApp da IA Samuel:
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{whatsappModal.targetPhoneFormatted}</span>
                </label>
                <div className="bg-[#e5ddd5]/30 border border-emerald-200 rounded-2xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {whatsappModal.whatsappMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={whatsappModal.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappModal.whatsappMessage);
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
              <span>Contrato SANY-CIV-2025/08 • Savoy Campinas</span>
              <button
                onClick={() => setWhatsappModal(null)}
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
