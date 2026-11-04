import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { patternVi } from '@/lib/i18n/vi/patterns';

/** Rule-detected chart patterns (deterministic, from the engine) as Vietnamese fact lines. */
export function chartPatternsVi(chart: ZiweiChart): string[] {
  return detectPatterns(chart).map(p => {
    const v = patternVi(p);
    return `${v.name} — ${v.description}`;
  });
}
