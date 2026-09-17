export type UserRole = 'developer' | 'engineer' | 'safety_inspector' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  title: string;
  crea?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SubsystemProgress {
  id: string;
  itemCode: string;
  name: string;
  norm: string;
  location: string;
  progressPercent: number;
  targetPercent: number;
  executedValue: number;
  totalValue: number;
  unit: string;
  weight?: number;
  details: string;
  note: string;
  status: 'delayed' | 'on_track' | 'attention' | 'completed';
}

export interface WBSTaskChecklistItem {
  item: string;
  status: 'CONFORME' | 'APROVADO' | 'OK' | 'EM APLICAÇÃO' | 'PROGRAMADO' | 'PENDENTE';
}

export interface WBSTask {
  id: string;
  code: string;
  title: string;
  status: 'concluido' | 'andamento' | 'pendente';
  progress: number;
  responsible: string;
  responsibleRole: string;
  startDatePlanned: string;
  startDateActual: string;
  endDatePlanned: string;
  endDateActual: string;
  observation: string;
  category: 'telhado' | 'calhas' | 'inspecao';
  checklists: WBSTaskChecklistItem[];
  detailsText: string;
}

export interface OperationalAlert {
  id: string;
  type: 'weather' | 'equipment' | 'safety' | 'supplier';
  title: string;
  badge: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  time: string;
}

export interface SupplierEmailDraft {
  to: string;
  supplierName: string;
  contactPerson: string;
  subject: string;
  body: string;
  contractRef: string;
  itemsDelayed: string;
  requestedDeadline: string;
}

export interface AIActionRequest {
  id: string;
  title: string;
  type: 'supplier_delay_email' | 'safety_contingency' | 'schedule_catchup' | 'inspection_signoff';
  severity: 'critical' | 'high' | 'medium';
  subsystemId?: string;
  detectedIssue: string;
  delayImpactDays: number;
  actionExplanation: string;
  approverName: string;
  approverRole: string;
  approverPhone: string;
  whatsappMessage: string;
  supplierEmail: SupplierEmailDraft;
  status: 'pending_approval' | 'approved' | 'rejected' | 'email_sent';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  emailSentAt?: string;
  trackingCode?: string;
}

export interface ConstructionData {
  projectName: string;
  location: string;
  contractNumber: string;
  generalEngineer: string;
  creaNumber: string;
  status: string;
  currentWeek: number;
  totalWeeks: number;
  plannedCompletionDate: string;
  physicalProgress: number; // e.g. 68.4
  plannedProgress: number;  // e.g. 72.0
  deviationPercent: number; // e.g. -4.0
  delayDays: number;        // e.g. 1.8
  accidentsCount: number;
  nr35Status: string;
  weather: {
    city: string;
    temperature: string;
    wind: string;
    condition: string;
    safeForAltitudeWork: boolean;
  };
  subsystems: SubsystemProgress[];
  wbsTasks: WBSTask[];
  alerts: OperationalAlert[];
  pendingActions: AIActionRequest[];
  roofSummary?: RoofProjectSummary;
  scheduleInfo?: ProjectScheduleInfo;
  lastUpdated: string;
}

export interface RoofDailyReport {
  id: number;
  dataPreenchimento: string; // YYYY-MM-DD
  setorPredio: string;
  responsavel: string;
  equipeFuncionarios: string;
  tiposServico: string[]; // ['Linha de vida', 'Telha Translúcida', 'Telha de Fibrocimento', 'Calhas']
  qtdTranslúcidas: number;
  qtdFibrocimento: number;
  metragemCalhas?: number; // calhas são 3600
  metragemLinhaVida?: number; // linha de vida são 2000
  metragem?: number; // compatibilidade
  nivelChuvaMm?: number; // Nível de chuva medido (mm). Se > 5mm, ganha +1 dia no prazo final
  chuvaMaior5mm?: boolean;
  ganhouDiaAdicional?: boolean;
  statusGeral: 'Em andamento' | 'Concluído' | 'Paralisado';
  descricaoExecucao: string;
  condicoesClimaticas: string;
  periodosAfetadosClima: string;
  houveEntregaMateriais: string;
  materiaisRecebidos: string;
  equipamentosEmUso: string[];
  condicaoEquipamentos: string;
  registroOcorrencias: string;
  descricaoOcorrencia?: string | null;
  criadoEm: string;
}

