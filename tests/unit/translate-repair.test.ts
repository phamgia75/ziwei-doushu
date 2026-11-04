// Repair pass keeps Vietnamese word boundaries when substituting leftover Chinese fragments.
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
const mock = http.createServer((req, res) => {
  if (req.url === '/api/tags') { res.end(JSON.stringify({ models: [{ name: 'mock:1b', capabilities: ['completion'] }] })); return; }
  req.resume(); req.on('end', () => res.end(JSON.stringify({ message: { content: '反倒 = ngược lại' }, done: true }) + '\n'));
});
(async () => {
  await new Promise<void>(r => mock.listen(0, '127.0.0.1', r));
  process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${(mock.address() as AddressInfo).port}`;
  const { repairLeftoverHan } = await import('../../lib/server/translate');
  const r = await repairLeftoverHan('琐碎的是非反倒多', 'những chuyện thị phi反倒nhiều', 'mock:1b', []);
  assert.equal(r?.vi, 'những chuyện thị phi ngược lại nhiều');
  mock.close();
  console.log('translation repair: fragments substituted with word boundaries');
})().catch(e => { console.error(e); process.exit(1); });
