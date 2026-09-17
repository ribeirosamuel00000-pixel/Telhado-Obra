import {
  ConstructionData,
  User,
  AIActionRequest,
  RoofDailyReport,
  RoofProjectSummary,
  CalendarTask,
  ProjectScheduleInfo,
  WhatsAppReminderRecord,
  SvaReminderSchedulerStatus,
} from '../types';
import { firestoreSync } from './firestoreSync';

const TOKEN_KEY = 'sany_turnkey_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; message: string }> {
    const res = await request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  // Construction
  async getOverview(): Promise<ConstructionData> {
    return request<ConstructionData>('/api/construction/overview');
  },

  async updateMeasurement(
    subsystemsUpdates: { id: string; progressPercent: number; executedValue?: number }[],
    rdoNotes?: string
  ): Promise<{ message: string; projectData: ConstructionData }> {
    return request<{ message: string; projectData: ConstructionData }>('/api/construction/measurement', {
      method: 'POST',
      body: JSON.stringify({ subsystemsUpdates, rdoNotes }),
    });
  },

  // AI Agent
  async analyzeProgress(customQuery?: string): Promise<{
    message: string;
    analysis: any;
    newAction: AIActionRequest;
    projectData: ConstructionData;
  }> {
    return request<{
      message: string;
      analysis: any;
      newAction: AIActionRequest;
      projectData: ConstructionData;
    }>('/api/ai/analyze-progress', {
      method: 'POST',
      body: JSON.stringify({ customQuery }),
    });
  },

  async approveAction(actionId: string, approverNotes?: string): Promise<{
    message: string;
    action: AIActionRequest;
    projectData: ConstructionData;
  }> {
    const res = await request<{
      message: string;
      action: AIActionRequest;
      projectData: ConstructionData;
    }>('/api/ai/approve-action', {
      method: 'POST',
      body: JSON.stringify({ actionId, approverNotes }),
    });
    if (res.action) {
      firestoreSync.saveAIAction(res.action).catch(() => {});
    }
    return res;
  },

  async rejectAction(actionId: string, reason?: string): Promise<{
    message: string;
    action: AIActionRequest;
    projectData: ConstructionData;
  }> {
    const res = await request<{
      message: string;
      action: AIActionRequest;
      projectData: ConstructionData;
    }>('/api/ai/reject-action', {
      method: 'POST',
      body: JSON.stringify({ actionId, reason }),
    });
    if (res.action) {
      firestoreSync.saveAIAction(res.action).catch(() => {});
    }
    return res;
  },

  async dispatchSupplierEmail(actionId: string): Promise<{
    message: string;
    trackingCode: string;
    action: AIActionRequest;
    projectData: ConstructionData;
  }> {
    const res = await request<{
      message: string;
      trackingCode: string;
      action: AIActionRequest;
      projectData: ConstructionData;
    }>('/api/ai/dispatch-supplier-email', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    });
    if (res.action) {
      firestoreSync.saveAIAction(res.action).catch(() => {});
    }
    return res;
  },

  // Roof Tile Inspection Service (Public & Operational)
  async getRoofSummary(): Promise<RoofProjectSummary> {
    return request<RoofProjectSummary>('/api/telhas/summary');
  },

  async getRoofReports(): Promise<RoofDailyReport[]> {
    return request<RoofDailyReport[]>('/api/telhas/reports');
  },

  async submitRoofReport(report: Partial<RoofDailyReport>): Promise<{
    message: string;
    report: RoofDailyReport;
    summary: RoofProjectSummary;
    scheduleInfo?: ProjectScheduleInfo;
    whatsappMessage?: string;
    dailyWhatsappMessage?: string;
    targetPhone?: string;
    targetPhoneFormatted?: string;
    whatsappUrl?: string;
    gainedExtraDay?: boolean;
  }> {
    const res = await request<{
      message: string;
      report: RoofDailyReport;
      summary: RoofProjectSummary;
      scheduleInfo?: ProjectScheduleInfo;
      whatsappMessage?: string;
      dailyWhatsappMessage?: string;
      targetPhone?: string;
      targetPhoneFormatted?: string;
      whatsappUrl?: string;
      gainedExtraDay?: boolean;
    }>('/api/telhas/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
    if (res.report) {
      firestoreSync.saveRoofReport(res.report).catch(() => {});
    }
    return res;
  },

  // Operational Calendar (Day / Week / Month)
  async getCalendarTasks(date?: string): Promise<CalendarTask[]> {
    const url = date ? `/api/calendar/tasks?date=${encodeURIComponent(date)}` : '/api/calendar/tasks';
    return request<CalendarTask[]>(url);
  },

  async createCalendarTask(task: Partial<CalendarTask>): Promise<{
    message: string;
    task: CalendarTask;
    scheduleInfo?: ProjectScheduleInfo;
    whatsappMessage?: string;
  }> {
    const res = await request<{
      message: string;
      task: CalendarTask;
      scheduleInfo?: ProjectScheduleInfo;
      whatsappMessage?: string;
    }>('/api/calendar/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    if (res.task) {
      firestoreSync.saveCalendarTask(res.task).catch(() => {});
    }
    return res;
  },

  async toggleCalendarTask(id: string): Promise<{
    message: string;
    task: CalendarTask;
  }> {
    const res = await request<{
      message: string;
      task: CalendarTask;
    }>(`/api/calendar/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
    if (res.task) {
      firestoreSync.saveCalendarTask(res.task).catch(() => {});
    }
    return res;
  },

  async deleteCalendarTask(id: string): Promise<{ message: string }> {
    const res = await request<{ message: string }>(`/api/calendar/tasks/${id}`, {
      method: 'DELETE',
    });
    firestoreSync.deleteCalendarTask(id).catch(() => {});
    return res;
  },

  async quickRainLog(data: {
    date: string;
    rained: boolean;
    rainVolumeMm?: number;
    rainPeriod?: 'manha' | 'tarde' | 'noite' | 'dia_inteiro';
    paralyzedWork?: boolean;
    notes?: string;
  }): Promise<{
    message: string;
    task: CalendarTask;
    scheduleInfo?: ProjectScheduleInfo;
    whatsappMessage?: string;
    gainedExtraDay?: boolean;
  }> {
    const res = await request<{
      message: string;
      task: CalendarTask;
      scheduleInfo?: ProjectScheduleInfo;
      whatsappMessage?: string;
      gainedExtraDay?: boolean;
    }>('/api/calendar/quick-rain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.task) {
      firestoreSync.saveCalendarTask(res.task).catch(() => {});
    }
    return res;
  },

  async getRainWhatsAppMessage(date?: string): Promise<{
    scheduleInfo: ProjectScheduleInfo;
    latestRainEvent?: any;
    whatsappMessage: string;
  }> {
    const url = date ? `/api/ai/rain-whatsapp-message?date=${encodeURIComponent(date)}` : '/api/ai/rain-whatsapp-message';
    return request<{
      scheduleInfo: ProjectScheduleInfo;
      latestRainEvent?: any;
      whatsappMessage: string;
    }>(url);
  },

  async getDailyRoofUpdateWhatsApp(date?: string): Promise<{
    report: RoofDailyReport;
    summary: RoofProjectSummary;
    scheduleInfo: ProjectScheduleInfo;
    targetPhone: string;
    targetPhoneFormatted: string;
    dailyWhatsappMessage: string;
    whatsappUrl: string;
  }> {
    const url = date ? `/api/ai/daily-update-whatsapp?date=${encodeURIComponent(date)}` : '/api/ai/daily-update-whatsapp';
    return request(url);
  },

  async getSvaReminderWhatsApp(date?: string): Promise<{
    scheduledTime: string;
    supplier: string;
    targetPhone: string;
    targetPhoneFormatted: string;
    reminderMessage: string;
    whatsappUrl: string;
  }> {
    const url = date ? `/api/ai/sva-reminder-whatsapp?date=${encodeURIComponent(date)}` : '/api/ai/sva-reminder-whatsapp';
    return request(url);
  },

  async triggerSvaReminder(): Promise<{
    message: string;
    targetPhone: string;
    targetPhoneFormatted: string;
    reminderMessage: string;
    whatsappUrl: string;
    reminderRecord?: WhatsAppReminderRecord;
  }> {
    const res = await request<{
      message: string;
      targetPhone: string;
      targetPhoneFormatted: string;
      reminderMessage: string;
      whatsappUrl: string;
      reminderRecord?: WhatsAppReminderRecord;
    }>('/api/ai/trigger-sva-reminder', {
      method: 'POST',
    });
    if (res.reminderRecord) {
      firestoreSync.saveWhatsAppReminder(res.reminderRecord).catch(() => {});
    }
    return res;
  },

  async getSvaReminderStatus(): Promise<SvaReminderSchedulerStatus> {
    return request<SvaReminderSchedulerStatus>('/api/ai/sva-reminder-status');
  },

  async getWhatsAppReminders(): Promise<{
    reminders: WhatsAppReminderRecord[];
    count: number;
  }> {
    return request<{
      reminders: WhatsAppReminderRecord[];
      count: number;
    }>('/api/ai/whatsapp-reminders');
  },
};