export interface ProjectScheduleInfo {
  startDate: string; // '2026-08-17'
  baseDays: number; // 75 dias corridos
  baseEndDate: string; // '2026-10-31'
  rainDaysCount: number; // Quantidade de dias com chuva > 5mm
  rainDates: string[]; // Lista das datas com chuva > 5mm
  totalDaysGranted: number; // 75 + rainDaysCount
  currentEndDate: string; // 'YYYY-MM-DD'
  formattedCurrentEndDate: string; // 'DD/MM/AAAA'
  latestRainEvent?: {
    date: string;
    volumeMm: number;
    whatsappMessage: string;
  };
}

export interface RoofProjectSummary {
  translucidasInstaladas: number;
  translucidasMeta: number;
  translucidasPercent: number; // % em relação ao total
  fibrocimentoInstaladas: number;
  fibrocimentoMeta: number;
  fibrocimentoPercent: number; // % em relação ao total
  calhasInstaladas: number; // meta 3600
  calhasMeta: number;
  calhasPercent: number; // % em relação ao total
  linhaVidaInstalada: number; // meta 2000
  linhaVidaMeta: number;
  linhaVidaPercent: number; // % em relação ao total
  metragemInstalada?: number; // compatibilidade
  metragemMeta?: number;
  progressoTotalPercent: number;
  ultimoStatus: 'Em andamento' | 'Concluído' | 'Paralisado';
  ultimaDataPreenchimento: string;
  responsavelGeral: string;
  totalRelatorios: number;
  scheduleInfo?: ProjectScheduleInfo;
}

export interface CalendarTask {
  id: string;
  title: string;
  category: 'translúcida' | 'fibrocimento' | 'calhas' | 'segurança' | 'bombeiros' | 'logística' | 'chuva';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'programada' | 'em_andamento' | 'concluida' | 'paralisada';
  priority: 'alta' | 'media' | 'baixa';
  responsible: string;
  notes?: string;
  isCompleted?: boolean;
  // Rain collection & telemetry
  isRain?: boolean;
  rained?: boolean; // Choveu no dia?
  rainVolumeMm?: number;
  rainPeriod?: 'manha' | 'tarde' | 'noite' | 'dia_inteiro';
  paralyzedWork?: boolean;
  addedDayToDeadline?: boolean; // Se choveu > 5mm acrescenta 1 dia ao calendário final
}

export interface WhatsAppReminderRecord {
  id: string;
  scheduledTime: string; // '08:30'
  date: string; // YYYY-MM-DD
  recipient: string; // 'SVA Engenharia'
  targetPhone: string; // '5512974080523'
  targetPhoneFormatted: string; // '+55 (12) 97408-0523'
  message: string;
  status: 'AGENDADO' | 'DISPARADO_AUTOMATICO' | 'DISPARADO_MANUAL' | 'FALHA';
  dispatchedAt: string; // ISO string
  whatsappUrl: string;
  type: 'daily_08h30_reminder' | 'daily_report_update' | 'rain_delay_notification';
  deliveredVia?: 'webhook' | 'whatsapp_direct_link' | 'scheduled_agent';
}

export interface SvaReminderSchedulerStatus {
  active: boolean;
  scheduledTime: string;
  timeZone: string;
  currentTimeBrasilia: string;
  supplier: string;
  targetPhone: string;
  targetPhoneFormatted: string;
  lastTriggeredDate: string;
  totalDispatches: number;
  recentDispatches: WhatsAppReminderRecord[];
}
