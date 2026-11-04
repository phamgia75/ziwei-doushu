'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star, SiHua } from '@/lib/ziwei/types';
import { term } from '@/lib/i18n';
import { common } from '@/lib/i18n/vi/common';
import { SIHUA_FULL, BRIGHTNESS_FULL } from '@/lib/i18n/vi/chart';
import { STAR_DESCRIPTIONS_VI, STAR_DETAIL_VI, STAR_NOTES_VI, STAR_TYPE_LABEL, starPanel as t } from '@/lib/i18n/vi/stars';
import Zh from './Zh';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

const levelColor: Record<Star['type'], string> = {
  major: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  lucky: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  sha:   'text-red-400 border-red-500/30 bg-red-500/10',
  minor: 'text-slate-400 border-slate-500/25 bg-slate-500/10',
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS_VI[star.name] : null;
  const detail = star ? STAR_DETAIL_VI[star.name] : null;
  const note = star && !detail && star.type !== 'major' ? STAR_NOTES_VI[star.name] : undefined;
  const brightnessTag = star?.brightnessRaw ? BRIGHTNESS_FULL[star.brightnessRaw]
    : star?.brightness === 'bright' ? t.brightBright : star?.brightness === 'dim' ? t.brightDim
    : star?.brightness ? t.brightNormal : null;
  const brightnessColor = star?.brightness === 'bright' ? '#eab308' : star?.brightness === 'dim' ? '#ef4444' : 'var(--t-text2)';

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>
                {term(star.name)}<Zh>{star.name}</Zh>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${levelColor[star.type]}`}>
                {STAR_TYPE_LABEL[star.type]}
              </span>
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  {SIHUA_FULL[star.siHua as SiHua]}
                </span>
              )}
            </div>
            <button onClick={onClose} aria-label={common.actions.close} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本信息 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: `${t.element} · ${desc.element}`, color: 'var(--t-text2)' },
                  { tag: `${t.nature} · ${desc.nature}`, color: 'var(--t-text2)' },
                  ...(palaceName ? [{ tag: `${t.position} · ${term(palaceName)}`, color: 'var(--t-text2)' }] : []),
                  ...(brightnessTag ? [{ tag: brightnessTag, color: brightnessColor }] : []),
                ].map(({ tag, color }) => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{ border: '1px solid var(--t-border)', color }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* 关键词 */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-wide mb-1.5" style={{ color: 'var(--t-faint)' }}>{t.keywords}</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 古书原文 */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  {t.classical}
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海厦解读 */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-wide mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    {t.niHaixia}
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: t.career, value: detail.career, icon: '◈' },
                    { label: t.relationship, value: detail.relationship, icon: '♡' },
                    { label: t.wealth, value: detail.wealth, icon: '◆' },
                    { label: t.health, value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">{t.bestPalace}</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">{t.worstPalace}</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 辅星/煞星说明 */}
            {note && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{note}</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
