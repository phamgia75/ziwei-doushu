/**
 * In-memory (page-session) store of interpretations generated for the open chart, so the PDF report
 * can include them with provenance. Nothing is persisted; reloading the page clears it.
 */
export interface ReportEntry {
  id: string;                 // stable per panel, e.g. "topic:career", "chat:3", "dataset:career"
  title: string;
  kind: 'ai' | 'dataset';
  text: string;               // Markdown (AI) or plain paragraphs (dataset translation)
  provider?: string;
  model?: string;
  facts?: { id: string; text: string }[];          // facts cited by the answer
  sources?: { id: string; title: string; ref: string; license: string }[];
  verification?: { checked: number; contradicted: number; unverified: number };
  note?: string;              // e.g. "bản dịch máy", "dữ kiện thay thế (AI không khả dụng)"
  createdAt: string;
}

const entries = new Map<string, ReportEntry>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const reportStore = {
  upsert(e: ReportEntry) { entries.set(e.id, e); emit(); },
  list(): ReportEntry[] { return [...entries.values()]; },
  clear() { entries.clear(); emit(); },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
