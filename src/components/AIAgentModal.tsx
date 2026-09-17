import React, { useState } from 'react';
import { ConstructionData, AIActionRequest } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MessageSquare,
  ExternalLink,
  Copy,
  Clock,
  ArrowRight,
  FileText,
  Sparkles,
  RefreshCw,
  Layers,
  Calendar,
  CloudRain,
  TrendingDown,
  Check,
  Building2,
} from 'lucide-react';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ConstructionData | null;
  onProjectUpdate: (newData: ConstructionData) => void;
}

export const AIAgentModal: React.FC<AIAgentModalProps> = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const { user } = useAuth();
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'geral' | 'atrasos' | 'campo' | 'acao'>('geral');
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [svaReminderLoading, setSvaReminderLoading] = useState(false);
  const [svaReminderStatus, setSvaReminderStatus] = useState<string | null>(null);

  if (!isOpen || !projectData) return null;

  const currentAction = projectData.pendingActions?.[0];

  const handleTriggerSvaReminder = async () => {
    setSvaReminderLoading(true);
    setSvaReminderStatus(null);
    try {
      const res = await api.triggerSvaReminder();
      setSvaReminderStatus(`✓ Lembrete disparado e gravado com sucesso no banco de dados para SVA Engenharia (${res.targetPhoneFormatted})!`);
    } catch (e: any) {
      setSvaReminderStatus(`Erro ao disparar lembrete: ${e.message || 'Falha desconhecida'}`);
    } finally {
      setSvaReminderLoading(false);
    }
  };

  const handleRunAnalysis = async (promptOverride?: string) => {
    const promptToSend = promptOverride || customPrompt.trim();
    setIsAnalyzing(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.analyzeProgress(promptToSend || undefined);
      onProjectUpdate(res.projectData);
      setLatestAnalysis(res.analysis);
      setStatusMessage('Análise executada com sucesso pelo Assistente Samuel!');
      setCustomPrompt('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao executar análise do Assistente Samuel.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async (actionId: string) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.approveAction(actionId, 'Aprovado via Central de Comando SANY.');
      onProjectUpdate(res.projectData);
      setStatusMessage('Ação aprovada por Samuel Ribeiro de Souza! O e-mail formal está pronto para disparo.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao aprovar ação.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (actionId: string) => {
    const reason = window.prompt(
      'Informe a justificativa ou ajuste solicitado para a ação:',
      'Ajuste de prazo para 48h antes da notificação'
    );
    if (!reason) return;

    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.rejectAction(actionId, reason);
      onProjectUpdate(res.projectData);
      setStatusMessage('Ação devolvida para ajustes.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao rejeitar ação.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDispatchEmail = async (actionId: string) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.dispatchSupplierEmail(actionId);
      onProjectUpdate(res.projectData);
      setStatusMessage(`E-mail enviado ao fornecedor com sucesso! Protocolo: ${res.trackingCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d71920] flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Assistente Samuel • IA de Engenharia & Gestão de Obra
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Auditoria contínua de telhado, cronograma Gantt, apontamentos de atraso e plano de ação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Internal Sub-navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveView('geral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'geral'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Diagnóstico Geral
          </button>
          <button
            onClick={() => setActiveView('atrasos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'atrasos'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Apontamentos de Atraso
          </button>
          <button
            onClick={() => setActiveView('campo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'campo'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Notas Operacionais & Telhado
          </button>
          {currentAction && (
            <button
              onClick={() => setActiveView('acao')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'acao'
                  ? 'bg-[#d71920] text-white'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <span>Ação Pendente (Samuel)</span>
              {currentAction.status === 'pending_approval' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {/* Diagnostic HUD Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Avanço Físico</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-bold text-[#d71920]">{projectData.physicalProgress}%</span>
                <span className="text-xs text-slate-500 font-mono">/ 72% meta</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 mt-0.5">
                Desvio: {projectData.deviationPercent}%
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Atraso Estimado</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-bold text-amber-600">{projectData.delayDays}</span>
                <span className="text-xs text-slate-500 font-mono">dias úteis</span>
              </div>
              <span className="text-[10px] text-amber-700 font-medium mt-0.5">Item 3.2 em atraso</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gargalo Crítico</span>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate">Policarbo Brasil</p>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">340 m² telhas UV</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gestor Autorizador</span>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate">Samuel Ribeiro de Souza</p>
              <span className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">(12) 99670-7590</span>
            </div>
          </div>

          {/* VIEW 1: DIAGNÓSTICO GERAL */}
          {activeView === 'geral' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#d71920]" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Diagnóstico Executivo do Assistente Samuel
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {latestAnalysis?.diagnosis ||
                    `A obra Turnkey Savoy Campinas encontra-se com avanço físico de ${projectData.physicalProgress}% (meta da Semana 06: ${projectData.plannedProgress}%), resultando em um desvio de ${projectData.deviationPercent}% e atraso de ${projectData.delayDays} dias úteis no caminho crítico. No controle de cobertura do Prédio 4i1, foram instaladas 280 de 1.300 telhas translúcidas e 97 de 300 telhas de fibrocimento, além de 1.000m de calhas e linhas de ancoragem. O ponto que requer atuação prioritária é o desabastecimento de telhas translúcidas UV pelo fornecedor Policarbo Brasil.`}
                </p>

                {/* Recommendations */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Recomendações Prioritárias:</h4>
                  <ul className="space-y-1.5">
                    {(
                      latestAnalysis?.recommendations || [
                        'Disparar notificação formal ao fornecedor Policarbo Brasil com prazo de 24h para envio do lote remanescente de 340m².',
                        'Antecipar o travamento e lonamento provisório de vãos na quinta-feira antes das rajadas de vento previstas para sexta-feira.',
                        'Priorizar o assentamento das telhas de fibrocimento nos setores A e B com a equipe de Sávio Rodrigues.',
                      ]
                    ).map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: APONTAMENTOS DE ATRASO */}
          {activeView === 'atrasos' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Apontamento Detalhado de Atrasos por Frente
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Atraso Geral: {projectData.delayDays} dias úteis
                  </span>
                </div>

                <div className="space-y-3">
                  {(latestAnalysis?.delayBreakdown || [
                    {
                      item: 'Item 3.2 - Telhas Translúcidas Policarbonato UV (WBS-03)',
                      delayDays: projectData.delayDays,
                      cause: 'Atraso na remessa do segundo lote de 340 m² pelo parceiro homologado Policarbo Brasil',
                      impact: 'Impede o avanço da vedação perimetral com PU e ameaça a data do teste de estanqueidade',
                      recommendedAction: 'Disparo de notificação formal com prazo improrrogável de 24 horas sob pena de multa de 2% ao dia',
                    },
                    {
                      item: 'Item 3.3 - Manutenção de Calhas e Rufos (WBS-04)',
                      delayDays: 1,
                      cause: 'Tempo adicional de cura da manta líquida elastomérica nos encontros estruturais',
                      impact: 'Baixo impacto no caminho crítico; equipe recupera no fim de semana',
                      recommendedAction: 'Manter acompanhamento diário sem necessidade de medidas coercitivas',
                    },
                  ]).map((delay: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{delay.item}</span>
                        <span className="text-xs font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                          {delay.delayDays} dias úteis
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong>Causa:</strong> {delay.cause}</p>
                        <p><strong>Impacto:</strong> {delay.impact}</p>
                        <p className="text-emerald-800"><strong>Ação Recomendada:</strong> {delay.recommendedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: NOTAS OPERACIONAIS & TELHADO */}
          {activeView === 'campo' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Apontamentos de Campo, Clima e Segurança
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {(latestAnalysis?.operationalNotes || [
                    'Ventos em Altura: Previsão meteorológica indica rajadas de vento acima de 35 km/h na sexta-feira às 14h. Necessário antecipar o travamento de telhas e lonamento temporário na quinta-feira.',
                    'Liberação de PT/PA: O içamento com o Caminhão Munck SANY está programado para as 07h30 de amanhã. Confirmar liberação da Permissão de Trabalho em Altura junto aos bombeiros industriais.',
                    'Consumo de Insumos: O estoque de fixadores inox com arruelas EPDM e selante PU-40 está com saldo positivo para 4 dias operacionais.',
                    'Segurança NR-35: 100% dos operários certificados e 8 pontos de ancoragem testados sem nenhuma não conformidade.',
                  ]).map((note: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{note}</span>
                    </div>
                  ))}
                </div>

                {/* SVA Engenharia 08h30 Automated WhatsApp Scheduler Status */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Disparo Automático Diário às 08h30 • SVA Engenharia
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                            Agendador Ativo
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Destinatário: <strong className="text-emerald-950 font-bold">SVA Engenharia</strong> • <span className="font-mono font-semibold">+55 (12) 97408-0523</span> • Base de dados sincronizada
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleTriggerSvaReminder}
                        disabled={svaReminderLoading}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {svaReminderLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Gravando...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Testar Disparo Agora</span>
                          </>
                        )}
                      </button>

                      <a
                        href="https://wa.me/5512974080523?text=Ol%C3%A1%2C%20equipe%20SVA%20Engenharia!%20Lembrete%20di%C3%A1rio%20das%2008h30%20para%20preenchimento%20do%20apontamento%20de%20cobertura%20do%20Pr%C3%A9dio%204i1%20Savoy%20Campinas."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Abrir conversa direta com SVA Engenharia no WhatsApp"
                      >
                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                      </a>
                    </div>
                  </div>

                  {svaReminderStatus && (
                    <div className="mt-3 p-2.5 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{svaReminderStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: AÇÃO PENDENTE (SAMUEL APPROVAL) */}
          {(activeView === 'acao' || activeView === 'geral') && currentAction && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{currentAction.title}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Protocolo: {currentAction.id} • Gestor: Samuel Ribeiro de Souza
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {currentAction.status === 'pending_approval' && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Aguardando Aprovação de Samuel Ribeiro de Souza
                    </span>
                  )}
                  {currentAction.status === 'approved' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Aprovado por {currentAction.approvedBy || 'Samuel Ribeiro de Souza'}
                    </span>
                  )}
                  {currentAction.status === 'email_sent' && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      E-mail Despachado ao Fornecedor
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side: WhatsApp vs Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 1. WhatsApp Dispatch Card */}
                <div className="bg-[#eef2f5] rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Mensagem no WhatsApp</p>
                          <p className="text-[11px] text-emerald-800 font-mono font-semibold">
                            Para: Samuel Ribeiro de Souza • (12) 99670-7590
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(currentAction.whatsappMessage, 'whatsapp')}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                        title="Copiar texto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'whatsapp' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                      {currentAction.whatsappMessage}
                    </div>
                  </div>

                  <div className="pt-3">
                    <a
                      href={`https://wa.me/5512996707590?text=${encodeURIComponent(currentAction.whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir no WhatsApp (12) 99670-7590</span>
                    </a>
                  </div>
                </div>

                {/* 2. Supplier Cobranca Email Draft Card */}
                <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#d71920] text-white flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Minuta de E-mail de Cobrança</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            Destinatário: {currentAction.supplierEmail.supplierName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(currentAction.supplierEmail.body, 'email')}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                        title="Copiar e-mail"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 space-y-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500">Para: </span>
                        <span className="font-mono text-slate-800">{currentAction.supplierEmail.to}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Assunto: </span>
                        <span className="font-semibold text-slate-900">{currentAction.supplierEmail.subject}</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap">
                        {currentAction.supplierEmail.body}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Prazo: <strong className="text-slate-800">{currentAction.supplierEmail.requestedDeadline}</strong></span>
                    <span>Multa: <strong className="text-red-700">2% ao dia</strong></span>
                  </div>
                </div>
              </div>

              {/* Approval Controls */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {currentAction.status === 'pending_approval' && (
                    <span>
                      Aprovação sob responsabilidade do Desenvolvedor <strong>Samuel Ribeiro de Souza</strong>.
                    </span>
                  )}
                  {currentAction.status === 'approved' && (
                    <span className="text-emerald-700 font-medium">
                      ✓ Autorização concedida por <strong>{currentAction.approvedBy}</strong>. Pronto para envio.
                    </span>
                  )}
                  {currentAction.status === 'email_sent' && (
                    <span className="text-blue-700 font-medium">
                      ✓ Notificação protocolada via SANY Mail Dispatcher ({currentAction.trackingCode}).
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentAction.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => handleReject(currentAction.id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Solicitar Ajustes
                      </button>
                      <button
                        onClick={() => handleApprove(currentAction.id)}
                        disabled={isActionLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovar Notificação (Samuel Ribeiro de Souza)</span>
                      </button>
                    </>
                  )}

                  {currentAction.status === 'approved' && (
                    <button
                      onClick={() => handleDispatchEmail(currentAction.id)}
                      disabled={isActionLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#d71920] hover:bg-[#b9141b] text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Encaminhar E-mail ao Fornecedor</span>
                    </button>
                  )}

                  {currentAction.status === 'email_sent' && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>E-mail Entregue com Sucesso</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Assistant Samuel Prompt & Query */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d71920]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Perguntar ao Assistente Samuel (Auditoria de Toda a Obra)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Gemini 3 Telemetry</span>
            </div>

            <p className="text-xs text-slate-600">
              O Assistente Samuel analisa todos os dados do aplicativo: telhados (translúcidas e fibrocimento), cronograma Gantt, tarefas do calendário, medições e condições climáticas.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Quais são todos os atrasos atuais e quais apontamentos devo fazer para a equipe?"
                className="flex-1 rounded-xl border border-slate-300 py-2.5 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/20 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
              />
              <button
                onClick={() => handleRunAnalysis()}
                disabled={isAnalyzing}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Consultar Samuel</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Apontamentos Rápidos:</span>
              <button
                onClick={() => {
                  setCustomPrompt('Fazer apontamento completo de todos os atrasos e gargalos de suprimentos da obra');
                  handleRunAnalysis('Fazer apontamento completo de todos os atrasos e gargalos de suprimentos da obra');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                Todos os Atrasos
              </button>
              <button
                onClick={() => {
                  setCustomPrompt('Analisar ritmo de instalação de telhas translúcidas vs fibrocimento no Prédio 4i1');
                  handleRunAnalysis('Analisar ritmo de instalação de telhas translúcidas vs fibrocimento no Prédio 4i1');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                Ritmo Telhas Prédio 4i1
              </button>
              <button
                onClick={() => {
                  setCustomPrompt('Apontamentos de segurança para ventos fortes na sexta-feira e içamento de Munck');
                  handleRunAnalysis('Apontamentos de segurança para ventos fortes na sexta-feira e içamento de Munck');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                Clima & Munck
              </button>
              <button
                onClick={() => {
                  const promptText = 'Como está o calendário de obras com as chuvas acima de 5mm, quantos dias foram acrescidos e qual é a nova data final do projeto?';
                  setCustomPrompt(promptText);
                  handleRunAnalysis(promptText);
                }}
                className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                🌧️ Chuvas & Extensão Prazo
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Assistente Samuel • SANY Engenharia Turnkey do Brasil • Campinas/SP</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

