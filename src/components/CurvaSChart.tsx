import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CloudRain,
  ChevronRight,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { RoofDailyReport, ProjectScheduleInfo } from '../types';
import { computeRoofSummary } from '../data/roofData';

interface CurvaSChartProps {
  reports?: RoofDailyReport[];
  scheduleInfo?: ProjectScheduleInfo | null;
  className?: string;
}

export interface WeeklyProgressPoint {
  week: string;
  label: string;
  period: string;
  startDate: string;
  endDate: string;
  plannedAccum: number;
  executedAccum: number | null;
  forecastAccum: number | null;
  deviationAccum: number | null;
  plannedWeekly: number;
  executedWeekly: number | null;
  deviationWeekly: number | null;
  rainDays: number;
  status: 'concluido' | 'atual' | 'futuro';
}

export const CurvaSChart: React.FC<CurvaSChartProps> = ({
  reports = [],
  scheduleInfo,
  className = '',
}) => {
  const [chartView, setChartView] = useState<'all' | 'accum' | 'deviation'>('all');
  const [showTable, setShowTable] = useState(true);

  // Baseline schedule: 12 weeks of Savoy Campinas (17/08/2026 to 09/11/2026)
  const weeklyData = useMemo<WeeklyProgressPoint[]>(() => {
    const rawWeeks = [
      { week: 'Sem 01', label: 'Semana 01', period: '17/08 - 23/08', start: '2026-08-17', end: '2026-08-23', plannedAccum: 6, plannedWeekly: 6 },
      { week: 'Sem 02', label: 'Semana 02', period: '24/08 - 30/08', start: '2026-08-24', end: '2026-08-30', plannedAccum: 15, plannedWeekly: 9 },
      { week: 'Sem 03', label: 'Semana 03', period: '31/08 - 06/09', start: '2026-08-31', end: '2026-09-06', plannedAccum: 25, plannedWeekly: 10 },
      { week: 'Sem 04', label: 'Semana 04', period: '07/09 - 13/09', start: '2026-09-07', end: '2026-09-13', plannedAccum: 38, plannedWeekly: 13 },
      { week: 'Sem 05', label: 'Semana 05', period: '14/09 - 20/09', start: '2026-09-14', end: '2026-09-20', plannedAccum: 50, plannedWeekly: 12 },
      { week: 'Sem 06', label: 'Semana 06', period: '21/09 - 27/09', start: '2026-09-21', end: '2026-09-27', plannedAccum: 62, plannedWeekly: 12 }, // current week
      { week: 'Sem 07', label: 'Semana 07', period: '28/09 - 04/10', start: '2026-09-28', end: '2026-10-04', plannedAccum: 74, plannedWeekly: 12 },
      { week: 'Sem 08', label: 'Semana 08', period: '05/10 - 11/10', start: '2026-10-05', end: '2026-10-11', plannedAccum: 84, plannedWeekly: 10 },
      { week: 'Sem 09', label: 'Semana 09', period: '12/10 - 18/10', start: '2026-10-12', end: '2026-10-18', plannedAccum: 92, plannedWeekly: 8 },
      { week: 'Sem 10', label: 'Semana 10', period: '19/10 - 25/10', start: '2026-10-19', end: '2026-10-25', plannedAccum: 97, plannedWeekly: 5 },
      { week: 'Sem 11', label: 'Semana 11', period: '26/10 - 01/11', start: '2026-10-26', end: '2026-11-01', plannedAccum: 100, plannedWeekly: 3 }, // original deadline
      { week: 'Sem 12', label: 'Semana 12', period: '02/11 - 09/11', start: '2026-11-02', end: '2026-11-09', plannedAccum: 100, plannedWeekly: 0 }, // rain extended
    ];

    const todayStr = '2026-09-23';
    let previousExecutedAccum = 0;

    return rawWeeks.map((w) => {
      // Find reports up to this week's end
      const weekReports = reports.filter((r) => r.dataPreenchimento <= w.end);
      const reportsInThisWeek = reports.filter(
        (r) => r.dataPreenchimento >= w.start && r.dataPreenchimento <= w.end
      );

      const rainDaysInWeek = reportsInThisWeek.filter(
        (r) => (Number(r.nivelChuvaMm) || 0) > 5 || r.chuvaMaior5mm
      ).length;

      const isCurrentWeek = w.start <= todayStr && w.end >= todayStr;
      const isPastWeek = w.end < todayStr;
      const isFutureWeek = w.start > todayStr;

      let executedAccum: number | null = null;
      let executedWeekly: number | null = null;
      let deviationAccum: number | null = null;
      let deviationWeekly: number | null = null;
      let forecastAccum: number | null = null;

      if (isPastWeek || isCurrentWeek) {
        if (weekReports.length > 0) {
          const summary = computeRoofSummary(weekReports);
          executedAccum = summary.progressoTotalPercent;
          executedWeekly = Math.max(0, executedAccum - previousExecutedAccum);
          deviationAccum = Number((executedAccum - w.plannedAccum).toFixed(1));
          deviationWeekly = Number((executedWeekly - w.plannedWeekly).toFixed(1));
          previousExecutedAccum = executedAccum;
        }
      } else {
        // Forecast curve extending to 100% on Week 12
        // Interpolate smoothly from current 38% to 100% across weeks 7 to 12
        const futureCurve: Record<string, number> = {
          'Sem 07': 52,
          'Sem 08': 66,
          'Sem 09': 80,
          'Sem 10': 91,
          'Sem 11': 96,
          'Sem 12': 100,
        };
        forecastAccum = futureCurve[w.week] ?? 100;
      }

      return {
        week: w.week,
        label: w.label,
        period: w.period,
        startDate: w.start,
        endDate: w.end,
        plannedAccum: w.plannedAccum,
        executedAccum,
        forecastAccum,
        deviationAccum,
        plannedWeekly: w.plannedWeekly,
        executedWeekly,
        deviationWeekly,
        rainDays: rainDaysInWeek,
        status: isCurrentWeek ? 'atual' : isPastWeek ? 'concluido' : 'futuro',
      };
    });
  }, [reports]);

  // Current KPIs based on Sem 06 (current week)
  const currentWeekData = weeklyData.find((w) => w.status === 'atual') || weeklyData[5];
  const currentExecuted = currentWeekData?.executedAccum ?? 38;
  const currentPlanned = currentWeekData?.plannedAccum ?? 62;
  const currentDeviation = currentWeekData?.deviationAccum ?? -24;
  const totalRainDays = scheduleInfo?.rainDaysCount ?? 10;
  const finalDeadline = scheduleInfo?.formattedCurrentEndDate ?? '09/11/2026';

  // Custom tooltip formatter
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = weeklyData.find((w) => w.week === label);
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
            <span className="font-extrabold text-sm text-amber-400">
              {dataPoint?.label || label}
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              {dataPoint?.period}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Planejado Acumulado:
              </span>
              <span className="font-mono font-bold text-blue-300">
                {dataPoint?.plannedAccum}%
              </span>
            </div>

            {dataPoint?.executedAccum !== null && dataPoint?.executedAccum !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d71920]" />
                  Executado Realizado:
                </span>
                <span className="font-mono font-extrabold text-red-400">
                  {dataPoint.executedAccum}%
                </span>
              </div>
            )}

            {dataPoint?.forecastAccum !== null && dataPoint?.forecastAccum !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Projeção / Tendência:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {dataPoint.forecastAccum}%
                </span>
              </div>
            )}

            {dataPoint?.deviationAccum !== null && dataPoint?.deviationAccum !== undefined && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Desvio Acumulado:
                </span>
                <span
                  className={`font-mono font-black ${
                    dataPoint.deviationAccum < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {dataPoint.deviationAccum > 0 ? `+${dataPoint.deviationAccum}%` : `${dataPoint.deviationAccum}%`}
                </span>
              </div>
            )}

            {dataPoint?.deviationWeekly !== null && dataPoint?.deviationWeekly !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Desvio na Semana:</span>
                <span
                  className={`font-mono font-bold ${
                    dataPoint.deviationWeekly < 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {dataPoint.deviationWeekly > 0 ? `+${dataPoint.deviationWeekly}%` : `${dataPoint.deviationWeekly}%`}
                </span>
              </div>
            )}

            {dataPoint?.rainDays ? (
              <div className="flex items-center justify-between pt-1 text-[11px] text-cyan-300">
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3" />
                  Dias de Chuva (&gt;5mm):
                </span>
                <span className="font-bold font-mono">+{dataPoint.rainDays} dias</span>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden ${className}`}>
      {/* Header com Título & Controles de Visualização */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 bg-red-600/30 border border-red-500/40 rounded-xl text-red-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                Curva S de Avanço Físico • Planejado vs. Executado
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                12 Semanas Savoy
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Análise de avanço acumulado, desvios semanais de produtividade e impacto de intempéries NR-35
            </p>
          </div>
        </div>

        {/* View mode toggle: Todas as Séries / Apenas Acumulado / Apenas Desvio */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setChartView('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Curva S Completa
            </button>
            <button
              onClick={() => setChartView('accum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'accum'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Acumulado (%)
            </button>
            <button
              onClick={() => setChartView('deviation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'deviation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Desvio Semanal
            </button>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
            title="Alternar tabela analítica semanal"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-300" />
            <span>{showTable ? 'Ocultar Tabela' : 'Ver Tabela'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs de Resumo do Desvio Acumulado & Cronograma */}
      <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 bg-slate-50 border-b border-slate-200">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
            Executado Acumulado
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#d71920]">
              {currentExecuted}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">Semana 06</span>
          </div>
          <span className="text-[11px] text-slate-500">
            517 telhas + 1.600m calhas instaladas
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-blue-600" />
            Meta Planejada (Sem. 06)
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {currentPlanned}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">meta original</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Cronograma base sem prorrogações
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-300 bg-amber-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Desvio Acumulado
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                currentDeviation < 0 ? 'text-[#d71920]' : 'text-emerald-700'
              }`}
            >
              {currentDeviation > 0 ? `+${currentDeviation}%` : `${currentDeviation}%`}
            </span>
            <span className="text-xs text-amber-800 font-semibold">produtividade</span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Impactado por chuvas e paralisações
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Prorrogação Savoy
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              +{totalRainDays} dias
            </span>
            <span className="text-xs text-emerald-800 font-semibold">concedidos</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-bold">
            Nova entrega: {finalDeadline}
          </span>
        </div>
      </div>

      {/* Gráfico Recharts Curva S */}
      <div className="p-4 sm:p-6">
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weeklyData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExecutado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d71920" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d71920" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

              <XAxis
                dataKey="week"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />

              {/* Primary Y Axis for Cumulative Progress (0 - 100%) */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="%"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />

              {/* Secondary Y Axis for Deviation (-30% to +20%) */}
              {(chartView === 'all' || chartView === 'deviation') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[-30, 20]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  unit="%"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
              )}

              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
              />

              {/* Baseline Reference Line at 100% */}
              <ReferenceLine
                yAxisId="left"
                y={100}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: 'Meta Final (100%)', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }}
              />

              {/* Reference Line for Current Week (Sem 06) */}
              <ReferenceLine
                yAxisId="left"
                x="Sem 06"
                stroke="#d71920"
                strokeDasharray="3 3"
                label={{ value: 'Hoje (Semana 06)', fill: '#d71920', fontSize: 10, position: 'top' }}
              />

              {/* Desvio Semanal (Bars on Right Axis) */}
              {(chartView === 'all' || chartView === 'deviation') && (
                <Bar
                  yAxisId="right"
                  dataKey="deviationWeekly"
                  name="Desvio Semanal (%)"
                  fill="#f59e0b"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              )}

              {/* Planned S-Curve (Smooth Area / Line in Blue) */}
              {(chartView === 'all' || chartView === 'accum') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="plannedAccum"
                  name="Planejado Acumulado (%)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPlanejado)"
                />
              )}

              {/* Forecast S-Curve (Green Dashed Line) */}
              {(chartView === 'all' || chartView === 'accum') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="forecastAccum"
                  name="Tendência / Projeção (%)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#059669' }}
                  connectNulls={false}
                />
              )}

              {/* Executed S-Curve (Solid Red Brand Line) */}
              {(chartView === 'all' || chartView === 'accum') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="executedAccum"
                  name="Executado Realizado (%)"
                  stroke="#d71920"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorExecutado)"
                  dot={{ r: 5, fill: '#d71920', strokeWidth: 2, stroke: '#ffffff' }}
                  connectNulls={false}
                />
              )}

              {/* Desvio Acumulado Line */}
              {chartView === 'deviation' && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="deviationAccum"
                  name="Desvio Acumulado (%)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ef4444' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Analítica Semanal de Produtividade & Desvios */}
      {showTable && (
        <div className="border-t border-slate-200">
          <div className="px-5 py-3 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Detalhamento Semanal de Produtividade & Desvio
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Critério: 100% de Linha de Vida (NR-35) mantido fora do cálculo ponderado
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Semana</th>
                  <th className="py-2.5 px-3">Período</th>
                  <th className="py-2.5 px-3 text-right">Planejado Acum.</th>
                  <th className="py-2.5 px-3 text-right">Executado Acum.</th>
                  <th className="py-2.5 px-3 text-right">Desvio Acum.</th>
                  <th className="py-2.5 px-3 text-right">Produt. Semanal</th>
                  <th className="py-2.5 px-3 text-center">Dias Chuva (&gt;5mm)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono">
                {weeklyData.map((row) => {
                  const isCurrent = row.status === 'atual';
                  return (
                    <tr
                      key={row.week}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-amber-50/50 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-800 flex items-center gap-1.5">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
                        <span>{row.week}</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{row.period}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-bold">
                        {row.plannedAccum}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        {row.executedAccum !== null ? (
                          <span className="text-[#d71920]">{row.executedAccum}%</span>
                        ) : (
                          <span className="text-slate-400 font-sans italic">
                            {row.forecastAccum}% (proj.)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        {row.deviationAccum !== null ? (
                          <span
                            className={
                              row.deviationAccum < 0
                                ? 'text-rose-600'
                                : row.deviationAccum > 0
                                ? 'text-emerald-600'
                                : 'text-slate-600'
                            }
                          >
                            {row.deviationAccum > 0 ? `+${row.deviationAccum}%` : `${row.deviationAccum}%`}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-sans">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.executedWeekly !== null ? (
                          <span>
                            {row.executedWeekly}%{' '}
                            <span className="text-[10px] text-slate-400">
                              (meta: {row.plannedWeekly}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-sans">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.rainDays > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                            <CloudRain className="w-3 h-3 text-blue-600" />
                            {row.rainDays} {row.rainDays === 1 ? 'dia' : 'dias'} (+{row.rainDays}d)
                          </span>
                        ) : (
                          <span className="text-slate-300 font-sans text-[11px]">0 dias</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            Semana Atual
                          </span>
                        ) : row.status === 'concluido' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Concluído
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                            Projetado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
