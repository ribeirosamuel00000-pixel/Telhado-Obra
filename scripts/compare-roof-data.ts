import { INITIAL_CALENDAR_TASKS, INITIAL_ROOF_REPORTS, computeRoofSummary } from '../src/data/roofData';
import { firestoreSync } from '../src/services/firestoreSync';

const firestoreReports = await firestoreSync.getAllRoofReports();
const firestoreTasks = await firestoreSync.getAllCalendarTasks();
const sourceIds = new Set(INITIAL_ROOF_REPORTS.map((report) => report.id));
const firestoreIds = new Set(firestoreReports.map((report) => report.id));

const summarize = (reports: typeof INITIAL_ROOF_REPORTS) => ({
  count: reports.length,
  translucent: reports.reduce((total, report) => total + (Number(report.qtdTranslúcidas) || 0), 0),
  fibrocement: reports.reduce((total, report) => total + (Number(report.qtdFibrocimento) || 0), 0),
  gutters: reports.reduce((total, report) => total + (Number(report.metragemCalhas) || 0), 0),
  lifeline: reports.reduce((total, report) => total + (Number(report.metragemLinhaVida) || 0), 0),
  rainDays: reports.filter((report) => (Number(report.nivelChuvaMm) || 0) > 5).length,
});

const missingFromFirestore = INITIAL_ROOF_REPORTS
  .filter((report) => !firestoreIds.has(report.id))
  .map((report) => report.id);
const additionalFirestoreRecords = firestoreReports
  .filter((report) => !sourceIds.has(report.id))
  .map((report) => report.id);

console.log(JSON.stringify({
  source: summarize(INITIAL_ROOF_REPORTS),
  firestore: summarize(firestoreReports),
  missingFromFirestore,
  additionalFirestoreRecords,
  sourceCards: computeRoofSummary(INITIAL_ROOF_REPORTS, INITIAL_CALENDAR_TASKS),
  firestoreCards: computeRoofSummary(firestoreReports, firestoreTasks),
}, null, 2));
