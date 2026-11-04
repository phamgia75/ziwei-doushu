// PDF report entries are scoped to one chart: switching charts drops them; other charts' entries are refused.
import assert from 'node:assert/strict';
import { reportStore } from '../../lib/client/report-store';
const e = (id: string, chartKey: string) => ({ id, title: id, kind: 'ai' as const, text: 'x', createdAt: '', chartKey });
reportStore.setChart('A');
reportStore.upsert(e('topic:career', 'A'));
reportStore.upsert(e('topic:love', 'B')); // late answer from another chart
assert.deepEqual(reportStore.list().map(x => x.id), ['topic:career']);
reportStore.setChart('B');
assert.deepEqual(reportStore.list(), [], 'previous chart entries dropped on switch');
reportStore.upsert(e('topic:love', 'B'));
assert.equal(reportStore.list().length, 1);
reportStore.setChart('');
assert.deepEqual(reportStore.list(), []);
console.log('report store: entries scoped to the open chart');
