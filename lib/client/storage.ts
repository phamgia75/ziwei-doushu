/**
 * Local-first storage (browser localStorage only). Birth data is saved ONLY when the user clicks
 * "Lưu lá số"; it never leaves this browser except to the local server for chart/AI requests.
 * Every access is wrapped: private mode / blocked storage degrades to "not saved", never crashes.
 */
import type { BirthFormState } from '@/components/BirthForm';
import type { LunarMonthPolicy, SchoolBrightnessKind } from '@/lib/ziwei/algorithm';

export type ProviderChoice = 'ollama' | 'openai' | 'anthropic';
export interface Settings {
  provider: ProviderChoice;
  /** The user explicitly agreed that chart facts (no name/birth date) go to the external provider. */
  externalConsent: boolean;
  lateZishi: 'next-day' | 'current-day';
  leapMonth: LunarMonthPolicy;
  brightness: SchoolBrightnessKind;
  /** 'cn' = engine default (Chinese UTC+8 calendar); 'vn' = Vietnamese UTC+7 lunar calendar. */
  calendar: 'cn' | 'vn';
  /** Apparent true solar time (equation of time) instead of mean solar time. */
  equationOfTime: boolean;
}
export interface SavedChart { id: string; label: string; form: BirthFormState; createdAt: string }

const K_SETTINGS = 'tuvi.settings.v1';
const K_CHARTS = 'tuvi.charts.v1';
export const DEFAULT_SETTINGS: Settings = { provider: 'ollama', externalConsent: false, lateZishi: 'next-day', leapMonth: 'split', brightness: 'default', calendar: 'cn', equationOfTime: false };

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function loadSettings(): Settings {
  const s = { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(K_SETTINGS, {}) };
  if (s.provider !== 'ollama' && !s.externalConsent) s.provider = 'ollama';
  return s;
}
export const saveSettings = (s: Settings) => write(K_SETTINGS, s);

/** Provider to put on requests: external only with explicit consent. */
export const requestProvider = (s: Settings): ProviderChoice => (s.externalConsent ? s.provider : 'ollama');

export const listCharts = (): SavedChart[] => read<SavedChart[]>(K_CHARTS, []).filter(isSavedChart);
export const getChart = (id: string) => listCharts().find(c => c.id === id);

export function saveChart(form: BirthFormState, label: string, id?: string): SavedChart | null {
  const list = listCharts();
  const rec: SavedChart = { id: id ?? (globalThis.crypto?.randomUUID?.() ?? String(Date.now())), label: label.slice(0, 80), form, createdAt: new Date().toISOString() };
  const next = [rec, ...list.filter(c => c.id !== rec.id)];
  return write(K_CHARTS, next) ? rec : null;
}
export const deleteChart = (id: string) => write(K_CHARTS, listCharts().filter(c => c.id !== id));

export function clearAllLocal(): void {
  try { localStorage.removeItem(K_CHARTS); localStorage.removeItem(K_SETTINGS); } catch { /* nothing stored */ }
}

function isSavedChart(c: unknown): c is SavedChart {
  const o = c as SavedChart;
  return !!o && typeof o.id === 'string' && typeof o.label === 'string' && !!o.form && typeof o.form.year === 'string'
    && typeof o.form.month === 'string' && typeof o.form.day === 'string' && (o.form.gender === 'male' || o.form.gender === 'female');
}

export function exportAll(): string {
  return JSON.stringify({ app: 'tuvi-ai', version: 1, exportedAt: new Date().toISOString(), settings: loadSettings(), charts: listCharts() }, null, 2);
}

/** Merge an export file. Invalid records are skipped, never partially written. */
export function importAll(json: string): { added: number; skipped: number } {
  let data: { app?: string; charts?: unknown[]; settings?: Partial<Settings> };
  try { data = JSON.parse(json); } catch { throw new Error('Tệp không phải JSON hợp lệ'); }
  if (data?.app !== 'tuvi-ai' || !Array.isArray(data.charts)) throw new Error('Không phải tệp xuất của TuVi AI');
  const valid = data.charts.filter(isSavedChart).map(c => ({ ...c, label: String(c.label).slice(0, 80) }));
  const existing = listCharts();
  const ids = new Set(existing.map(c => c.id));
  const added = valid.filter(c => !ids.has(c.id));
  if (!write(K_CHARTS, [...added, ...existing])) throw new Error('Trình duyệt không cho lưu dữ liệu');
  return { added: added.length, skipped: data.charts.length - added.length };
}
