import { INITIAL_CALENDAR_TASKS, INITIAL_ROOF_REPORTS } from '../src/data/roofData';
import { firestoreSync } from '../src/services/firestoreSync';

const result = await firestoreSync.syncAllToFirestore(
  INITIAL_ROOF_REPORTS,
  INITIAL_CALENDAR_TASKS,
);

console.log(JSON.stringify({
  ...result,
  source: 'src/data/roofData.ts',
  reportsInSource: INITIAL_ROOF_REPORTS.length,
  tasksInSource: INITIAL_CALENDAR_TASKS.length,
}, null, 2));

if (!result.success) process.exitCode = 1;
