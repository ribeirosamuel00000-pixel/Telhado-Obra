import React, { useState, useEffect, useMemo } from 'react';
import { RoofDailyReport, RoofProjectSummary } from '../types';
import { api } from '../services/api';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  CloudRain,
  Sun,
  Layers,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  MessageSquare,
  Share2,
  Copy,
} from 'lucide-react';

interface CampoTabProps {
  onNavigateTab: (tab: string) => void;
}

export const CampoTab: React.FC<CampoTabProps> = ({ onNavigateTab }) => {
  const [reports, setReports] = useState<RoofDailyReport[]>([]);
  const [summary, setSummary] = useState<RoofProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Concluído' | 'Em andamento' | 'Paralisado'>('todos');
  const [climaFilter, setClimaFilter] = useState<'todos' | 'chuva' | 'bom'>('todos');
  const [selectedReportModal, setSelectedReportModal] = useState<RoofDailyReport | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    title: string;
    subtitle: string;
    targetPhone: string;
    targetPhoneFormatted: string;
    message: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reps, sum] = await Promise.all([
        api.getRoofReports(),
        api.getRoofSummary().catch(() => null),
      ]);
      setReports(reps);
      if (sum) setSummary(sum);
    } catch (err) {
      console.error('Erro ao carregar dados de campo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          r.dataPreenchimento.toLowerCase().includes(term) ||
          r.responsavel.toLowerCase().includes(term) ||
          r.equipeFuncionarios.toLowerCase().includes(term) ||
          r.setorPredio.toLowerCase().includes(term) ||
          r.descricaoExecucao.toLowerCase().includes(term) ||
          (r.materiaisRecebidos && r.materiaisRecebidos.toLowerCase().includes(term));

        const matchesStatus =
          statusFilter === 'todos' || r.statusGeral === statusFilter;

        const isRain =
          r.condicoesClimaticas.toLowerCase().includes('chuva') ||
          (r.nivelChuvaMm && r.nivelChuvaMm > 0) ||
          r.chuvaMaior5mm;

        const matchesClima =
          climaFilter === 'todos' ||
          (climaFilter === 'chuva' && isRain) ||
          (climaFilter === 'bom' && !isRain);

        return matchesSearch && matchesStatus && matchesClima;
      })
      .sort((a, b) => {
        const timeA = new Date(a.dataPreenchimento).getTime();
        const timeB = new Date(b.dataPreenchimento).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [reports, searchTerm, statusFilter, climaFilter, sortOrder]);

  // Aggregate stats from reports
  const stats = useMemo(() => {
    const totalDays = reports.length;
    const totalTrans = reports.reduce((acc, r) => acc + (Number(r.qtdTranslúcidas) || 0), 0);
    const totalFibro = reports.reduce((acc, r) => acc + (Number(r.qtdFibrocimento) || 0), 0);
    const totalCalhas = reports.reduce((acc, r) => acc + (Number(r.metragemCalhas) || 0), 0);
    
    // A linha de vida não é a soma dos dias preenchidos mas sim o total instalado no dia
    const latestReport = reports[0];
    const linhaVidaDia = latestReport && latestReport.metragemLinhaVida !== undefined
      ? Number(latestReport.metragemLinhaVida)
      : (summary?.linhaVidaInstalada || 200);

    const rainDays = reports.filter(
      (r) => (Number(r.nivelChuvaMm) || 0) > 5 || r.chuvaMaior5mm
    ).length;

    return {
      totalDays,
      totalTrans,
      totalFibro,
      totalCalhas,
      linhaVidaDia,
      rainDays,
    };
  }, [reports, summary]);

  // Handlers for WhatsApp Daily Update & SVA 08h30 Reminder
  const handleOpenDailyWhatsApp = async (report?: RoofDailyReport) => {
    try {
      const data = await api.getDailyRoofUpdateWhatsApp(report?.dataPreenchimento);
      setWhatsappModal({
        show: true,
        title: `📱 Atualização Diária WhatsApp • ${report?.dataPreenchimento || 'Último Dia'}`,
        subtitle: `Assistente Samuel • Envio direto para SVA Engenharia (${data.targetPhoneFormatted})`,
        targetPhone: data.targetPhone,
        targetPhoneFormatted: data.targetPhoneFormatted,
        message: data.dailyWhatsappMessage,
        whatsappUrl: data.whatsappUrl,
      });
    } catch (e: any) {
      alert('Erro ao carregar mensagem WhatsApp: ' + (e.message || ''));
    }
  };

  const handleOpenSvaReminder = async () => {
    try {
      const data = await api.getSvaReminderWhatsApp();
      setWhatsappModal({
        show: true,
        title: '⏰ Lembrete Diário 08h30 • SVA Engenharia',
        subtitle: `Assistente Samuel • Disparo diário às 08h30 para (${data.targetPhoneFormatted})`,
        targetPhone: data.targetPhone,
        targetPhoneFormatted: data.targetPhoneFormatted,
        message: data.reminderMessage,
        whatsappUrl: data.whatsappUrl,
      });
    } catch (e: any) {
      alert('Erro ao carregar lembrete das 08h30: ' + (e.message || ''));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Setor/Predio',
      'Responsavel',
      'Equipe',
      'Telhas Translucidas',
      'Telhas Fibrocimento',
      'Calhas (m)',
      'Linha de Vida (m)',
      'Clima',
      'Chuva (mm)',
      'Prorrogacao (+1 dia)',
      'Status',
      'Descricao',
    ];

    const rows = filteredReports.map((r) => [
      `"${r.dataPreenchimento}"`,
      `"${r.setorPredio}"`,
      `"${r.responsavel}"`,
      `"${r.equipeFuncionarios}"`,
      r.qtdTranslúcidas || 0,
      r.qtdFibrocimento || 0,
      r.metragemCalhas || 0,
      r.metragemLinhaVida || 0,
      `"${r.condicoesClimaticas}"`,
      r.nivelChuvaMm || 0,
      (r.nivelChuvaMm && r.nivelChuvaMm > 5) || r.chuvaMaior5mm ? 'SIM' : 'NAO',
      `"${r.statusGeral}"`,
      `"${(r.descricaoExecucao || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Tabela_Campo_Savoy_Campinas_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      return {
        formatted: `${day}/${month}/${year}`,
        weekDay: weekDay.charAt(0).toUpperCase() + weekDay.slice(1),
      };
    } catch {
      return { formatted: dateStr, weekDay: '' };
    }
  };

  return (
    <div className="flex flex-col w-full pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-5 font-sans animate-in fade-in duration-200">
      {/* 1. Header & Title Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-red-100 text-[#d71920] font-black text-xs uppercase tracking-wider">
              Registro de Obras
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Contrato SANY-CIV-2025/08 • Savoy Campinas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#d71920]" />
            Tabela de Campo - Histórico de Preenchimento
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Registro oficial dos dias anteriores preenchidos da cobertura do Prédio 4i1, chuvas registradas e avanço de telhas e linha de vida.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => handleOpenDailyWhatsApp()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
            title="Enviar atualização diária por WhatsApp para (12) 97408-0523"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp (12 97408-0523)</span>
          </button>

          <button
            onClick={handleOpenSvaReminder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
            title="Lembrete diário das 08h30 para fornecedor SVA Engenharia preencher formulário"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Lembrete 08h30 SVA</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            title="Exportar dados para planilha Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Exportar CSV
          </button>

          <button
            onClick={() => onNavigateTab('telhado')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#d71920] hover:bg-red-700 text-white transition-all cursor-pointer shadow-xs"
            title="Abrir formulário de novo apontamento diário"
          >
            <Plus className="w-4 h-4" />
            + Novo Preenchimento
          </button>
        </div>
      </div>

      {/* 2. KPI Telemetry Bar - Resumo Geral Acumulado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Dias Registrados</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalDays}</span>
            <span className="text-xs text-slate-500 font-semibold">dias preenchidos</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Desde 17/08/2026</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Translúcidas</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalTrans}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 1.300 un</span>
          </div>
          <p className="text-[10px] text-amber-600 font-bold mt-1">
            {((stats.totalTrans / 1300) * 100).toFixed(1)}% concluído
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Fibrocimento</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalFibro}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 300 un</span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-1">
            {((stats.totalFibro / 300) * 100).toFixed(1)}% concluído
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Linha de Vida (No Dia)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700">{stats.linhaVidaDia}m</span>
            <span className="text-xs text-slate-400 font-semibold">/ 2.000m meta</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            Total instalado no dia
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Calhas</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalCalhas}m</span>
            <span className="text-xs text-slate-400 font-semibold">/ 3.600m</span>
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-1">
            {((stats.totalCalhas / 3600) * 100).toFixed(1)}% concluído
          </p>
        </div>

        <div className="bg-blue-50/80 rounded-xl p-3.5 border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase">Prorrogação Chuva</span>
            <CloudRain className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-900">+{stats.rainDays}</span>
            <span className="text-xs text-blue-700 font-semibold">dias ganhos</span>
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-1">
            Chuva &gt; 5mm registrada
          </p>
        </div>
      </div>

      {/* 3. Filtros, Busca & Ordenação */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por data (ex: 2026-08), responsável, equipe ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d71920]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['todos', 'Concluído', 'Em andamento', 'Paralisado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'todos' ? 'Todos Status' : st}
              </button>
            ))}
          </div>

          {/* Clima Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setClimaFilter('todos')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                climaFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos Climas
            </button>
            <button
              onClick={() => setClimaFilter('chuva')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                climaFilter === 'chuva' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700'
              }`}
            >
              🌧️ Chuva
            </button>
            <button
              onClick={() => setClimaFilter('bom')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                climaFilter === 'bom' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700'
              }`}
            >
              ☀️ Ensolarado
            </button>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
            title="Inverter ordem das datas"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
          </button>
        </div>
      </div>

      {/* 4. Tabela de Campo Completa */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-[#d71920] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Carregando registros de campo...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum apontamento encontrado</p>
            <p className="text-xs text-slate-500 mt-1">Ajuste os filtros de busca ou cadastre um novo registro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data / Dia</th>
                  <th className="py-3 px-3">Setor</th>
                  <th className="py-3 px-3">Clima / Chuva (mm)</th>
                  <th className="py-3 px-3 text-center">Translúcidas</th>
                  <th className="py-3 px-3 text-center">Fibrocimento</th>
                  <th className="py-3 px-3 text-center">Linha de Vida</th>
                  <th className="py-3 px-3 text-center">Calhas</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">RDO Completo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r) => {
                  const { formatted, weekDay } = formatDate(r.dataPreenchimento);
                  const isRain =
                    (Number(r.nivelChuvaMm) || 0) > 0 ||
                    r.condicoesClimaticas.toLowerCase().includes('chuva') ||
                    r.chuvaMaior5mm;
                  const isMajorRain =
                    (Number(r.nivelChuvaMm) || 0) > 5 || r.chuvaMaior5mm;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isMajorRain ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Data */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <div>
                            <div className="font-extrabold text-slate-900">{formatted}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{weekDay}</div>
                          </div>
                        </div>
                      </td>

                      {/* Setor */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                          {r.setorPredio || 'Prédio 4i1'}
                        </span>
                      </td>

                      {/* Clima / Chuva */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isRain ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isMajorRain
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                <CloudRain className="w-3 h-3" />
                                {r.nivelChuvaMm ? `${r.nivelChuvaMm} mm` : 'Chuva'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                <Sun className="w-3 h-3" />
                                Ensolarado
                              </span>
                            )}

                            {isMajorRain && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-950 font-black text-[9px] border border-blue-300">
                                +1 Dia Contrato
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            {r.condicoesClimaticas}
                          </span>
                        </div>
                      </td>

                      {/* Translúcidas */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {r.qtdTranslúcidas > 0 ? (
                          <span className="font-black text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                            +{r.qtdTranslúcidas} un
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Fibrocimento */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {r.qtdFibrocimento > 0 ? (
                          <span className="font-black text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            +{r.qtdFibrocimento} un
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Linha de Vida */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(r.metragemLinhaVida || 0) > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {r.metragemLinhaVida}m
                            </span>
                            <span
                              className="text-[10px] text-emerald-700 font-semibold mt-0.5"
                              title="Total de linha de vida instalada aferida no dia"
                            >
                              Total no dia
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Calhas */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(r.metragemCalhas || 0) > 0 ? (
                          <span className="font-black text-blue-800 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                            +{r.metragemCalhas}m
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Responsável */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-bold text-xs">{r.responsavel}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1" title={r.equipeFuncionarios}>
                          {r.equipeFuncionarios}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block ${
                            r.statusGeral === 'Paralisado'
                              ? 'bg-amber-100 text-amber-800'
                              : r.statusGeral === 'Concluído'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.statusGeral}
                        </span>
                      </td>

                      {/* Ações / RDO */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDailyWhatsApp(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors border border-emerald-300 mr-1.5 cursor-pointer"
                          title="Enviar atualização deste dia por WhatsApp para (12) 99670-7590"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => setSelectedReportModal(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#d71920] hover:bg-red-50 transition-colors border border-red-200/60 cursor-pointer"
                          title="Visualizar RDO Diário Completo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver RDO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da Tabela */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Exibindo <strong>{filteredReports.length}</strong> de <strong>{reports.length}</strong> dias registrados no diário de obras.
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <CloudRain className="w-3.5 h-3.5" />
              Chuva &gt; 5mm: prorrogação contratual garantida
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DETALHES DO RDO SELECIONADO */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Relatório Diário de Obra (RDO)
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Apontamento do Dia {formatDate(selectedReportModal.dataPreenchimento).formatted}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReportModal.setorPredio} • {selectedReportModal.responsavel}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clima & Alerta de Chuva */}
            <div
              className={`p-3.5 rounded-xl border ${
                selectedReportModal.chuvaMaior5mm || (selectedReportModal.nivelChuvaMm && selectedReportModal.nivelChuvaMm > 5)
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  Condições Climáticas & Precipitação
                </span>
                {selectedReportModal.nivelChuvaMm ? (
                  <span className="px-2 py-0.5 rounded-full font-black text-xs bg-blue-600 text-white">
                    {selectedReportModal.nivelChuvaMm} mm medidos
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Sem chuva medida</span>
                )}
              </div>
              <p className="text-xs mt-1 font-medium">{selectedReportModal.condicoesClimaticas}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Período afetado: <strong>{selectedReportModal.periodosAfetadosClima || 'Sem paralisação'}</strong>
              </p>
              {(selectedReportModal.chuvaMaior5mm || (selectedReportModal.nivelChuvaMm && selectedReportModal.nivelChuvaMm > 5)) && (
                <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-2 text-xs font-bold text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Gera prorrogação de +1 dia corrido no calendário final do contrato Savoy.
                </div>
              )}
            </div>

            {/* Produção do Dia */}
            <div>
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Produção Executada no Dia
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Translúcidas</span>
                  <span className="text-lg font-black text-amber-700">
                    {selectedReportModal.qtdTranslúcidas} un
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Fibrocimento</span>
                  <span className="text-lg font-black text-slate-800">
                    {selectedReportModal.qtdFibrocimento} un
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Linha de Vida</span>
                  <span className="text-lg font-black text-emerald-700">
                    {selectedReportModal.metragemLinhaVida || 0}m
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Calhas</span>
                  <span className="text-lg font-black text-blue-700">
                    {selectedReportModal.metragemCalhas || 0}m
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição Detalhada dos Serviços */}
            <div>
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Descrição dos Serviços Realizados
              </span>
              <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                {selectedReportModal.descricaoExecucao}
              </div>
            </div>

            {/* Equipe & Recursos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">
                  Equipe de Funcionários
                </span>
                <p className="font-medium text-slate-800 mt-1">
                  {selectedReportModal.equipeFuncionarios}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">
                  Materiais Recebidos
                </span>
                <p className="font-medium text-slate-800 mt-1">
                  {selectedReportModal.materiaisRecebidos || 'Nenhum material recebido hoje'}
                </p>
              </div>
            </div>

            {/* Segurança & Conformidade */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold text-emerald-950 block">Conformidade NR-35 & Segurança</span>
                  <span className="text-[11px] text-emerald-800">
                    {selectedReportModal.registroOcorrencias || 'Nenhuma ocorrência (Dia 100% seguro)'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                Liberado PT/PA
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const rep = selectedReportModal;
                  setSelectedReportModal(null);
                  handleOpenDailyWhatsApp(rep);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar este RDO no WhatsApp (12 99670-7590)</span>
              </button>

              <button
                onClick={() => setSelectedReportModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPARO WHATSAPP DA IA SAMUEL (ATUALIZAÇÃO DIÁRIA & LEMBRETE 08H30) */}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{whatsappModal.title}</h3>
                  <p className="text-xs text-emerald-100">{whatsappModal.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(null)}
                className="text-white/80 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Target Phone Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Destinatário Oficial</span>
                  <span className="text-sm font-black text-emerald-950">
                    SVA Engenharia • {whatsappModal.targetPhoneFormatted}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                  WhatsApp Direto
                </span>
              </div>

              {/* Message Preview Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Mensagem Formatada pelo Agente IA:</span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{whatsappModal.targetPhoneFormatted}</span>
                </label>
                <div className="bg-[#e5ddd5]/30 border border-emerald-200 rounded-2xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {whatsappModal.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
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
                    navigator.clipboard.writeText(whatsappModal.message);
                    setCopiedModal(true);
                    setTimeout(() => setCopiedModal(false), 3000);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedModal ? '✓ Copiado!' : 'Copiar Mensagem'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Savoy Campinas • IA Samuel</span>
              <button
                onClick={() => setWhatsappModal(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
