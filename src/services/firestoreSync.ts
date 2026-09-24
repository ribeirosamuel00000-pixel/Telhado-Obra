import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import {
  RoofDailyReport,
  CalendarTask,
  AIActionRequest,
  WhatsAppReminderRecord,
  WeatherAlert,
} from '../types';

export interface SyncStats {
  success: boolean;
  syncedReports: number;
  syncedTasks: number;
  syncedAlerts: number;
  timestamp: string;
  message: string;
}

export const firestoreSync = {
  // Check live connection
  async checkConnection(): Promise<boolean> {
    return await testFirestoreConnection();
  },

  // Save single roof report to Firestore
  async saveRoofReport(report: RoofDailyReport): Promise<void> {
    const path = 'roof_reports';
    const docId = `rdo-${report.id}`;
    try {
      await setDoc(
        doc(db, path, docId),
        {
          id: String(report.id),
          dataPreenchimento: report.dataPreenchimento || new Date().toISOString().split('T')[0],
          setorPredio: report.setorPredio || 'Prédio 4i1',
          responsavel: report.responsavel || 'Sávio Rodrigues',
          equipeFuncionarios: report.equipeFuncionarios || 'Equipe SVA Montagem',
          tiposServico: report.tiposServico || [],
          qtdTranslúcidas: Number(report.qtdTranslúcidas) || 0,
          qtdFibrocimento: Number(report.qtdFibrocimento) || 0,
          metragemCalhas: Number(report.metragemCalhas) || 0,
          metragemLinhaVida: Number(report.metragemLinhaVida) || 0,
          metragem: Number(report.metragem) || 0,
          nivelChuvaMm: Number(report.nivelChuvaMm) || 0,
          chuvaMaior5mm: Boolean(report.chuvaMaior5mm || (Number(report.nivelChuvaMm) || 0) > 5),
          ganhouDiaAdicional: Boolean(report.ganhouDiaAdicional || (Number(report.nivelChuvaMm) || 0) > 5),
          statusGeral: report.statusGeral || 'Em andamento',
          descricaoExecucao: report.descricaoExecucao || '',
          condicoesClimaticas: report.condicoesClimaticas || 'Ensolarado / Favorável em todos os períodos',
          periodosAfetadosClima: report.periodosAfetadosClima || 'Sem paralisação',
          houveEntregaMateriais: report.houveEntregaMateriais || 'Não havia entrega prevista para hoje',
          materiaisRecebidos: report.materiaisRecebidos || '',
          equipamentosEmUso: report.equipamentosEmUso || [],
          condicaoEquipamentos: report.condicaoEquipamentos || 'Todos operacionais',
          registroOcorrencias: report.registroOcorrencias || 'Nenhuma ocorrência (Dia 100% seguro)',
          descricaoOcorrencia: report.descricaoOcorrencia || null,
          criadoEm: report.criadoEm || new Date().toISOString(),
          sincronizadoEm: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Get all roof reports from Firestore
  async getAllRoofReports(): Promise<RoofDailyReport[]> {
    const path = 'roof_reports';
    try {
      const snapshot = await getDocs(collection(db, path));
      if (snapshot.empty) return [];

      const reports: RoofDailyReport[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        reports.push({
          id: Number(d.id) || Number(snap.id.replace('rdo-', '')) || 0,
          dataPreenchimento: d.dataPreenchimento || '',
          setorPredio: d.setorPredio || d.predio || 'Prédio 4i1',
          responsavel: d.responsavel || '',
          equipeFuncionarios: d.equipeFuncionarios || '',
          tiposServico: d.tiposServico || ['Linha de vida', 'Telha Translúcida', 'Telha de Fibrocimento', 'Calhas'],
          qtdTranslúcidas: Number(d.qtdTranslúcidas) || 0,
          qtdFibrocimento: Number(d.qtdFibrocimento) || 0,
          metragemCalhas: Number(d.metragemCalhas) || 0,
          metragemLinhaVida: Number(d.metragemLinhaVida) || 0,
          metragem: Number(d.metragem) || 0,
          nivelChuvaMm: Number(d.nivelChuvaMm) || 0,
          chuvaMaior5mm: Boolean(d.chuvaMaior5mm),
          ganhouDiaAdicional: Boolean(d.ganhouDiaAdicional),
          statusGeral: d.statusGeral || 'Em andamento',
          descricaoExecucao: d.descricaoExecucao || d.observacoes || '',
          condicoesClimaticas: d.condicoesClimaticas || '',
          periodosAfetadosClima: d.periodosAfetadosClima || 'Sem paralisação',
          houveEntregaMateriais: d.houveEntregaMateriais || '',
          materiaisRecebidos: d.materiaisRecebidos || '',
          equipamentosEmUso: d.equipamentosEmUso || [],
          condicaoEquipamentos: d.condicaoEquipamentos || 'Todos operacionais',
          registroOcorrencias: d.registroOcorrencias || 'Nenhuma ocorrência',
          descricaoOcorrencia: d.descricaoOcorrencia || null,
          criadoEm: d.criadoEm || '',
        });
      });

      return reports.sort((a, b) => a.dataPreenchimento.localeCompare(b.dataPreenchimento));
    } catch (error) {
      console.warn('Erro ao ler roof_reports do Firestore:', error);
      return [];
    }
  },

  // Save calendar task to Firestore
  async saveCalendarTask(task: CalendarTask): Promise<void> {
    const path = 'calendar_tasks';
    const docId = task.id;
    try {
      await setDoc(
        doc(db, path, docId),
        {
          id: task.id,
          title: task.title,
          date: task.date,
          startTime: task.startTime || '08:00',
          endTime: task.endTime || '17:00',
          responsible: task.responsible || 'Equipe SANY',
          category: task.category || 'translúcida',
          status: task.status || 'programada',
          priority: task.priority || 'media',
          predio: 'Prédio 4i1',
          isRain: Boolean(task.isRain || task.category === 'chuva'),
          rained: Boolean(task.rained),
          rainVolumeMm: Number(task.rainVolumeMm) || 0,
          rainPeriod: task.rainPeriod || '',
          paralyzedWork: Boolean(task.paralyzedWork),
          addedDayToDeadline: Boolean(task.addedDayToDeadline || (Number(task.rainVolumeMm) || 0) > 5),
          notes: task.notes || '',
          createdAt: new Date().toISOString(),
          sincronizadoEm: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Get all calendar tasks from Firestore
  async getAllCalendarTasks(): Promise<CalendarTask[]> {
    const path = 'calendar_tasks';
    try {
      const snapshot = await getDocs(collection(db, path));
      if (snapshot.empty) return [];

      const tasks: CalendarTask[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        tasks.push({
          id: d.id || snap.id,
          title: d.title || '',
          date: d.date || '',
          startTime: d.startTime || '08:00',
          endTime: d.endTime || '17:00',
          responsible: d.responsible || 'Equipe SANY',
          category: d.category || 'translúcida',
          status: d.status || 'programada',
          priority: d.priority || 'media',
          notes: d.notes || '',
          isRain: Boolean(d.isRain),
          rained: Boolean(d.rained),
          rainVolumeMm: Number(d.rainVolumeMm) || 0,
          rainPeriod: d.rainPeriod || undefined,
          paralyzedWork: Boolean(d.paralyzedWork),
          addedDayToDeadline: Boolean(d.addedDayToDeadline),
        });
      });

      return tasks.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.warn('Erro ao ler calendar_tasks do Firestore:', error);
      return [];
    }
  },

  // Delete calendar task from Firestore
  async deleteCalendarTask(taskId: string): Promise<void> {
    const path = 'calendar_tasks';
    try {
      await deleteDoc(doc(db, path, taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${taskId}`);
    }
  },

  // Save Weather Alert (Gemini AI)
  async saveWeatherAlert(alert: WeatherAlert): Promise<void> {
    const path = 'weather_alerts';
    const docId = alert.id;
    try {
      await setDoc(
        doc(db, path, docId),
        {
          id: alert.id,
          date: alert.date,
          location: alert.location || 'Savoy Campinas / SP',
          city: alert.city || 'Campinas',
          riskLevel: alert.riskLevel,
          expectedRainMm: Number(alert.expectedRainMm) || 0,
          probabilityPercent: Number(alert.probabilityPercent) || 0,
          windSpeedKmh: Number(alert.windSpeedKmh) || 0,
          stoppageRisk: Boolean(alert.stoppageRisk),
          grantContractDay: Boolean(alert.grantContractDay),
          conditionText: alert.conditionText || '',
          safetyWarning: alert.safetyWarning,
          technicalRecommendation: alert.technicalRecommendation || '',
          generatedAt: alert.generatedAt || new Date().toISOString(),
          source: alert.source || 'gemini_ai',
          sincronizadoEm: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Get Weather Alerts from Firestore
  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    const path = 'weather_alerts';
    try {
      const snapshot = await getDocs(collection(db, path));
      if (snapshot.empty) return [];

      const alerts: WeatherAlert[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        alerts.push({
          id: d.id || snap.id,
          date: d.date || '',
          location: d.location || 'Savoy Campinas',
          city: d.city || 'Campinas',
          riskLevel: d.riskLevel || 'baixo',
          expectedRainMm: Number(d.expectedRainMm) || 0,
          probabilityPercent: Number(d.probabilityPercent) || 0,
          windSpeedKmh: Number(d.windSpeedKmh) || 0,
          stoppageRisk: Boolean(d.stoppageRisk),
          grantContractDay: Boolean(d.grantContractDay),
          conditionText: d.conditionText || '',
          safetyWarning: d.safetyWarning || '',
          technicalRecommendation: d.technicalRecommendation || '',
          generatedAt: d.generatedAt || '',
          source: d.source || 'gemini_ai',
        });
      });

      return alerts.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    } catch (error) {
      console.warn('Erro ao ler weather_alerts do Firestore:', error);
      return [];
    }
  },

  // Sincronizar todos os dados no Firebase (RDOs, Calendário, Alertas)
  async syncAllToFirestore(
    reports: RoofDailyReport[],
    tasks: CalendarTask[],
    weatherAlerts?: WeatherAlert[]
  ): Promise<SyncStats> {
    let syncedReports = 0;
    let syncedTasks = 0;
    let syncedAlerts = 0;

    try {
      // Sync reports
      for (const rep of reports) {
        await this.saveRoofReport(rep);
        syncedReports++;
      }

      // Sync tasks
      for (const t of tasks) {
        await this.saveCalendarTask(t);
        syncedTasks++;
      }

      // Sync weather alerts if any
      if (weatherAlerts && weatherAlerts.length > 0) {
        for (const w of weatherAlerts) {
          await this.saveWeatherAlert(w);
          syncedAlerts++;
        }
      }

      return {
        success: true,
        syncedReports,
        syncedTasks,
        syncedAlerts,
        timestamp: new Date().toISOString(),
        message: `Sincronização concluída com sucesso no Firebase Firestore! ${syncedReports} relatórios RDO e ${syncedTasks} tarefas operacionais atualizados.`,
      };
    } catch (error: any) {
      console.error('Falha ao sincronizar dados no Firebase:', error);
      return {
        success: false,
        syncedReports,
        syncedTasks,
        syncedAlerts,
        timestamp: new Date().toISOString(),
        message: `Erro na sincronização: ${error?.message || 'Falha de comunicação'}`,
      };
    }
  },

  // Save AI action log
  async saveAIAction(action: AIActionRequest): Promise<void> {
    const path = 'ai_actions';
    const docId = action.id || `action-${Date.now()}`;
    try {
      await setDoc(doc(db, path, docId), {
        ...action,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.warn('Erro ao salvar AI action no Firestore:', error);
    }
  },

  // Save WhatsApp reminder record
  async saveWhatsAppReminder(reminder: WhatsAppReminderRecord): Promise<void> {
    const path = 'whatsapp_reminders';
    const docId = reminder.id || `rem-${Date.now()}`;
    try {
      await setDoc(doc(db, path, docId), {
        ...reminder,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.warn('Erro ao salvar WhatsApp reminder no Firestore:', error);
    }
  },

  // Seed initial data to Firestore if database is empty
  async seedInitialDataIfEmpty(
    reports: RoofDailyReport[],
    tasks: CalendarTask[],
    actions?: AIActionRequest[]
  ): Promise<void> {
    try {
      const existingReports = await this.getAllRoofReports();
      if (existingReports.length === 0 && reports.length > 0) {
        await this.syncAllToFirestore(reports, tasks);
      }
    } catch (error) {
      console.warn('Seed inicial do Firestore concluído ou ignorado:', error);
    }
  },
};
