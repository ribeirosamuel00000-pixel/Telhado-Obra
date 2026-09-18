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
import {
  INITIAL_ROOF_REPORTS,
  INITIAL_CALENDAR_TASKS,
  computeRoofSummary,
  computeProjectSchedule,
} from '../data/roofData';
import { firestoreSync } from './firestoreSync';

const TOKEN_KEY = 'sany_turnkey_jwt_token';
const LOCAL_REPORTS_KEY = 'sany_turnkey_roof_reports_v2';
const LOCAL_TASKS_KEY = 'sany_turnkey_calendar_tasks_v2';
const LOCAL_REMINDERS_KEY = 'sany_turnkey_whatsapp_reminders_v2';
const LOCAL_ACTIONS_KEY = 'sany_turnkey_ai_actions_v2';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Client-side persistent cache helpers for Vercel & offline deployments
function getLocalReports(): RoofDailyReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(INITIAL_ROOF_REPORTS));
      return [...INITIAL_ROOF_REPORTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_ROOF_REPORTS.length) {
      // Merge with initial data to make sure no reports are missing
      const existingIds = new Set(parsed.map((r: any) => r.id));
      const merged = [...parsed];
      INITIAL_ROOF_REPORTS.forEach((initReport) => {
        if (!existingIds.has(initReport.id)) {
          merged.push(initReport);
        }
      });
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return [...INITIAL_ROOF_REPORTS];
  }
}

function saveLocalReports(reports: RoofDailyReport[]): void {
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving local reports:', e);
  }
}

function getLocalTasks(): CalendarTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(INITIAL_CALENDAR_TASKS));
      return [...INITIAL_CALENDAR_TASKS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(INITIAL_CALENDAR_TASKS));
      return [...INITIAL_CALENDAR_TASKS];
    }
    return parsed;
  } catch {
    return [...INITIAL_CALENDAR_TASKS];
  }
}

function saveLocalTasks(tasks: CalendarTask[]): void {
  try {
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving local tasks:', e);
  }
}

function getLocalReminders(): WhatsAppReminderRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReminders(reminders: WhatsAppReminderRecord[]): void {
  try {
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Error saving reminders:', e);
  }
}

export const DEFAULT_DEVELOPER_USER: User = {
  id: 'usr-dev-01',
  name: 'Samuel Ribeiro de Souza',
  email: 'souzas@sanygroup.com',
  role: 'developer',
  phone: '(12) 99670-7590',
  title: 'Desenvolvedor & Gestor de Sistemas',
  crea: 'CREA-SP 506.284-D',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
};

// Generates WhatsApp message for SVA Engenharia
function generateLocalSvaReminder(dateStr: string = '2026-09-18'): string {
  const [year, month, day] = dateStr.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  return `🏗️ *SANY TURNKEY • LEMBRETE DIÁRIO DE PREENCHIMENTO RDO*
📅 *Data:* ${formattedDate} | *Horário:* 08:30 (Início das Atividades)
👷 *Destinatário:* SVA Engenharia
📌 *Local:* Obra Turnkey Savoy Campinas / Cobertura Prédio 4i1

Olá, equipe e encarregados da *SVA Engenharia*!

Passando para lembrar da realização do preenchimento obrigatório do *Acompanhamento Diário de Manutenção do Telhado* de hoje (${formattedDate}):

📋 *Itens Essenciais para Registro:*
1. Número de telhas instaladas no dia (Translúcidas e Fibrocimento)
2. Metragem aferida de Calhas e Linhas de Vida
3. Condições climáticas e registro de pluviosidade (> 5mm confere +1 dia no prazo contratual)
4. Efetivo e colaboradores em altura com liberação de PT/PA

🔗 *Link Direto de Preenchimento Público:*
https://ais-dev-zlejd3h4tba6cvx7xgxn55-539765910798.us-east1.run.app/#preenchimento

_Mensagem automática agendada gerada pelo Assistente Virtual Samuel (SANY Engenharia Turnkey)._`;
}

