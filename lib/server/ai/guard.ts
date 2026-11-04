/**
 * Prompt-injection hygiene for untrusted text (user questions and client-held chat history).
 * Defence in depth — the main protections are structural: chart facts are recomputed server-side,
 * the system prompt is server-owned, and output is validated against the chart afterwards.
 */
export const DELIMS = { facts: '<<<DU_KIEN_LA_SO>>>', sources: '<<<NGUON_THAM_KHAO>>>', question: '<<<CAU_HOI>>>', end: '<<<HET>>>' };

const INJECTION = [
  /ignore (all |any |the )?(previous|prior|above) (instructions|rules)/i,
  /disregard (the )?(system|previous)/i,
  /(system|developer) prompt/i,
  /you are now|act as|jailbreak|DAN mode/i,
  /bỏ qua (mọi|tất cả|các)? ?(hướng dẫn|chỉ dẫn|quy tắc|lệnh)/i,
  /(tiết lộ|in ra|hiển thị) (prompt|lời nhắc|chỉ dẫn hệ thống)/i,
  /đóng vai|giả vờ là|từ giờ (bạn|mày) là/i,
  /(thay đổi|sửa) (lá số|vị trí sao|dữ kiện)/i,
];

export function looksLikeInjection(text: string): boolean {
  return INJECTION.some(re => re.test(text));
}

/** Strip control chars and our own delimiter tokens (so user text can't fake a data block). */
export function sanitize(text: string, max: number): string {
  let t = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  for (const d of Object.values(DELIMS)) t = t.split(d).join('');
  t = t.replace(/<<<|>>>/g, '');
  return t.slice(0, max);
}

export interface HistoryMsg { role: 'user' | 'assistant'; content: string }

/** Validate client-held chat history: roles whitelisted, sizes capped, last 12 turns. */
export function parseHistory(v: unknown): HistoryMsg[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error('messages phải là mảng');
  return v.slice(-12).map(m => {
    const o = (m ?? {}) as Record<string, unknown>;
    if ((o.role !== 'user' && o.role !== 'assistant') || typeof o.content !== 'string') throw new Error('messages không hợp lệ');
    return { role: o.role, content: sanitize(o.content, o.role === 'user' ? 2000 : 6000) };
  });
}
