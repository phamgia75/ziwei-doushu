'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BirthInfo } from '@/lib/ziwei/types';
import type { LateZishiRule } from '@/lib/ziwei/true-solar-time';
import { useTheme } from '@/components/ThemeProvider';
import { VN_PROVINCES, findVnCity } from '@/lib/geo/vn-places';
import { vnUtcOffsetMinutes, formatUtcOffset } from '@/lib/geo/vn-time';
import { formToBirthInfo, calcTrueSolarBranch } from '@/lib/ziwei/share';
import { BRANCHES_VI, common } from '@/lib/i18n';
import { birthForm as t } from '@/lib/i18n/vi/birthForm';

export interface BirthFormState {
  name: string;
  year: string;
  month: string;
  day: string;
  clockHour: string;
  clockMinute: string;
  unknownTime: boolean;
  province: string;
  city: string;
  longitude: number;
  /** Standard UTC offset (minutes) of the clock time entered. Omitted = 480 (Beijing, upstream default). */
  utcOffsetMinutes?: number;
  gender: 'male' | 'female';
}

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
  loading?: boolean;
  initialData?: Partial<BirthFormState>;
  onFormSave?: (data: BirthFormState) => void;
  /** Hide the internal submit button (e.g. /heming submits both forms from the parent). */
  hideSubmit?: boolean;
  /** Late Giờ Tý (23:00–23:59) day rule; default = formToBirthInfo's default ('next-day'). */
  lateZishi?: LateZishiRule;
}

const OTHER = t.place.otherValue;
const VN_DEFAULT_OFFSET = 420;
const pad2 = (n: number) => String(n).padStart(2, '0');
const clockBranch = (h: number) => (h === 23 ? 0 : Math.floor((h + 1) / 2));
const branchRange = (b: number) => `${pad2((b * 2 + 23) % 24)}:00–${pad2((b * 2 + 1) % 24)}:00`;

