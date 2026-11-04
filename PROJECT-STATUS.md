# TuVi AI — Project status (durable checkpoint)

## Phase 0 — bootstrap (done 2026-11-04)
- Upstream: https://github.com/Renhuai123/ziwei-doushu @ `a600484a49255039d0725f1ba9e11ca81a948f97` (2026-11-03, MIT)
- Fork: https://github.com/phamgia75/ziwei-doushu (created via `gh repo fork`; nothing pushed)
- Remotes: `upstream` = Renhuai123, `origin` = phamgia75 fork. Work branch: `tuvi-vi`.
- Toolchain: node 24.22.0, npm 11.19.1. Key deps: next 16.x, react 19.2, iztro 2.6.1, lunar-javascript 1.7.x.
- Baseline (before any change): `npm ci` ok · `typecheck` pass · `npm test` 17/17 regression scripts pass · `next build` pass · `npm audit --omit=dev` 0 vulnerabilities.
- Local AI: Ollama at 127.0.0.1:11434 with `qwen3.5:35b` (only installed model; no downloads). 64 GB RAM.

## Phases (2026-11-05)
| Phase | State | Evidence |
|---|---|---|
| 0 Bootstrap | done | fork phamgia75/ziwei-doushu (nothing pushed); baseline green |
| 1 Localization | done | glossary (iztro vi-VN + curated), all UI Vietnamese, static + runtime l10n gates |
| 2 Engine verification | done | golden 77, iztro 3,000, lunar 28,124 days, Tý 822; UTC+7 defect fixed; VN calendar/EoT options |
| 3 Knowledge base | done | dataset v4.0 fetched+verified, streaming lookup, 13 topics, on-demand translation cache, NC sources opt-in |
| 4 AI engine | done | 8 API routes, Ollama default, OpenAI-compatible/Claude opt-in, RAG, validation, fallback |
| 5 Product UX | done | chart workspace, chat, palace/star detail, cycles, patterns, heming, settings, save/import/export, print-PDF, classics translation |
| 6 Quality/security | done | 31 unit files, 50 e2e, contract tests, secret scan, audit, OCR + Codex review |
| 7 Local deployment | done | scripts/start.sh / stop.sh, 127.0.0.1:3000, clean restart verified |

Open items: see KNOWN-LIMITATIONS.md. Not done (needs authorization): pushing branch `tuvi-vi` to the fork.
Review: OCR Level 1 (5 findings, 4 fixed, 1 recorded) + Codex Level 2 (4 findings, all fixed; re-review PASS).
