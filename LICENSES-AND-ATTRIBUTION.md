# Licenses and attribution

| Component | Licence | Use in TuVi AI |
|---|---|---|
| ziwei-doushu (Renhuai123), engine + UI code @ a600484 | MIT (LICENSE) | forked; engine unchanged |
| 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）, 王多鱼AI, https://github.com/Renhuai123/ziwei-doushu | CC BY 4.0 (DATASET-LICENSE) | downloaded locally (not redistributed); shown/translated per chart with attribution |
| Ni Haixia《天纪》quotations (`docs/tianji-ziwei/`, quotes inside dataset readings) | CC BY-NC-SA 4.0 / rights holder | NOT retrieved by default (`RAG_INCLUDE_NC=false`); quotes embedded in dataset readings are shown only as part of the cited reading |
| 紫微斗数全书 / 全集 / 骨髓赋 (`lib/classics`) | public domain | library + retrieval |
| iztro 2.6.1 (vi-VN / zh-CN locales) | MIT | terminology glossary `lib/i18n/glossary.iztro.json` |
| lunar-javascript 1.7.7 | MIT | via engine |
| Hồ Ngọc Đức lunar calendar algorithm | published algorithm (re-implemented) | `lib/calendar/vn-lunar.ts` |
| next 16.4.3, react 19.3, framer-motion, clsx, tailwindcss, html2canvas, tsx | MIT | runtime/build |
| pdf-lib 1.17.1, @pdf-lib/fontkit 1.1.1 | MIT | in-browser PDF report |
| Be Vietnam Pro (Regular, Bold) — `public/fonts/` with `OFL.txt` | SIL OFL 1.1 | embedded (subset) in PDF reports |
| typescript, @playwright/test | Apache-2.0 | dev |

Required attribution (shown on the About page and README-VI):
> 本项目使用了 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）来源：https://github.com/Renhuai123/ziwei-doushu 作者：王多鱼AI

Curated Vietnamese terminology (overrides to iztro) is listed with reasons in `lib/i18n/terms.ts` (`CURATED`).
Machine translations are produced locally and cached in `data/cache/translations` (not committed).
Commercial use: code and dataset allow it with attribution; NC material must stay disabled.
