import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { GanttTab } from './components/GanttTab';
import { CampoTab } from './components/CampoTab';
import { SemanalTab } from './components/SemanalTab';
import { PublicRoofControl } from './components/PublicRoofControl';
import { CalendarTab } from './components/CalendarTab';
import { AIAgentModal } from './components/AIAgentModal';
import { ReportModal } from './components/ReportModal';
import { ConstructionData } from './types';
import { api } from './services/api';
import { firestoreSync } from './services/firestoreSync';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  SlidersHorizontal,
  Bot,
  RefreshCw,
  AlertTriangle,
  Layers,
  Calendar,
  Eye,
  Lock,
} from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'telhado' | 'calendario' | 'campo'>('telhado');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [projectData, setProjectData] = useState<ConstructionData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const loadProjectData = async () => {
    try {
      setDataLoading(true);
      setFetchError(null);
      const data = await api.getOverview();
      setProjectData(data);

      // Async synchronization with Firestore
      Promise.all([api.getRoofReports(), api.getCalendarTasks()]).then(([reports, tasks]) => {
        firestoreSync.seedInitialDataIfEmpty(reports, tasks, data.pendingActions || []);
      }).catch(() => {});
    } catch (err: any) {
      setFetchError(err.message || 'Falha ao carregar dados da obra');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProjectData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#d71920] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 font-mono">
          Validando credenciais criptográficas JWT...
        </p>
      </div>
    );
  }

  // If user is not authenticated: Show Public Roof Control, or Login Page if clicked
  if (!isAuthenticated) {
    if (showLoginModal) {
      return <LoginPage onBackToPublic={() => setShowLoginModal(false)} />;
    }
    return (
      <PublicRoofControl
        onOpenDeveloperLogin={() => setShowLoginModal(true)}
        isDeveloperAuthenticated={false}
      />
    );
  }

  const pendingActionCount = projectData?.pendingActions?.filter(
    (a) => a.status === 'pending_approval'
  )?.length || 0;

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans flex flex-col antialiased selection:bg-[#d71920] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        projectData={projectData}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />

      {/* Main Tab Navigation Subheader */}
      <div className="pt-24 pb-3 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <nav
            className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto w-full sm:w-auto"
            aria-label="Abas do Sistema"
          >
            {/* 1. Telhado (Public Page & Form) */}
            <button
              onClick={() => setActiveTab('telhado')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'telhado'
                  ? 'bg-[#d71920] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Controle Telhas & Formulário</span>
            </button>

            {/* 2. Calendário Operacional (Dia / Semana / Mês) */}
            <button
              onClick={() => setActiveTab('calendario')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'calendario'
                  ? 'bg-[#d71920] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendário da Obra</span>
            </button>

            {/* 3. Tabela de Campo */}
            <button
              onClick={() => setActiveTab('campo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'campo'
                  ? 'bg-[#d71920] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Tabela de Campo</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Desenvolvedor: Samuel Ribeiro
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'telhado' && (
          <PublicRoofControl
            onOpenDeveloperLogin={() => {}}
            isDeveloperAuthenticated={true}
            onNavigateTab={(tab: string) => setActiveTab(tab === 'cronograma' ? 'calendario' : (tab as any))}
          />
        )}

        {activeTab === 'calendario' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-16">
            <CalendarTab />
          </div>
        )}

        {activeTab === 'campo' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-16">
            <CampoTab
              onNavigateTab={(tab: string) => setActiveTab(tab as any)}
            />
          </div>
        )}
      </main>

      {/* AI Agent Modal (Accessible via specific admin actions if needed) */}
      {projectData && isAIModalOpen && (
        <AIAgentModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          projectData={projectData}
          onProjectUpdate={(newData) => setProjectData(newData)}
        />
      )}

      {/* Report Modal */}
      {projectData && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          projectData={projectData}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
