# Test results — 2026-11-05, branch `tuvi-vi`, macOS (Apple Silicon, 64 GB), Node 24.22.0

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