function generateLocalDailyUpdateMessage(
  report: RoofDailyReport,
  summary: RoofProjectSummary,
  scheduleInfo?: ProjectScheduleInfo
): string {
  const [y, m, d] = report.dataPreenchimento.split('-');
  const dataFormatada = `${d}/${m}/${y}`;
  const qtdTrans = Number(report.qtdTranslúcidas) || 0;
  const qtdFibro = Number(report.qtdFibrocimento) || 0;
  const totalTelhasDia = qtdTrans + qtdFibro;
  const metragemLV = Number(report.metragemLinhaVida) || 0;
  const metragemCalhas = Number(report.metragemCalhas) || 0;
  const chuvaMm = Number(report.nivelChuvaMm) || 0;
  const ehChuvaMaior5mm = chuvaMm > 5 || report.chuvaMaior5mm;

  const dataFim = scheduleInfo?.formattedCurrentEndDate || '09/11/2026';
  const diasChuva = scheduleInfo?.rainDaysCount ?? 9;

  return `🏗️ *SANY TURNKEY • ATUALIZAÇÃO DIÁRIA DE COBERTURA*
📅 *Data:* ${dataFormatada} | *Setor:* ${report.setorPredio || 'Prédio 4i1'}
👷 *Fornecedor Executante:* SVA Engenharia (Resp: ${report.responsavel || 'Sávio Rodrigues de Souza'})

✨ *TELHAS INSTALADAS NO DIA:*
• Translúcidas no dia: *+${qtdTrans} un* (Acumulado: ${summary.translucidasInstaladas}/${summary.translucidasMeta} un - ${summary.translucidasPercent}%)
• Fibrocimento no dia: *+${qtdFibro} un* (Acumulado: ${summary.fibrocimentoInstaladas}/${summary.fibrocimentoMeta} un - ${summary.fibrocimentoPercent}%)
• *Total de telhas instaladas no dia:* *${totalTelhasDia} un*

🌦️ *CLIMA & CHUVA:*
• Condição climática: *${report.condicoesClimaticas || 'Estável'}*
• Pluviosidade registrada: *${chuvaMm} mm*
${
  ehChuvaMaior5mm
    ? `⚠️ *ALERTA CONTRATUAL:* Precipitação > 5mm aferida! O fornecedor SVA Engenharia ganha +1 dia no prazo final contratual.`
    : `✅ Sem paralisação impeditiva por chuva no dia (dentro do limite operacional).`
}
• *Prazo Final Atualizado:* *${dataFim}* (75 dias corridos base + ${diasChuva} dias de prorrogação por chuva)

🛡️ *LINHA DE VIDA & CALHAS:*
• Linha de Vida instalada no dia: *${metragemLV}m* (Aferido no dia)
• Calhas instaladas no dia: *${metragemCalhas}m*

📝 *SERVIÇOS EXECUTADOS & OBSERVAÇÕES:*
${report.descricaoExecucao || 'Serviços de cobertura executados conforme plano de ataque diário.'}
${report.registroOcorrencias && report.registroOcorrencias !== 'Nenhuma ocorrência (Dia 100% seguro)' ? `\n⚠️ *Ocorrências:* ${report.registroOcorrencias}` : ''}
${report.descricaoOcorrencia ? `\n📌 *Observações:* ${report.descricaoOcorrencia}` : ''}

👥 *Equipe em Campo:* ${report.equipeFuncionarios || 'Equipe SVA Engenharia'}
📊 *Progresso Geral Ponderado da Obra:* ${summary.progressoTotalPercent}% concluído

_Mensagem gerada pelo Assistente Virtual Samuel (IA SANY)._`;
}

