# Architecture

```
Browser (Vietnamese UI, Next.js client components)
  BirthForm ──formToBirthInfo(utcOffset, lateZishi, EoT)──► generateChart (upstream engine, in-browser)
  ChartBoard / PalaceCell / TimeNav / StarDetailPanel  ── display via lib/i18n (term(), vi/* dictionaries)
  Workspace tabs ── POST {birth fields only, options, provider} ──► local API (SSE)
  localStorage: saved charts + settings (explicit save only)

Local server (Next route handlers, 127.0.0.1)
  guardRequest (Host allow-list, same-Origin) → readJson/parseBirth/parseOptions
  buildChart = applyCalendar → generateChart (deterministic, recomputed server-side)
  /api/chart      chart JSON + numbered facts + Vietnamese patterns
  /api/interpret  facts + RAG → provider → validateOutput → SSE   (modes: overview/topic/palace/star/cycle/chat)
  /api/chat       = interpret mode=chat          /api/heming  two charts
  /api/reading    dataset v4.0 record → verify match → paragraph translation (local Ollama, cached)
  /api/translate  classic chapter → translation  /api/health  status      /api/privacy  clear caches
  Providers: Ollama (default) | OpenAI-compatible | Anthropic  (external only if AI_ALLOW_EXTERNAL + key + selected)
```

## Layers
| Layer | Files | Notes |
|---|---|---|
| Engine (upstream, unchanged) | `lib/ziwei/*` except `share.ts` | Chinese identifiers are keys; never translated in place |
| Time input | `lib/ziwei/share.ts`, `lib/geo/*`, `lib/calendar/*` | UTC offset per birthplace/date, Tý rule, EoT option, VN calendar option |
| i18n | `lib/i18n/terms.ts` (iztro vi-VN glossary + curated), `lib/i18n/vi/*` | `<Zh>` / `lang="zh"` for intentional Chinese references |
| Facts | `lib/server/facts.ts` | `[F#]` lines; no name/DOB/place |
| Knowledge | `lib/server/dataset.ts`, `lib/server/ai/rag.ts` | dataset record for the exact chart (verified by Mệnh main star), classics, heming KB, NC quotes opt-in |
| AI | `lib/server/ai/{providers,interpret,heming,guard,validate}.ts` | idle timeout, external→local→deterministic fallback, injection hygiene, output validation |
| Translation | `lib/server/translate.ts` | paragraph chunks, glossary enforcement, length/Han checks, hash cache |

## Key decisions
- **Translate at display time, not in the engine** — engine output stays bit-identical to upstream (77 golden fixtures).
- **Server recomputes the chart** — the LLM never sees client-supplied chart text; placements can't be forged.
- **Dataset lookup streams** one 2 MB zstd year file (window 2^27) and stops at the key; extracted records cached.
  Record trusted only if its Mệnh main star equals our chart's (237/237 on a 1990 sample).
- **Chinese sources, Vietnamese answers** — retrieval passes original texts with provenance; the model writes Vietnamese.
- **VN calendar without engine changes** — chart the solar date whose Chinese lunar date equals the Vietnamese one.

## Hardening additions (post-MVP)
- **Claim verification** `lib/server/ai/claims.ts` → `validate.ts`: every recognised claim in an answer is recomputed from the chart
  (✓ verified / ✗ contradicted / ? unverified); answers must open with **Dữ kiện lá số** ([F#] per line) before **Luận giải truyền thống**.
- **Answer cache** `lib/server/ai/answer-cache.ts`: exact provider+model+messages key, raw text only, re-validated on replay; cleared by `/api/privacy`.
- **Calendar rule** `lib/calendar/vn-chart.ts` `vnCalendarTz(date, region)`; region from birthplace (`lib/geo/vn-places.ts vnRegion`).
- **Terminology** `lib/i18n/terminology.ts` (dictionary + variants, used by translation and AI validation); docs/vi/THUAT-NGU.md.
- **PDF** `lib/client/pdf-report.ts` (in-browser, pdf-lib + Be Vietnam Pro), fed by the chart-scoped `lib/client/report-store.ts`.
