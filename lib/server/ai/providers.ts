/**
 * LLM provider abstraction. Default = local Ollama. External providers (OpenAI-compatible,
 * Anthropic Claude) are used ONLY when the server allows it (AI_ALLOW_EXTERNAL=true + key) AND
 * the request explicitly selects that provider (the user enabled it in Cài đặt).
 * All providers stream plain text deltas through one interface.
 */
export type ProviderId = 'ollama' | 'openai' | 'anthropic';
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface ProviderStats { promptTokens?: number; outputTokens?: number; promptEvalMs?: number; evalMs?: number; loadMs?: number }
export interface StreamOpts { signal?: AbortSignal; temperature?: number; maxTokens?: number; idleTimeoutMs?: number; onStats?: (s: ProviderStats) => void }

const env = (k: string) => process.env[k]?.trim() || undefined;
export const OLLAMA_URL = () => env('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
const PREFERRED_OLLAMA = ['qwen3.5', 'qwen3', 'qwen2.5', 'gemma3', 'llama3.3', 'llama3.1', 'mistral'];

export function externalAllowed(): boolean {
  return env('AI_ALLOW_EXTERNAL') === 'true';
}

export function providerConfigured(id: ProviderId): boolean {
  if (id === 'ollama') return true;
  if (!externalAllowed()) return false;
  return id === 'openai' ? !!(env('OPENAI_API_KEY') && env('OPENAI_BASE_URL')) : !!env('ANTHROPIC_API_KEY');
}

/** Resolve the provider for a request: an external one only if explicitly requested AND configured. */
export function resolveProvider(requested: unknown): ProviderId {
  if ((requested === 'openai' || requested === 'anthropic') && providerConfigured(requested)) return requested;
  return 'ollama';
}

let modelCache: { at: number; models: string[] } | null = null;
export async function ollamaModels(signal?: AbortSignal): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 60_000) return modelCache.models;
  const r = await fetch(`${OLLAMA_URL()}/api/tags`, { signal: signal ?? AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`Ollama /api/tags HTTP ${r.status}`);
  const j = await r.json() as { models?: { name: string; capabilities?: string[] }[] };
  const models = (j.models ?? []).filter(m => !m.capabilities || m.capabilities.includes('completion')).map(m => m.name);
  modelCache = { at: Date.now(), models };
  return models;
}

/** OLLAMA_MODEL if set, else the first installed model from a preference list, else the first installed. Never pulls. */
export async function pickOllamaModel(): Promise<string> {
  const models = await ollamaModels();
  const wanted = env('OLLAMA_MODEL');
  if (wanted) {
    if (!models.includes(wanted)) throw new Error(`OLLAMA_MODEL=${wanted} chưa được cài trong Ollama`);
    return wanted;
  }
  for (const p of PREFERRED_OLLAMA) { const m = models.find(n => n.startsWith(p)); if (m) return m; }
  if (!models.length) throw new Error('Ollama chưa có mô hình nào được cài');
  return models[0];
}

export function modelFor(id: ProviderId): Promise<string> {
  if (id === 'openai') return Promise.resolve(env('OPENAI_MODEL') ?? 'gpt-4o-mini');
  if (id === 'anthropic') return Promise.resolve(env('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5');
  return pickOllamaModel();
}

/** Abort if no bytes arrive for idleMs (model hung) or the caller aborts. */
function idleGuard(outer: AbortSignal | undefined, idleMs: number) {
  const ctl = new AbortController();
  let timer = setTimeout(() => ctl.abort(new Error(`AI timeout: no output for ${idleMs / 1000}s`)), idleMs);
  const onOuter = () => ctl.abort(outer?.reason ?? new Error('aborted'));
  outer?.addEventListener('abort', onOuter, { once: true });
  return {
    signal: ctl.signal,
    bump() { clearTimeout(timer); timer = setTimeout(() => ctl.abort(new Error(`AI timeout: no output for ${idleMs / 1000}s`)), idleMs); },
    done() { clearTimeout(timer); outer?.removeEventListener('abort', onOuter); },
  };
}

async function* lines(body: ReadableStream<Uint8Array>, bump: () => void): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bump();
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) { yield buf.slice(0, i).replace(/\r$/, ''); buf = buf.slice(i + 1); }
  }
  if (buf) yield buf;
}

export async function* streamChat(id: ProviderId, model: string, messages: ChatMessage[], opts: StreamOpts = {}): AsyncGenerator<string> {
  const guard = idleGuard(opts.signal, opts.idleTimeoutMs ?? Number(env('AI_IDLE_TIMEOUT_MS') ?? 90_000));
  const temperature = opts.temperature ?? 0.4;
  try {
    if (id === 'ollama') {
      const r = await fetch(`${OLLAMA_URL()}/api/chat`, {
        method: 'POST', signal: guard.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, think: false, keep_alive: '30m',
          options: { temperature, num_ctx: Number(env('OLLAMA_NUM_CTX') ?? 16384), ...(opts.maxTokens ? { num_predict: opts.maxTokens } : {}) } }),
      });
      if (!r.ok || !r.body) throw new Error(`Ollama HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
      for await (const line of lines(r.body, guard.bump)) {
        if (!line.trim()) continue;
        const j = JSON.parse(line) as { message?: { content?: string }; error?: string; done?: boolean;
          prompt_eval_count?: number; eval_count?: number; prompt_eval_duration?: number; eval_duration?: number; load_duration?: number };
        if (j.error) throw new Error(`Ollama: ${j.error}`);
        if (j.message?.content) yield j.message.content;
        if (j.done) {
          const ms = (ns?: number) => (ns === undefined ? undefined : Math.round(ns / 1e6));
          opts.onStats?.({ promptTokens: j.prompt_eval_count, outputTokens: j.eval_count, promptEvalMs: ms(j.prompt_eval_duration), evalMs: ms(j.eval_duration), loadMs: ms(j.load_duration) });
          return;
        }
      }
      return;
    }
    if (id === 'openai') {
      const r = await fetch(`${env('OPENAI_BASE_URL')!.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', signal: guard.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env('OPENAI_API_KEY')}` },
        body: JSON.stringify({ model, messages, stream: true, temperature, ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}) }),
      });
      if (!r.ok || !r.body) throw new Error(`OpenAI-compatible HTTP ${r.status}`);
      for await (const line of lines(r.body, guard.bump)) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
      return;
    }
    // Anthropic Messages API (streaming SSE)
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: guard.signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': env('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, system, stream: true, temperature, max_tokens: opts.maxTokens ?? 4096,
        messages: messages.filter(m => m.role !== 'system') }),
    });
    if (!r.ok || !r.body) throw new Error(`Anthropic HTTP ${r.status}`);
    for await (const line of lines(r.body, guard.bump)) {
      if (!line.startsWith('data:')) continue;
      const j = JSON.parse(line.slice(5)) as { type: string; delta?: { type?: string; text?: string }; error?: { message?: string } };
      if (j.type === 'error') throw new Error(`Anthropic: ${j.error?.message}`);
      if (j.type === 'content_block_delta' && j.delta?.text) yield j.delta.text;
      if (j.type === 'message_stop') return;
    }
  } catch (e) {
    if (guard.signal.aborted && guard.signal.reason instanceof Error) throw guard.signal.reason;
    throw e;
  } finally {
    guard.done();
  }
}

/** Non-streaming convenience. */
export async function complete(id: ProviderId, model: string, messages: ChatMessage[], opts: StreamOpts = {}): Promise<string> {
  let out = '';
  for await (const d of streamChat(id, model, messages, opts)) out += d;
  return out;
}