function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function BirthForm({ onSubmit, loading, initialData, onFormSave, hideSubmit, lateZishi }: BirthFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState<BirthFormState>({
    name: initialData?.name ?? '',
    year: initialData?.year ?? '',
    month: initialData?.month ?? '',
    day: initialData?.day ?? '',
    clockHour: initialData?.clockHour ?? '8',
    clockMinute: initialData?.clockMinute ?? '0',
    unknownTime: initialData?.unknownTime ?? false,
    province: initialData?.province ?? '',
    city: initialData?.city ?? '',
    longitude: initialData?.longitude ?? 120,
    utcOffsetMinutes: initialData?.utcOffsetMinutes,
    gender: initialData?.gender ?? 'male',
  });
  const restoredOther = initialData?.province === OTHER;
  const [customLon, setCustomLon] = useState(restoredOther && initialData?.longitude !== undefined ? String(initialData.longitude) : '');
  const [customTz, setCustomTz] = useState(
    restoredOther && initialData?.utcOffsetMinutes !== undefined ? String(initialData.utcOffsetMinutes / 60) : '7',
  );

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const y = parseInt(form.year) || 0;
  const m = parseInt(form.month) || 0;
  const d = parseInt(form.day) || 0;
  const hh = parseInt(form.clockHour) || 0;
  const mm = parseInt(form.clockMinute) || 0;
  const dateValid = isValidDate(y, m, d);

  const isOther = form.province === OTHER;
  const vnPlace = isOther ? undefined : findVnCity(form.province, form.city);
  const lonNum = parseFloat(customLon);
  const tzNum = parseFloat(customTz);
  const lonValid = Number.isFinite(lonNum) && lonNum >= -180 && lonNum <= 180;
  const tzValid = Number.isFinite(tzNum) && tzNum >= -12 && tzNum <= 14 && Number.isInteger(tzNum * 2);

  // The state actually submitted: longitude + historical offset resolved from the chosen place.
  const eff = useMemo<BirthFormState>(() => {
    if (isOther) {
      const off = tzValid ? tzNum * 60 : VN_DEFAULT_OFFSET;
      return { ...form, city: '', longitude: lonValid ? lonNum : off / 4, utcOffsetMinutes: off };
    }
    if (vnPlace) {
      const off = dateValid
        ? vnUtcOffsetMinutes(vnPlace.lat, y, m, d, form.unknownTime ? 12 : hh, form.unknownTime ? 0 : mm)
        : VN_DEFAULT_OFFSET;
      return { ...form, city: vnPlace.name, longitude: vnPlace.longitude, utcOffsetMinutes: off };
    }
    // No place: longitude = meridian, so no longitude correction (true solar = clock time).
    if (!form.province) return { ...form, longitude: VN_DEFAULT_OFFSET / 4, utcOffsetMinutes: VN_DEFAULT_OFFSET };
    return form; // legacy saved data (e.g. an upstream city): keep its longitude/offset as stored
  }, [form, isOther, vnPlace, tzValid, tzNum, lonValid, lonNum, dateValid, y, m, d, hh, mm]);

  // Sync live state to the parent (/heming collects both forms this way).
  useEffect(() => {
    onFormSave?.({ ...eff });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eff]);

  const cityList = VN_PROVINCES.find(p => p.name === form.province)?.cities ?? [];
  const offsetUsed = eff.utcOffsetMinutes ?? 480;
  const branch = form.unknownTime ? 0 : calcTrueSolarBranch(hh, mm, eff.longitude, offsetUsed);
  const offsetMin = Math.round((eff.longitude - offsetUsed / 4) * 4);
  const solarMins = ((hh * 60 + mm + (eff.longitude - offsetUsed / 4) * 4) % 1440 + 1440) % 1440;
  const solarClock = `${pad2(Math.floor(Math.round(solarMins) / 60) % 24)}:${pad2(Math.round(solarMins) % 60)}`;

  const chartInfo = useMemo(() => (dateValid ? formToBirthInfo(eff, { lateZishi }) : null), [eff, lateZishi, dateValid]);
  const ziHint = (() => {
    if (form.unknownTime || !chartInfo || branch !== 0) return null;
    const late = solarMins >= 1380;
    const chartKey = chartInfo.year * 10000 + chartInfo.month * 100 + chartInfo.day;
    const inputKey = y * 10000 + m * 100 + d;
    const tag = chartKey > inputKey ? t.zi.nextDay : chartKey === inputKey ? t.zi.sameDay : '';
    return `${t.zi.explain} ${late ? t.zi.late : t.zi.early} ${t.zi.chartDay} ${chartInfo.day}/${chartInfo.month}/${chartInfo.year} ${tag}`.trim();
  })();

  const tzNote = (() => {
    if (!vnPlace || offsetUsed === VN_DEFAULT_OFFSET) return null;
    const why = offsetUsed === 480 && vnPlace.lat < 17 && y >= 1960 && y <= 1975 ? t.place.southRvn : t.place.historical;
    return `${t.place.tzAtBirth}: ${formatUtcOffset(offsetUsed)} (${why})`;
  })();

  // ─── Validation ─────────────────────────────────────────
  const errors = {
    year: !form.year ? t.errors.yearRequired
      : y < 1900 || y > 2026 ? t.errors.yearRange
      : '',
    month: !form.month ? t.errors.monthRequired : '',
    day: !form.day ? t.errors.dayRequired
      : form.year && form.month && !dateValid ? t.errors.dayInvalid(m, d)
      : '',
    lon: isOther && !lonValid ? t.errors.longitude : '',
    tz: isOther && !tzValid ? t.errors.utcOffset : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  // ─── Progress ───────────────────────────────────────────
  const steps = [
    !!form.year && !!form.month && !!form.day && !errors.year && !errors.month && !errors.day,
    isOther ? !errors.lon && !errors.tz : !!vnPlace,
    form.unknownTime || (!!form.clockHour && !!form.clockMinute),
    true, // gender has a default
  ];
  const completedSteps = steps.filter(Boolean).length;

  const showSummary = steps[0] && steps[2] && !hasError;
  const summaryText = showSummary
    ? [
        `${d}/${m}/${y}`,
        isOther ? OTHER : eff.city || form.province,
        form.unknownTime ? t.time.unknownShort : `${t.time.branchPrefix} ${BRANCHES_VI[branch]}`,
        common.gender[form.gender],
      ].filter(Boolean).join(' · ')
    : '';

  const handleProvince = (prov: string) => {
    const first = VN_PROVINCES.find(p => p.name === prov)?.cities[0];
    setForm({ ...form, province: prov, city: first?.name ?? '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ year: true, month: true, day: true, lon: true, tz: true });
    if (hasError) return;
    onFormSave?.({ ...eff });
    // Always go through formToBirthInfo: it owns the late-Giờ-Tý day rollover; a hand-built BirthInfo would bypass it.
    onSubmit(formToBirthInfo(eff, { lateZishi }));
  };

  // ─── Style tokens ───────────────────────────────────────
  const bg = isDark ? 'rgba(8,16,40,0.85)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(200,160,60,0.2)';
  const labelClr = isDark ? 'rgba(180,200,225,0.9)' : 'rgba(120,80,10,0.7)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,252,240,0.8)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(200,160,60,0.25)';
  const inputClr = isDark ? '#e8eef8' : '#2a1a00';
  const focusBorder = isDark ? 'rgba(212,168,67,0.5)' : 'rgba(180,120,20,0.5)';
  const errorClr = isDark ? '#f87171' : '#dc2626';
  const panelBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,250,235,0.7)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(200,160,60,0.2)';
  const goldText = isDark ? '#d4a843' : '#7a5008';
  const hintClr = isDark ? 'rgba(180,210,235,0.85)' : 'rgba(100,70,10,0.7)';
  const summaryBg = isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.07)';
  const summaryBorder = isDark ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.25)';
  const summaryClr = isDark ? 'rgba(147,197,253,0.9)' : 'rgba(37,99,235,0.85)';

  // 16px font: iOS Safari zooms into inputs below that. 44px min height: tap target.
  const inputStyle = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputClr,
    borderRadius: '14px',
    padding: '10px 12px',
    fontSize: '16px',
    minHeight: '44px',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties;

  const errorInputStyle = { ...inputStyle, borderColor: errorClr };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', color: labelClr, marginBottom: '6px', letterSpacing: '0.02em' };
  const captionStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: labelClr, marginBottom: '3px' };
  const hintStyle: React.CSSProperties = { fontSize: '12px', lineHeight: 1.45, color: hintClr, marginTop: '6px' };
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = focusBorder; },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = inputBorder; },
  };

  function FieldError({ msg }: { msg: string }) {
    return (
      <AnimatePresence>
        {msg && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ color: errorClr, fontSize: '12px', marginTop: '4px' }}
          >
            ✕ {msg}
          </motion.p>
        )}
      </AnimatePresence>
    );
  }

  const showErr = (field: string) => touched[field] || submitAttempted;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: '24px', padding: 'clamp(16px, 5vw, 28px)', backdropFilter: 'blur(20px)', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <h3 style={{ color: goldText, fontSize: '14px', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '20px', fontWeight: 500 }}>
        ── {t.title} ──
      </h3>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }} aria-label={`${completedSteps}/${steps.length}`}>
        {steps.map((done, i) => (
          <motion.div
            key={i}
            animate={{ background: done ? (isDark ? '#d4a843' : '#b07820') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(200,160,60,0.15)') }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, height: '2px', borderRadius: '2px' }}
          />
        ))}
      </div>

      {/* Name */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bf-name" style={labelStyle}>{t.name.label}</label>
        <input
          id="bf-name"
          type="text"
          placeholder={t.name.placeholder}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          {...focusHandlers}
        />
      </div>

      {/* Date of birth: Vietnamese order day / month / year */}
      <div style={{ marginBottom: '16px' }}>
        <span style={labelStyle}>{t.date.label}</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <label htmlFor="bf-day" style={captionStyle}>{t.date.day}</label>
            <select
              id="bf-day"
              value={form.day}
              onChange={e => { setForm({ ...form, day: e.target.value }); setTouched(x => ({ ...x, day: true })); }}
              style={showErr('day') && errors.day ? errorInputStyle : inputStyle}
              required
            >
              <option value="">–</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dy => (
                <option key={dy} value={String(dy)}>{dy}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label htmlFor="bf-month" style={captionStyle}>{t.date.month}</label>
            <select
              id="bf-month"
              value={form.month}
              onChange={e => { setForm({ ...form, month: e.target.value }); setTouched(x => ({ ...x, month: true })); }}
              style={showErr('month') && errors.month ? errorInputStyle : inputStyle}
              required
            >
              <option value="">–</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                <option key={mo} value={String(mo)}>{mo}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label htmlFor="bf-year" style={captionStyle}>{t.date.year}</label>
            <select
              id="bf-year"
              value={form.year}
              onChange={e => { setForm({ ...form, year: e.target.value }); setTouched(x => ({ ...x, year: true })); }}
              style={showErr('year') && errors.year ? errorInputStyle : inputStyle}
              required
            >
              <option value="">–</option>
              {Array.from({ length: 127 }, (_, i) => 2026 - i).map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
        <FieldError msg={showErr('day') ? errors.day : ''} />
        <FieldError msg={showErr('month') ? errors.month : ''} />
        <FieldError msg={showErr('year') ? errors.year : ''} />
      </div>

      {/* Birthplace */}
      <div style={{ marginBottom: '16px' }}>
        <span style={labelStyle}>{t.place.label}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          <select
            aria-label={t.place.province}
            value={form.province}
            onChange={e => handleProvince(e.target.value)}
            style={inputStyle}
            {...focusHandlers}
          >
            <option value="">{t.place.province}</option>
            {VN_PROVINCES.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
            <option value={OTHER}>{t.place.otherOption}</option>
          </select>
          {!isOther && (
            <select
              aria-label={t.place.city}
              value={vnPlace?.name ?? ''}
              onChange={e => setForm({ ...form, city: e.target.value })}
              disabled={!vnPlace}
              style={{ ...inputStyle, opacity: vnPlace ? 1 : 0.45 }}
              {...focusHandlers}
            >
              {!vnPlace && <option value="">{t.place.pickProvinceFirst}</option>}
              {cityList.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        {isOther && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '8px' }}>
            <div style={{ minWidth: 0 }}>
              <label htmlFor="bf-lon" style={captionStyle}>{t.place.longitude}</label>
              <input
                id="bf-lon"
                type="number"
                inputMode="decimal"
                min={-180}
                max={180}
                step={0.01}
                value={customLon}
                onChange={e => { setCustomLon(e.target.value); setTouched(x => ({ ...x, lon: true })); }}
                style={showErr('lon') && errors.lon ? errorInputStyle : inputStyle}
                {...focusHandlers}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label htmlFor="bf-tz" style={captionStyle}>{t.place.utcOffset}</label>
              <input
                id="bf-tz"
                type="number"
                inputMode="decimal"
                min={-12}
                max={14}
                step={0.5}
                value={customTz}
                onChange={e => { setCustomTz(e.target.value); setTouched(x => ({ ...x, tz: true })); }}
                style={showErr('tz') && errors.tz ? errorInputStyle : inputStyle}
                {...focusHandlers}
              />
            </div>
          </div>
        )}
        <FieldError msg={showErr('lon') ? errors.lon : ''} />
        <FieldError msg={showErr('tz') ? errors.tz : ''} />
        {form.province ? (
          <p style={hintStyle}>
            {isOther ? OTHER : eff.city || form.province} · {eff.longitude.toFixed(2)}° · {formatUtcOffset(offsetUsed)} · {t.place.correction} {offsetMin > 0 ? '+' : ''}{offsetMin} {t.place.minutes}
            {tzNote && <><br /><strong>{tzNote}</strong></>}
          </p>
        ) : (
          <p style={hintStyle}>* {t.place.noPlaceHint}</p>
        )}
      </div>

      {/* Birth time */}
      <div style={{ marginBottom: '16px' }}>
        <span style={labelStyle}>{t.time.label}</span>
        <div style={{ borderRadius: '14px', padding: '12px', background: panelBg, border: `1px solid ${panelBorder}`, opacity: form.unknownTime ? 0.45 : 1, pointerEvents: form.unknownTime ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              aria-label={t.time.hour}
              value={form.clockHour}
              onChange={e => setForm({ ...form, clockHour: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={String(h)}>
                  {pad2(h)} {t.time.hour} · {BRANCHES_VI[clockBranch(h)]} ({branchRange(clockBranch(h))})
                </option>
              ))}
            </select>
            <select
              aria-label={t.time.minute}
              value={form.clockMinute}
              onChange={e => setForm({ ...form, clockMinute: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(min => (
                <option key={min} value={String(min)}>{pad2(min)} {t.time.minute}</option>
              ))}
            </select>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: '12px', color: hintClr }}>{t.time.trueSolar} ≈ {solarClock} → </span>
            <span style={{ fontSize: '16px', color: goldText, fontWeight: 600 }}>
              {t.time.branchPrefix} {BRANCHES_VI[branch]}
            </span>
            <span style={{ fontSize: '12px', color: hintClr, marginLeft: '4px' }}>({branchRange(branch)})</span>
          </div>
          {ziHint && <p style={{ ...hintStyle, marginTop: '4px' }}>{ziHint}</p>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', minHeight: '44px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={e => setForm({ ...form, unknownTime: e.target.checked })}
            style={{ width: '20px', height: '20px', flexShrink: 0, cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: hintClr }}>{t.time.unknown}</span>
        </label>
      </div>

      {/* Gender */}
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>{t.gender}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['male', 'female'] as const).map(g => {
            const active = form.gender === g;
            const accent = g === 'male' ? '37,99,235' : '225,29,72';
            return (
              <motion.button
                key={g}
                type="button"
                aria-pressed={active}
                onClick={() => setForm({ ...form, gender: g })}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '11px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: `1px solid ${active ? `rgba(${accent},0.6)` : inputBorder}`,
                  background: active ? `rgba(${accent},0.08)` : inputBg,
                  color: active ? `rgba(${accent},0.9)` : (isDark ? 'rgba(190,205,225,0.7)' : 'rgba(100,80,40,0.6)'),
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {g === 'male' ? '♂' : '♀'} {common.gender[g]}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Summary chip */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div style={{
              background: summaryBg,
              border: `1px solid ${summaryBorder}`,
              borderRadius: '12px',
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '13px', color: summaryClr }}>✓</span>
              <span style={{ fontSize: '13px', color: summaryClr, flex: 1, overflowWrap: 'anywhere' }}>
                {summaryText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      {!hideSubmit && <motion.button
        type="submit"
        disabled={loading}
        whileHover={loading ? {} : { scale: 1.01 }}
        whileTap={loading ? {} : { scale: 0.98 }}
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '14px',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading
            ? (isDark ? 'rgba(212,168,67,0.15)' : 'rgba(180,120,20,0.15)')
            : (isDark
              ? 'linear-gradient(135deg, rgba(180,130,40,0.9), rgba(240,200,80,0.9))'
              : 'linear-gradient(135deg, #9a6210, #c88020)'),
          color: loading ? (isDark ? 'rgba(212,168,67,0.4)' : 'rgba(120,80,10,0.4)') : (isDark ? '#08080a' : '#fff8e8'),
          boxShadow: loading ? 'none' : (isDark ? '0 4px 20px rgba(212,168,67,0.2)' : '0 4px 16px rgba(140,100,20,0.25)'),
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
            {t.submitting}
          </span>
        ) : t.submit}
      </motion.button>}
    </motion.form>
  );
}
