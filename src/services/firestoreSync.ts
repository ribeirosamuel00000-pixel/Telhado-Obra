import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { RoofDailyReport, CalendarTask, AIActionRequest, WhatsAppReminderRecord } from '../types';

export const firestoreSync = {
  // Save roof report to Firestore
  async saveRoofReport(report: RoofDailyReport): Promise<void> {
    const path = 'roof_reports';
    const docId = `rdo-${report.id}`;
    try {
      await setDoc(doc(db, path, docId), {
        id: String(report.id),
        dataPreenchimento: report.dataPreenchimento || new Date().toISOString().split('T')[0],
        responsavel: report.responsavel || 'Sávio Rodrigues',
        predio: report.setorPredio || 'Prédio 4i1',
        qtdTranslúcidas: Number(report.qtdTranslúcidas) || 0,
        qtdFibrocimento: Number(report.qtdFibrocimento) || 0,
        metragemCalhas: Number(report.metragemCalhas) || 0,
        metragemLinhaVida: Number(report.metragemLinhaVida) || 0,
        condicoesClimaticas: report.condicoesClimaticas || 'Ensolarado',
        observacoes: report.descricaoExecucao || '',
        materiaisRecebidos: report.materiaisRecebidos || '',
        criadoEm: report.criadoEm || new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Save calendar task to Firestore
  async saveCalendarTask(task: CalendarTask): Promise<void> {
    const path = 'calendar_tasks';
    const docId = task.id;
    try {
      await setDoc(doc(db, path, docId), {
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
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
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

  // Save AI Action to Firestore
  async saveAIAction(action: AIActionRequest): Promise<void> {
    const path = 'ai_actions';
    const docId = action.id;
    try {
      await setDoc(doc(db, path, docId), {
        id: action.id,
        title: action.title,
        status: action.status,
        detectedIssue: action.detectedIssue,
        whatsappMessage: action.whatsappMessage,
        createdAt: action.createdAt,
        approvedBy: action.approvedBy || '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Save WhatsApp Reminder Record to Firestore
  async saveWhatsAppReminder(reminder: WhatsAppReminderRecord): Promise<void> {
    const path = 'whatsapp_reminders';
    const docId = reminder.id;
    try {
      await setDoc(doc(db, path, docId), {
        id: reminder.id,
        scheduledTime: reminder.scheduledTime || '08:30',
        date: reminder.date,
        recipient: reminder.recipient || 'SVA Engenharia',
        targetPhone: reminder.targetPhone || '5512974080523',
        targetPhoneFormatted: reminder.targetPhoneFormatted || '+55 (12) 97408-0523',
        message: reminder.message,
        status: reminder.status,
        dispatchedAt: reminder.dispatchedAt || new Date().toISOString(),
        whatsappUrl: reminder.whatsappUrl,
        type: reminder.type || 'daily_08h30_reminder',
        deliveredVia: reminder.deliveredVia || 'scheduled_agent',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
    }
  },

  // Get WhatsApp Reminders history from Firestore
  async getWhatsAppReminders(): Promise<WhatsAppReminderRecord[]> {
    const path = 'whatsapp_reminders';
    try {
      const q = query(collection(db, path), limit(30));
      const snapshot = await getDocs(q);
      const records: WhatsAppReminderRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as WhatsAppReminderRecord);
      });
      return records.sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
    } catch (error) {
      console.warn('Could not read whatsapp_reminders from Firestore:', error);
      return [];
    }
  },

  // Initial seed sync if collection is empty
  async seedInitialDataIfEmpty(
    reports: RoofDailyReport[],
    tasks: CalendarTask[],
    actions: AIActionRequest[]
  ): Promise<void> {
    try {
      const reportsSnapshot = await getDocs(collection(db, 'roof_reports'));
      if (reportsSnapshot.empty && reports.length > 0) {
        for (const r of reports) {
          await this.saveRoofReport(r).catch(() => {});
        }
      }

      const tasksSnapshot = await getDocs(collection(db, 'calendar_tasks'));
      if (tasksSnapshot.empty && tasks.length > 0) {
        for (const t of tasks) {
          await this.saveCalendarTask(t).catch(() => {});
        }
      }

      const actionsSnapshot = await getDocs(collection(db, 'ai_actions'));
      if (actionsSnapshot.empty && actions.length > 0) {
        for (const a of actions) {
          await this.saveAIAction(a).catch(() => {});
        }
      }

      const remindersSnapshot = await getDocs(collection(db, 'whatsapp_reminders'));
      if (remindersSnapshot.empty) {
        const todayStr = new Date().toISOString().split('T')[0];
        const seedReminder: WhatsAppReminderRecord = {
          id: `sva-rem-seed-${todayStr}`,
          scheduledTime: '08:30',
          date: todayStr,
          recipient: 'SVA Engenharia',
          targetPhone: '5512974080523',
          targetPhoneFormatted: '+55 (12) 97408-0523',
          message: `⏰ LEMBRETE DIÁRIO DE APONTAMENTO • 08h30\nSVA Engenharia: Lembrete automático de preenchimento do formulário diário de cobertura Savoy Campinas.`,
          status: 'DISPARADO_AUTOMATICO',
          dispatchedAt: new Date().toISOString(),
          whatsappUrl: `https://wa.me/5512974080523?text=${encodeURIComponent('⏰ LEMBRETE DIÁRIO DE APONTAMENTO • 08h30\nSVA Engenharia...')}`,
          type: 'daily_08h30_reminder',
          deliveredVia: 'scheduled_agent',
        };
        await this.saveWhatsAppReminder(seedReminder).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore initial sync note:', err);
    }
  },
};
