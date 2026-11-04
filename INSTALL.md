# Cài đặt / Installation (macOS, local only)

## Requirements
- Node.js ≥ 22.15 (zstd support in `node:zlib`; tested on 24.22) and npm.
- Optional: [Ollama](https://ollama.com) at `http://127.0.0.1:11434` with any installed chat model.
  The app picks `OLLAMA_MODEL`, else the first installed of qwen3.5/qwen3/qwen2.5/gemma3/llama3…; it never pulls models.
  Tested with `qwen3.5:35b` (≈22 GB, 64 GB RAM machine). Without Ollama the chart works and AI panels show
  deterministic chart facts instead.

## Steps
```bash
git clone https://github.com/phamgia75/ziwei-doushu.git tuvi && cd tuvi   # or use /Users/mac/dev/tuvi
git checkout tuvi-vi
npm ci
npm run dataset:fetch          # optional: 77 year files (1950–2026), ~161 MB → data/dataset/v4.0, SHA-256 verified
cp .env.example .env.local     # optional, all settings have defaults
./scripts/start.sh             # builds once, serves on 127.0.0.1:3000 (next free port if busy)
open http://localhost:3000
./scripts/stop.sh
```
`./scripts/start.sh --rebuild` rebuilds after code changes. Log: `tuvi-server.log`.
Development: `npm run dev -- -H 127.0.0.1`.

## External AI providers (optional, off by default)
In `.env.local`: `AI_ALLOW_EXTERNAL=true` plus `OPENAI_BASE_URL`/`OPENAI_API_KEY`/`OPENAI_MODEL` or
`ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`; restart; then pick the provider in **Cài đặt** and tick the consent box.
Only chart facts are sent (no name, birth date or place). Never commit `.env.local`.

## Checks
```bash
npm run typecheck && npm test            # unit/regression (30 files)
npm run check:i18n && npm run check:secrets && npm run check:audit
npx playwright install chromium webkit   # once
npm run test:e2e                         # desktop + iPhone + iPad, needs a running server
npm run test:e2e:ai                      # with local Ollama
```
