import React from 'react';
import { ConstructionData } from '../types';
import { X, Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ConstructionData;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, projectData }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans">
        {/* Header with Print Buttons */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#d71920]" />
            <h2 className="font-bold text-base">Dossiê Gerencial Executivo • Obra Turnkey</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#d71920] hover:bg-[#b9141b] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Printable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white text-slate-900 print:p-0">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-3xl tracking-tighter text-[#d71920]">SANY</span>
              <div>
                <h1 className="text-lg font-bold tracking-tight">RELATÓRIO SEMANAL DE ENGENHARIA CIVIL</h1>
                <p className="text-xs text-slate-500 font-mono">
                  Turnkey Industrial • Contrato {projectData.contractNumber}
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              <p>Eng. Marcos Valério - {projectData.creaNumber}</p>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Obra</span>
              <strong className="text-slate-900">{projectData.projectName}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Localização</span>
              <strong className="text-slate-900">{projectData.location}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Avanço Físico Real</span>
              <strong className="text-[#d71920] font-mono font-bold text-sm">
                {projectData.physicalProgress}% (Meta: {projectData.plannedProgress}%)
              </strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Status Geral</span>
              <strong className="text-amber-700">Atraso Controlado (-4.0%)</strong>
            </div>
          </div>

          {/* Subsystems Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Discriminação de Metragem e Ponderação
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Descrição</th>
                  <th className="p-2.5">Norma</th>
                  <th className="p-2.5 text-right">Executado</th>
                  <th className="p-2.5 text-right">Meta Total</th>
                  <th className="p-2.5 text-right">Avanço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {(projectData?.subsystems || []).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-[#d71920]">{s.itemCode}</td>
                    <td className="p-2.5 font-sans font-medium text-slate-800">{s.name}</td>
                    <td className="p-2.5 font-sans text-slate-500 text-[11px]">{s.norm}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {s.executedValue.toLocaleString('pt-BR')} {s.unit}
                    </td>
                    <td className="p-2.5 text-right text-slate-600">
                      {s.totalValue.toLocaleString('pt-BR')} {s.unit}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{s.progressPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Risk Analysis & Samuel Ribeiro de Souza Action Protocol */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#d71920]" />
              <h4 className="font-bold text-slate-900">
                Parecer do Agente de IA e Medidas de Contingência
              </h4>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Foi identificado desvio negativo de 4.0% no subsistema de telhas translúcidas devido à interrupção na entrega pelo fornecedor Policarbo Brasil.
              O Agente de IA elaborou notificação extrajudicial com prazo de 24h e penalidade contratual de 2% ao dia, sob aprovação do Desenvolvedor e Gestor Samuel Ribeiro de Souza (WhatsApp 12 99870-7590).
            </p>
          </div>

          {/* Signatures Footer */}
          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Eng. Marcos Valério</p>
              <p className="text-slate-500 font-mono">Engenheiro Residente • CREA-SP 506.284-D</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Samuel Ribeiro de Souza</p>
              <p className="text-slate-500 font-mono">Desenvolvedor & Gestor de Projetos SANY</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
