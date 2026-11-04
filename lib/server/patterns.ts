import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { patternVi } from '@/lib/i18n/vi/patterns';

/** Rule-detected chart patterns (deterministic, from the engine) as Vietnamese fact lines. */
export function chartPatternsVi(chart: ZiweiChart): string[] {
  // names only: the model knows the classical meaning, and full descriptions cost ~1k prompt tokens
  return detectPatterns(chart).map(p => patternVi(p).name);
}
