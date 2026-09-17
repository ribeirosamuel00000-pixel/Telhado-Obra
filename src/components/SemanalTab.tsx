import React, { useState, useEffect } from 'react';
import { ConstructionData, SubsystemProgress } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  Save,
  FileText,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Camera,
  Sun,
  Wind,
  CloudRain,
  Share2,
} from 'lucide-react';

interface SemanalTabProps {
  projectData: ConstructionData;
  onProjectUpdate: (newData: ConstructionData) => void;
  onOpenReportModal: () => void;
}

export const SemanalTab: React.FC<SemanalTabProps> = ({
  projectData,
  onProjectUpdate,
  onOpenReportModal,
}) => {
  // Local state for interactive sliders
  const [subsystems, setSubsystems] = useState<SubsystemProgress[]>(projectData?.subsystems || []);
  const [rdoNotes, setRdoNotes] = useState(
    'Semana marcada pela conclusão das fixações mecânicas do quadrante B. O içamento das telhas translúcidas foi parcialmente executado com o caminhão Munck SANY. Aguardando a liberação do lote de policarbonato para finalizar a vedação da cumeeira.'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('Semana 06 (14/Abr - 18/Abr)');

  useEffect(() => {
    if (projectData?.subsystems) {
      setSubsystems(projectData.subsystems);
    }
  }, [projectData?.subsystems]);

  // Dynamic physical progress calculation based on weights
  const calculateDynamicProgress = () => {
    let weightedSum = 0;
    (subsystems || []).forEach((sub) => {
      const weight =
        sub.weight ??
        (sub.id === 'sub-3-1'
          ? 45
          : sub.id === 'sub-3-2'
          ? 20
          : sub.id === 'sub-3-3'
          ? 20
          : sub.id === 'sub-2-0'
          ? 10
          : 5);
      weightedSum += (sub.progressPercent * weight) / 100;
    });
    return Number(weightedSum.toFixed(1));
  };

  const dynamicProgress = calculateDynamicProgress();
  const dynamicDeviation = Number((dynamicProgress - (projectData?.plannedProgress || 72.0)).toFixed(1));

  const handleSliderChange = (id: string, newPercent: number) => {
    setSubsystems((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const executed = Math.round((newPercent / 100) * sub.totalValue);
          return {
            ...sub,
            progressPercent: newPercent,
            executedValue: executed,
            status: newPercent < 70 && sub.id === 'sub-3-2' ? 'delayed' : 'in_progress',
          };
        }
        return sub;
      })
    );
    setSaveSuccess(false);
  };

  const handleSaveMeasurement = async () => {
    setIsSaving(true);
    try {
      const updates = subsystems.map((s) => ({
        id: s.id,
        progressPercent: s.progressPercent,
        executedValue: s.executedValue,
      }));

      const res = await api.updateMeasurement(updates, rdoNotes);
      onProjectUpdate(res.projectData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar medição: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* 1. Header with Protocol & Week Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Boletim de Medição Físico-Financeiro
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Medição Semanal Savoy Campinas
          </h1>
          <p className="text-xs text-slate-500 font-medium">Protocolo: SANY-MED-2025/W06</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-[#d71920]"
          >
            <option value="Semana 05 (07/Abr - 11/Abr)">Semana 05 (07/Abr - 11/Abr)</option>
            <option value="Semana 06 (14/Abr - 18/Abr)">Semana 06 (14/Abr - 18/Abr) - Vigente</option>
            <option value="Semana 07 (21/Abr - 25/Abr)">Semana 07 (21/Abr - 25/Abr) - Futura</option>
          </select>
        </div>
      </div>

      {/* 2. Curva S Interativa com Recálculo Dinâmico */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#d71920]" />
              <h2 className="text-base font-bold text-slate-900">Curva S Savoy Campinas</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Avanço Físico Ponderado dinâmico recalculado pelos subsistemas em tempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Realizado Ponderado</span>
              <span className="font-mono text-xl font-extrabold text-[#d71920]">{dynamicProgress}%</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Meta Planejada</span>
              <span className="font-mono text-xl font-bold text-slate-700">{projectData.plannedProgress}%</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Desvio</span>
              <span
                className={`font-mono text-xl font-bold ${
                  dynamicDeviation < 0 ? 'text-[#d71920]' : 'text-emerald-600'
                }`}
              >
                {dynamicDeviation > 0 ? `+${dynamicDeviation}` : dynamicDeviation}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual SVG S-Curve Chart */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="relative h-44 w-full">
            <svg className="w-full h-full" viewBox="0 0 700 160" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="700" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />

              {/* Planned S-Curve Path (Light Gray/Dashed) */}
              <path
                d="M 20 150 Q 150 140 300 100 T 550 40 T 680 15"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Realized Curve Path up to Week 6 */}
              <path
                d={`M 20 150 Q 150 140 280 115 T 420 ${160 - dynamicProgress * 1.4}`}
                fill="none"
                stroke="#d71920"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Active Current Week 6 Point */}
              <circle
                cx="420"
                cy={160 - dynamicProgress * 1.4}
                r="6"
                fill="#d71920"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Planned point for Week 6 */}
              <circle cx="420" cy="55" r="4" fill="#64748b" />
            </svg>

            {/* Labels on SVG Chart */}
            <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-400">100% Meta</div>
            <div className="absolute bottom-2 left-3 font-mono text-[10px] text-slate-400">0% Início</div>
            <div className="absolute bottom-2 right-3 font-mono text-[10px] text-slate-400">Semana 10 (Final)</div>
            <div className="absolute top-2 right-3 font-mono text-[10px] text-slate-500 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
              <span className="inline-block w-2 h-2 rounded-full bg-[#d71920] mr-1" />
              Realizado ({dynamicProgress}%) vs Planejado (72%)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sliders & Metragem Executada por Subsistema */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ajuste Físico dos Subsistemas</h3>
            <p className="text-xs text-slate-500">Mova os controles deslizantes para simular ou atualizar a medição real</p>
          </div>
          <Sliders className="w-5 h-5 text-slate-400" />
        </div>

        <div className="space-y-4">
          {subsystems.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-xl border transition-all ${
                sub.status === 'delayed'
                  ? 'bg-red-50/40 border-red-200'
                  : 'bg-slate-50/70 border-slate-200/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#d71920]">{sub.itemCode}</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{sub.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      Peso {sub.weight ?? 20}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{sub.norm}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-extrabold text-slate-900">
                    {sub.progressPercent}%
                  </span>
                </div>
              </div>

              {/* Slider Control */}
              <div className="mt-3 space-y-1.5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sub.progressPercent}
                  onChange={(e) => handleSliderChange(sub.id, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d71920]"
                />

                <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>
                    Executado: <strong className="text-slate-900">{sub.executedValue.toLocaleString('pt-BR')} {sub.unit}</strong>
                  </span>
                  <span>
                    Meta Total: <strong>{sub.totalValue.toLocaleString('pt-BR')} {sub.unit}</strong>
                  </span>
                </div>
              </div>

              {sub.status === 'delayed' && (
                <div className="mt-2 text-xs font-medium text-red-700 bg-red-100/60 p-2 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Alerta: Atraso no fornecimento de policarbonato detectado pelo Agente de IA.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. RDO & Fatos Relevantes */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Diário de Obra (RDO) & Fatos Relevantes</h3>
          <span className="text-xs text-slate-500 font-mono">14/Abr a 18/Abr</span>
        </div>

        {/* Climate tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Manhã: Ensolarado 27°C</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-slate-500" />
            <span>Tarde: Rajadas &gt; 25km/h</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>EPIs e NR-35 100% OK</span>
          </span>
        </div>

        <textarea
          rows={4}
          value={rdoNotes}
          onChange={(e) => setRdoNotes(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/20 transition-colors"
          placeholder="Insira as observações do diário de obra..."
        />
      </div>

      {/* 5. Action Buttons Footer */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleSaveMeasurement}
          disabled={isSaving}
          className="flex-1 h-12 bg-[#d71920] hover:bg-[#b9141b] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sincronizando Medição...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Medição Salva com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar e Recalcular Curva S</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenReportModal}
          className="h-12 px-6 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-4 h-4 text-[#d71920]" />
          <span>Gerar Boletim Turnkey (PDF)</span>
        </button>
      </div>
    </div>
  );
};
