# Test results — branch `tuvi-vi`, macOS (Apple Silicon, 64 GB), Node 24.22.0

## Post-MVP hardening run (2026-11-05, final commit after `da07175`)

| Gate | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | **38/38 test files pass** |
| E2E vs rebuilt production (desktop + iPhone/iPad WebKit + local AI) | **51/51 pass** (adds native PDF download, verification panel) |
| `npm run check:i18n` / `check:terms` / `check:secrets` / `npm audit` | 0 / 0 source issues / 0 findings (246 files) / 0 vulnerabilities |
| Review | OCR (Claude) + 3 independent Codex rounds: 6 findings, all fixed with tests (round cap reached) |

**P0 fact verification** (`tests/unit/ai-claims.test.ts`): placements, brightness, Mệnh/Thân Chủ, Thân cư, palace branch, tam hợp, xung/hội chiếu, giáp,
Tứ Hóa by scope (natal / Đại Hạn hiện tại / Đại Hạn a–b / năm YYYY / Tự Hóa), Hóa-X-nhập-cung, compatibility per person — fabricated relations flagged ✗,
undecidable ones ?; real-model regressions included. Live qwen3.5 runs: 17–44 claims verified per answer; genuine model errors caught
(e.g. wrong Mệnh Chủ, "Tham Lang [Hãm]" vs Miếu, Hóa Lộc placed in the wrong palace, Lưu Niên Tứ Hóa mix-ups).

**P1 calendar/time**: 13,306 boundary checks (8 tz transitions minute-by-minute, Giờ Tý × Tết × EoT × calendars); 63 reproducible VN golden
fixtures (byte-identical regeneration); historical rule (VN calendar = UTC+8 before 1968 / South until 1975) — only `tz-1968-hue` changed.

**P1 translation QA** (45 paragraphs, automated checks only): 36/45 (80 %) → **42/45 (93 %)** after the leftover-Chinese repair pass.

**P1 performance** (`scripts/perf/bench-ai.ts`, same 4 cases, local qwen3.5:35b):

| Case | before: 1st / repeat | after: fresh / exact repeat |
|---|---|---|
| topic career | 47.0 s / 28.3 s | 25.3 s / 0.0 s |
| overview | 39.3 s / 20.1 s | 31.5 s / 0.0 s |
| chat | 23.1 s / 22.2 s | 18.0 s / 0.0 s |
| heming | 42.3 s / 35.2 s | 30.5 s / 0.1 s |

Profile: prompt ≈4.7k tokens (was ≈5.1k), prompt eval 3.7–7.7 s, generation ≈50 tok/s for 730–1,240 output tokens (14–24 s) — generation dominates;
verification adds milliseconds. Exact repeats are served from the answer cache and re-validated with the current verifier.

## MVP run (2026-11-05)

All results below were produced by actually running the commands on this machine.

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | pass |
| Unit / regression | `npm test` | **31/31 test files pass** (17 upstream regression scripts + 14 TuVi AI) |
| Static i18n check | `npm run check:i18n` | 0 untranslated UI strings in 40 files |
| E2E (Playwright) | `npm run test:e2e` + `test:e2e:ai` vs production build | **50/50 pass**: 13 routes × desktop/iPhone 13 (WebKit)/iPad (WebKit) — no visible Chinese outside `lang="zh"`, no horizontal overflow, no page errors; chart workflow (all tabs, palace click); save → reopen → export → clear → import; external providers locked; AI topic + chat on local `qwen3.5:35b` |
| Production build | `npm run build` | pass |
| Clean restart | `scripts/stop.sh` → port closed → `scripts/start.sh` | pass; all main routes 200; listens on 127.0.0.1:3000 only |
| Dependency audit | `npm audit` | 0 vulnerabilities |
| Secret scan | `npm run check:secrets` | 0 findings in 205+ tracked files; no `.env*`/`data/` tracked |
| Review | OCR (Level 1) + Codex (Level 2, independent) | 9 true findings fixed; Codex pass on fixes: PASS |

## Engine (Phase 2) — details in docs/vi/ENGINE-VERIFICATION.md
- Engine files identical to upstream `a600484` (only `lib/ziwei/share.ts` changed; default path = upstream math).
- Golden fixtures: 77 charts (12 hours, both genders, 22:59/23:00/23:30/00:00/00:59/01:00, month/year ends, Tết, leap months × 4 policies, Hà Nội/TP.HCM) — all match.
- iztro cross-check: 3,000 births × 44 fields — 0 unexplained differences (622 expected: deliberate Khôi/Việt rule in Tân years). Consistency check only (iztro is the engine's dependency).
- Independent lunar algorithm (Hồ Ngọc Đức, UTC+8) = lunar-javascript on all 28,124 days 1950–2026.
- Tý-hour boundaries: 822 checks (8 dates × 6 clocks × Beijing/Hà Nội × 4 rules).
- Đại Hạn direction by âm/dương + gender: 0 violations in 3,000.
- Found & fixed (outside the engine): clock time assumed Beijing UTC+8 → Vietnamese UTC+7 births had a 60-min error
  (e.g. Hà Nội 07:10 → Mão instead of Thìn). Documented conventions: VN vs CN lunar calendar (1,137 differing days), no EoT by default.

## AI (Phase 4)
- Contract tests with a mock Ollama (`tests/unit/api-contract.test.ts`): input validation (12 bad payloads → 400), Host/Origin guard (403),
  deterministic `/api/chart`, citation + placement validation (invented "Tử Vi ở Mệnh" flagged with actual palace Quan Lộc),
  prompt injection (delimiters stripped, history quoted), name/birth date never in the model prompt, external provider gating,
  Ollama-down deterministic fallback, `/api/health` never echoes keys.
- Live local model: career topic in ~35 s with dataset source + classics cited, 0 invalid refs; Hợp hôn ~44 s, 11 facts/2 sources cited.
- Dataset: 77/77 year files SHA-256 verified; record ↔ chart match 237/237 (1990 sample); lookup ≤ 3.7 s worst case, then cached.
- Translation: paragraph-level, ~2.7 s/paragraph warm; validation for leftover Han, length ratio, glossary terms.
