# TuVi AI — Project status (durable checkpoint)

## Phase 0 — bootstrap (done 2026-11-04)
- Upstream: https://github.com/Renhuai123/ziwei-doushu @ `a600484a49255039d0725f1ba9e11ca81a948f97` (2026-11-03, MIT)
- Fork: https://github.com/phamgia75/ziwei-doushu (created via `gh repo fork`; nothing pushed)
- Remotes: `upstream` = Renhuai123, `origin` = phamgia75 fork. Work branch: `tuvi-vi`.
- Toolchain: node 24.22.0, npm 11.19.1. Key deps: next 16.x, react 19.2, iztro 2.6.1, lunar-javascript 1.7.x.
- Baseline (before any change): `npm ci` ok · `typecheck` pass · `npm test` 17/17 regression scripts pass · `next build` pass · `npm audit --omit=dev` 0 vulnerabilities.
- Local AI: Ollama at 127.0.0.1:11434 with `qwen3.5:35b` (only installed model; no downloads). 64 GB RAM.

## Phases
| Phase | State |
|---|---|
| 0 Bootstrap | done |
| 1 Localization | in progress |
| 2 Engine verification | pending |
| 3 Knowledge base | pending |
| 4 AI engine | pending |
| 5 Product UX | pending |
| 6 Quality/security | pending |
| 7 Local deployment | pending |