// Client Fallback Router when server is offline or on Vercel static hosting
async function handleClientFallback<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const cleanUrl = url.split('?')[0];

  // 1. Auth Me
  if (cleanUrl === '/api/auth/me') {
    return { user: DEFAULT_DEVELOPER_USER } as unknown as T;
  }

  // 2. Auth Login
  if (cleanUrl === '/api/auth/login') {
    const token = 'sany_turnkey_offline_jwt_token_valid';
    setStoredToken(token);
    return {
      token,
      user: DEFAULT_DEVELOPER_USER,
      message: 'Autenticado com sucesso como Desenvolvedor & Gestor SANY',
    } as unknown as T;
  }

  // 3. Telhas Reports
  if (cleanUrl === '/api/telhas/reports') {
    if (method === 'GET') {
      const reports = getLocalReports();
      return reports as unknown as T;
    }
    if (method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const reports = getLocalReports();
      const tasks = getLocalTasks();

      const chuvaMm = Number(body.nivelChuvaMm) || 0;
      const ehChuvaMaior5mm = chuvaMm > 5 || body.chuvaMaior5mm === true;

      const newId = reports.length > 0 ? Math.max(...reports.map((r) => r.id)) + 1 : 1;
      const newReport: RoofDailyReport = {
        id: newId,
        dataPreenchimento: body.dataPreenchimento || new Date().toISOString().split('T')[0],
        setorPredio: body.setorPredio || 'Prédio 4i1',
        responsavel: body.responsavel || 'Sávio Rodrigues de Souza',
        equipeFuncionarios: body.equipeFuncionarios || 'Equipe SVA Engenharia',
        tiposServico: body.tiposServico || ['Linha de vida'],
        qtdTranslúcidas: Number(body.qtdTranslúcidas) || 0,
        qtdFibrocimento: Number(body.qtdFibrocimento) || 0,
        metragemCalhas: Number(body.metragemCalhas) || 0,
        metragemLinhaVida: Number(body.metragemLinhaVida) || 0,
        metragem: Number(body.metragem) || 0,
        statusGeral: body.statusGeral || 'Em andamento',
        descricaoExecucao: body.descricaoExecucao || '',
        condicoesClimaticas: body.condicoesClimaticas || 'Ensolarado / Favorável em todos os períodos',
        periodosAfetadosClima: body.periodosAfetadosClima || 'Sem paralisação',
        houveEntregaMateriais: body.houveEntregaMateriais || 'Não havia entrega prevista para hoje',
        materiaisRecebidos: body.materiaisRecebidos || 'Nenhum',
        equipamentosEmUso: body.equipamentosEmUso || ['Ferramentas manuais', 'Linha de vida'],
        condicaoEquipamentos: body.condicaoEquipamentos || 'Todos operacionais',
        registroOcorrencias: body.registroOcorrencias || 'Nenhuma ocorrência (Dia 100% seguro)',
        descricaoOcorrencia: body.descricaoOcorrencia || null,
        nivelChuvaMm: chuvaMm,
        chuvaMaior5mm: ehChuvaMaior5mm,
        ganhouDiaAdicional: ehChuvaMaior5mm,
        criadoEm: new Date().toISOString(),
      };

      const updatedReports = [newReport, ...reports];
      saveLocalReports(updatedReports);

      // Add to calendar if rain occurred
      if (ehChuvaMaior5mm) {
        const newTask: CalendarTask = {
          id: `rain-${newReport.dataPreenchimento}-${Date.now()}`,
          title: `🌧️ Chuva Aferida (${chuvaMm}mm) - Extensão Contratual +1 Dia`,
          category: 'chuva',
          date: newReport.dataPreenchimento,
          startTime: '08:00',
          endTime: '17:00',
          status: 'concluida',
          priority: 'alta',
          responsible: newReport.responsavel,
          notes: `Chuva de ${chuvaMm}mm registrada no RDO. +1 dia adicionado ao prazo contratual.`,
          isCompleted: true,
          isRain: true,
          rained: true,
          rainVolumeMm: chuvaMm,
          paralyzedWork: true,
          addedDayToDeadline: true,
        };
        const updatedTasks = [newTask, ...tasks];
        saveLocalTasks(updatedTasks);
      }

      const summary = computeRoofSummary(updatedReports, getLocalTasks());
      const scheduleInfo = summary.scheduleInfo;

      const dailyWhatsappMessage = generateLocalDailyUpdateMessage(newReport, summary, scheduleInfo);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5512996707590&text=${encodeURIComponent(dailyWhatsappMessage)}`;

      return {
        message: 'Apontamento registrado com sucesso!',
        report: newReport,
        summary,
        scheduleInfo,
        whatsappMessage: dailyWhatsappMessage,
        dailyWhatsappMessage,
        targetPhone: '5512996707590',
        targetPhoneFormatted: '+55 (12) 99670-7590',
        whatsappUrl,
        gainedExtraDay: ehChuvaMaior5mm,
      } as unknown as T;
    }
  }

  // 4. Telhas Summary
  if (cleanUrl === '/api/telhas/summary') {
    const reports = getLocalReports();
    const tasks = getLocalTasks();
    const summary = computeRoofSummary(reports, tasks);
    return summary as unknown as T;
  }

  // 5. Calendar Tasks
  if (cleanUrl === '/api/calendar/tasks') {
    if (method === 'GET') {
      const tasks = getLocalTasks();
      return tasks as unknown as T;
    }
    if (method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const tasks = getLocalTasks();
      const newTask: CalendarTask = {
        id: `task-${Date.now()}`,
        title: body.title || 'Nova Atividade',
        category: body.category || 'translúcida',
        date: body.date || new Date().toISOString().split('T')[0],
        startTime: body.startTime || '08:00',
        endTime: body.endTime || '17:00',
        status: body.status || 'programada',
        priority: body.priority || 'media',
        responsible: body.responsible || 'Equipe SANY',
        notes: body.notes || '',
        isCompleted: false,
        isRain: body.isRain || body.category === 'chuva',
        rained: body.rained || false,
        rainVolumeMm: body.rainVolumeMm || 0,
        rainPeriod: body.rainPeriod || '',
        paralyzedWork: body.paralyzedWork || false,
        addedDayToDeadline: body.addedDayToDeadline || (body.rainVolumeMm > 5),
      };
      const updated = [newTask, ...tasks];
      saveLocalTasks(updated);

      const reports = getLocalReports();
      const scheduleInfo = computeProjectSchedule(reports, updated);

      return {
        message: 'Tarefa criada com sucesso',
        task: newTask,
        scheduleInfo,
      } as unknown as T;
    }
  }

  // 6. Toggle Calendar Task
  if (cleanUrl.startsWith('/api/calendar/tasks/') && cleanUrl.endsWith('/toggle')) {
    const parts = cleanUrl.split('/');
    const taskId = parts[parts.length - 2];
    const tasks = getLocalTasks();
    let updatedTask: CalendarTask | null = null;
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.isCompleted;
        updatedTask = {
          ...t,
          isCompleted: nextCompleted,
          status: nextCompleted ? 'concluida' : 'em_andamento',
        };
        return updatedTask;
      }
      return t;
    });
    saveLocalTasks(updatedTasks);
    return {
      message: 'Status atualizado com sucesso',
      task: updatedTask || tasks[0],
    } as unknown as T;
  }

  // 7. Delete Calendar Task
  if (cleanUrl.startsWith('/api/calendar/tasks/') && method === 'DELETE') {
    const parts = cleanUrl.split('/');
    const taskId = parts[parts.length - 1];
    const tasks = getLocalTasks();
    saveLocalTasks(tasks.filter((t) => t.id !== taskId));
    return { message: 'Tarefa removida com sucesso' } as unknown as T;
  }

  // 8. Quick Rain Log
  if (cleanUrl === '/api/calendar/quick-rain') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const tasks = getLocalTasks();
    const reports = getLocalReports();
    const vol = Number(body.rainVolumeMm) || 0;
    const isOver5 = vol > 5;

    const newTask: CalendarTask = {
      id: `rain-${body.date}-${Date.now()}`,
      title: `🌧️ Registro de Chuva (${vol}mm) • ${body.rainPeriod || 'Dia Inteiro'}`,
      category: 'chuva',
      date: body.date,
      startTime: '07:00',
      endTime: '17:00',
      status: 'concluida',
      priority: 'alta',
      responsible: 'Sávio Rodrigues de Souza',
      notes: body.notes || `Chuva aferida no canteiro. ${isOver5 ? '+1 dia adicionado ao prazo contratual Savoy.' : 'Sem impacto impeditivo.'}`,
      isCompleted: true,
      isRain: true,
      rained: true,
      rainVolumeMm: vol,
      rainPeriod: body.rainPeriod,
      paralyzedWork: body.paralyzedWork ?? isOver5,
      addedDayToDeadline: isOver5,
    };

    const updatedTasks = [newTask, ...tasks];
    saveLocalTasks(updatedTasks);

    const scheduleInfo = computeProjectSchedule(reports, updatedTasks);
    return {
      message: 'Chuva registrada com sucesso!',
      task: newTask,
      scheduleInfo,
      gainedExtraDay: isOver5,
    } as unknown as T;
  }

  // 9. WhatsApp Messages
  if (cleanUrl === '/api/ai/daily-update-whatsapp') {
    const reports = getLocalReports();
    const tasks = getLocalTasks();
    const summary = computeRoofSummary(reports, tasks);
    const scheduleInfo = summary.scheduleInfo!;
    const latest = reports[0];
    const dailyWhatsappMessage = generateLocalDailyUpdateMessage(latest, summary, scheduleInfo);
    const targetPhone = '5512996707590';
    const targetPhoneFormatted = '+55 (12) 99670-7590';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(dailyWhatsappMessage)}`;

    return {
      report: latest,
      summary,
      scheduleInfo,
      targetPhone,
      targetPhoneFormatted,
      dailyWhatsappMessage,
      whatsappUrl,
    } as unknown as T;
  }

  if (cleanUrl === '/api/ai/sva-reminder-whatsapp') {
    const dateStr = new Date().toISOString().split('T')[0];
    const reminderMessage = generateLocalSvaReminder(dateStr);
    const targetPhone = '5512974080523';
    const targetPhoneFormatted = '+55 (12) 97408-0523';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(reminderMessage)}`;

    return {
      scheduledTime: '08:30',
      supplier: 'SVA Engenharia',
      targetPhone,
      targetPhoneFormatted,
      reminderMessage,
      whatsappUrl,
    } as unknown as T;
  }

  if (cleanUrl === '/api/ai/trigger-sva-reminder') {
    const dateStr = new Date().toISOString().split('T')[0];
    const reminderMessage = generateLocalSvaReminder(dateStr);
    const targetPhone = '5512974080523';
    const targetPhoneFormatted = '+55 (12) 97408-0523';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(reminderMessage)}`;

    const reminderRecord: WhatsAppReminderRecord = {
      id: `rem-${Date.now()}`,
      scheduledTime: '08:30',
      date: dateStr,
      recipient: 'SVA Engenharia',
      targetPhone,
      targetPhoneFormatted,
      message: reminderMessage,
      status: 'DISPARADO_MANUAL',
      dispatchedAt: new Date().toISOString(),
      whatsappUrl,
      type: 'daily_08h30_reminder',
      deliveredVia: 'whatsapp_direct_link',
    };

    const reminders = getLocalReminders();
    saveLocalReminders([reminderRecord, ...reminders]);

    return {
      message: 'Lembrete diário gerado e pronto para envio no WhatsApp!',
      targetPhone,
      targetPhoneFormatted,
      reminderMessage,
      whatsappUrl,
      reminderRecord,
    } as unknown as T;
  }

  if (cleanUrl === '/api/ai/sva-reminder-status') {
    const reminders = getLocalReminders();
    const today = new Date().toISOString().split('T')[0];
    return {
      active: true,
      scheduledTime: '08:30',
      timeZone: 'America/Sao_Paulo (Horário de Brasília)',
      currentTimeBrasilia: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      supplier: 'SVA Engenharia',
      targetPhone: '5512974080523',
      targetPhoneFormatted: '+55 (12) 97408-0523',
      lastTriggeredDate: reminders[0]?.date || today,
      totalDispatches: reminders.length,
      recentDispatches: reminders.slice(0, 10),
    } as unknown as T;
  }

  if (cleanUrl === '/api/ai/whatsapp-reminders') {
    const reminders = getLocalReminders();
    return {
      reminders,
      count: reminders.length,
    } as unknown as T;
  }

  // 10. Construction Overview
  if (cleanUrl === '/api/construction/overview') {
    const reports = getLocalReports();
    const tasks = getLocalTasks();
    const summary = computeRoofSummary(reports, tasks);

    return {
      projectName: 'Turnkey Savoy Campinas - Manutenção Geral de Telhado Industrial',
      location: 'Campinas / SP - Bloco 4i1',
      contractNumber: 'SANY-CIV-2025/08-SAVOY',
      generalEngineer: 'Eng. Marcos Valério',
      creaNumber: 'CREA-SP 506.284-D',
      status: 'Em Execução Rigorosa',
      currentWeek: 4,
      totalWeeks: 12,
      plannedCompletionDate: summary.scheduleInfo?.formattedCurrentEndDate || '09/11/2026',
      physicalProgress: summary.progressoTotalPercent,
      plannedProgress: 38.0,
      deviationPercent: Number((summary.progressoTotalPercent - 38.0).toFixed(1)),
      delayDays: 0,
      accidentsCount: 0,
      nr35Status: '100% Homologado e Conforme (2.000m de Linha de Vida)',
      weather: {
        city: 'Campinas - SP',
        temperature: '24°C',
        wind: '12 km/h SE',
        condition: 'Estável com monitoramento de frentes úmidas',
        safeForAltitudeWork: true,
      },
      subsystems: [
        {
          id: 'sub-3-2',
          itemCode: 'ITEM 3.2',
          name: 'Telhas Translúcidas Policarbonato Proteção UV',
          norm: 'NBR 14115 e ASTM D3841',
          location: 'Prédio 4i1 Cobertura Geral',
          progressPercent: summary.translucidasPercent,
          targetPercent: 100,
          executedValue: summary.translucidasInstaladas,
          totalValue: summary.translucidasMeta,
          unit: 'unidades',
          weight: 35,
          details: `Instalação de telhas prismáticas de alta transmissão luminosa (${summary.translucidasInstaladas} de ${summary.translucidasMeta} un).`,
          note: `Meta: ${summary.translucidasMeta} un. Executado: ${summary.translucidasInstaladas} un.`,
          status: 'on_track',
        },
        {
          id: 'sub-3-1',
          itemCode: 'ITEM 3.1',
          name: 'Troca de Telhas de Fibrocimento',
          norm: 'NBR 15210 e NBR 7196 sem amianto',
          location: 'Prédio 4i1 Cobertura Industrial',
          progressPercent: summary.fibrocimentoPercent,
          targetPercent: 100,
          executedValue: summary.fibrocimentoInstaladas,
          totalValue: summary.fibrocimentoMeta,
          unit: 'unidades',
          weight: 25,
          details: `Substituição com fixadores de inox e anéis elastoméricos (${summary.fibrocimentoInstaladas} de ${summary.fibrocimentoMeta} un).`,
          note: `Meta: ${summary.fibrocimentoMeta} un. Executado: ${summary.fibrocimentoInstaladas} un.`,
          status: 'on_track',
        },
        {
          id: 'sub-3-3',
          itemCode: 'ITEM 3.3',
          name: 'Calhas & Rufos Galvanizados',
          norm: 'Chapa 24 com vedação PU-40',
          location: 'Perímetro e Calhas Centrais',
          progressPercent: summary.calhasPercent,
          targetPercent: 100,
          executedValue: summary.calhasInstaladas,
          totalValue: summary.calhasMeta,
          unit: 'm lineares',
          weight: 20,
          details: `Assentamento e vedação (${summary.calhasInstaladas} de ${summary.calhasMeta}m).`,
          note: `Meta: ${summary.calhasMeta}m. Executado: ${summary.calhasInstaladas}m.`,
          status: 'on_track',
        },
        {
          id: 'sub-2-0',
          itemCode: 'ITEM 2.0',
          name: 'Linha de Vida & NR-35',
          norm: 'ART Nº SP-2025/89201',
          location: 'Cobertura Integral',
          progressPercent: summary.linhaVidaPercent,
          targetPercent: 100,
          executedValue: summary.linhaVidaInstalada,
          totalValue: summary.linhaVidaMeta,
          unit: 'm lineares',
          weight: 20,
          details: `Laudo de ancoragem para 2.000m concluído (${summary.linhaVidaInstalada} de ${summary.linhaVidaMeta}m).`,
          note: '100% executado e homologado.',
          status: 'completed',
        },
      ],
      wbsTasks: [
        {
          id: 'WBS-01',
          code: 'WBS-01',
          title: 'Mobilização e Instalação de Linhas de Vida (NR-35)',
          status: 'concluido',
          progress: 100,
          responsible: 'Tec. Seg. Juliana Dias',
          responsibleRole: 'Segurança do Trabalho',
          startDatePlanned: '17/08',
          startDateActual: '17/08',
          endDatePlanned: '16/09',
          endDateActual: '16/09',
          observation: '2.000m de linha de vida instalados com laudo e ensaio dinâmico.',
          category: 'inspecao',
          checklists: [
            { item: 'Linhas de Ancoragem Inox 316', status: 'CONFORME' },
            { item: 'Ensaio de Arrancamento Dinâmico', status: 'APROVADO' },
          ],
          detailsText: 'Certificação arquivada junto ao corpo de bombeiros.',
        },
        {
          id: 'WBS-02',
          code: 'WBS-02',
          title: 'Troca de Telhas de Fibrocimento (NBR 15210)',
          status: 'andamento',
          progress: summary.fibrocimentoPercent,
          responsible: 'Mestre Carlos Souza',
          responsibleRole: 'Mestre de Obras',
          startDatePlanned: '18/08',
          startDateActual: '18/08',
          endDatePlanned: '25/10',
          endDateActual: '09/11 (Est.)',
          observation: `${summary.fibrocimentoInstaladas} unidades trocadas com fixadores inox.`,
          category: 'telhado',
          checklists: [
            { item: 'Espessura 6mm sem amianto', status: 'OK' },
            { item: 'Vedação EPDM', status: 'OK' },
          ],
          detailsText: 'Atividades em andamento no setor do Prédio 4i1.',
        },
        {
          id: 'WBS-03',
          code: 'WBS-03',
          title: 'Troca de Telhas Translúcidas UV',
          status: 'andamento',
          progress: summary.translucidasPercent,
          responsible: 'Sávio Rodrigues de Souza',
          responsibleRole: 'SVA Engenharia',
          startDatePlanned: '18/08',
          startDateActual: '18/08',
          endDatePlanned: '31/10',
          endDateActual: '09/11 (Est.)',
          observation: `${summary.translucidasInstaladas} peças instaladas. 2ª remessa recebida.`,
          category: 'telhado',
          checklists: [
            { item: 'Proteção UV Coextrudada', status: 'CONFORME' },
            { item: 'Fita de Alumínio e Respiro', status: 'EM APLICAÇÃO' },
          ],
          detailsText: 'Produção retomada com liberação diária de PT/PA.',
        },
      ],
      alerts: [
        {
          id: 'alt-01',
          type: 'weather',
          title: 'Regra Contratual Savoy: 9 Dias de Chuva (>5mm) Registrados',
          badge: 'Extensão de Prazo',
          description: `Devido às precipitações acima de 5mm, o cronograma foi estendido em +9 dias corridos (Nova data: ${summary.scheduleInfo?.formattedCurrentEndDate || '09/11/2026'}).`,
          urgency: 'medium',
          time: 'Atualizado',
        },
      ],
      pendingActions: [],
      roofSummary: summary,
      scheduleInfo: summary.scheduleInfo,
      lastUpdated: new Date().toISOString(),
    } as unknown as T;
  }

  // Fallback default
  return {} as unknown as T;
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

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';

    // If server returned non-JSON (e.g., Vercel fallback HTML) or 404/500
    if (!res.ok || !contentType.includes('application/json')) {
      return await handleClientFallback<T>(url, options);
    }

    return await res.json();
  } catch {
    // Network error or offline / Vercel SPA host
    return await handleClientFallback<T>(url, options);
  }
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
