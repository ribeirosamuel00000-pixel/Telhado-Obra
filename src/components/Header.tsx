import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConstructionData } from '../types';
import { Bot, Bell, LogOut, User, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  projectData: ConstructionData | null;
  onOpenAIModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, projectData, onOpenAIModal }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const tabLabels: Record<string, string> = {
    telhado: 'Controle de Telhas & Formulário',
    calendario: 'Calendário Operacional (Dia / Semana / Mês)',
    campo: 'Tabela de Campo - Histórico de Preenchimento',
  };

  const pendingApprovalsCount = projectData?.pendingActions?.filter(
    (a) => a.status === 'pending_approval'
  )?.length || 0;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/60">
      <div className="h-20 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Construction Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 px-2.5 py-1 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center shrink-0">
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-xl tracking-tight text-[#d71920]">ROOF REPAIR</span>
              <span className="text-[8px] font-bold tracking-[0.18em] text-slate-500">SANY TURNKEY</span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-slate-900 truncate">
                Turnkey Savoy - Campinas
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs inline-flex items-center gap-1.5 shrink-0 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Em Andamento
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">
              {tabLabels[activeTab] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Agent Trigger Button */}
          <button
            onClick={onOpenAIModal}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              pendingApprovalsCount > 0
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            }`}
            title="Abrir Central do Agente de IA e Aprovações"
          >
            <Bot className="w-4 h-4 text-inherit" />
            <span className="hidden sm:inline">Agente IA</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-red-700 rounded-full text-[10px] font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificações"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {projectData?.alerts && projectData.alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d71920]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Notificações Operacionais & IA
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {(projectData?.alerts || []).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Nenhum alerta pendente</p>
                  ) : (
                    projectData!.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex gap-2.5 items-start"
                      >
                        <div className="p-1 rounded-lg bg-white shadow-xs border border-slate-200 shrink-0 text-[#d71920]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-slate-900 truncate">{alert.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">{alert.time}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{alert.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-1 py-1 pr-2 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#ae0011] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'S'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name?.split(' ')[0] || 'Usuário'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {user?.role === 'developer' ? 'Desenvolvedor' : user?.role === 'engineer' ? 'Engenheiro' : 'Fiscal'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-3 border-b border-slate-100">
                  <p className="font-bold text-sm text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                  {user?.crea && (
                    <span className="mt-1.5 inline-block text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {user.crea}
                    </span>
                  )}
                  {user?.phone && (
                    <p className="text-[11px] text-emerald-700 font-mono mt-1">
                      WhatsApp: {user.phone}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <div className="px-2 py-1.5 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sessão JWT Autenticada</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
