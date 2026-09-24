import { INITIAL_CALENDAR_TASKS, INITIAL_ROOF_REPORTS } from '../src/data/roofData';
import { firestoreSync } from '../src/services/firestoreSync';

const result = await firestoreSync.syncAllToFirestore(
  INITIAL_ROOF_REPORTS,
  INITIAL_CALENDAR_TASKS,
);
const [storedReports, storedTasks] = await Promise.all([
  firestoreSync.getAllRoofReports(),
  firestoreSync.getAllCalendarTasks(),
]);

console.log(JSON.stringify({
  ...result,
  source: 'src/data/roofData.ts',
  reportsInSource: INITIAL_ROOF_REPORTS.length,
  tasksInSource: INITIAL_CALENDAR_TASKS.length,
  reportsReadBack: storedReports.length,
  tasksReadBack: storedTasks.length,
}, null, 2));

if (
  !result.success ||
  storedReports.length < INITIAL_ROOF_REPORTS.length ||
  storedTasks.length < INITIAL_CALENDAR_TASKS.length
) {
  process.exitCode = 1;
}
