import { useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { AnalysisResult, Language, SeverityLevel } from '../types/analysis';

interface RiskMeterProps {
  result: AnalysisResult;
  language: Language;
}

const SEVERITY_STYLES: Record<
  SeverityLevel,
  {
    gradStart: string;
    gradEnd: string;
    text: string;
    bg: string;
    border: string;
    track: string;
    glow: string;
  }
> = {
  low: {
    gradStart: '#10B981',
    gradEnd: '#0D9488',
    text: 'text-emerald-800',
    bg: 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70',
    border: 'border-emerald-200',
    track: '#D1FAE5',
    glow: 'bg-emerald-400/15',
  },
  caution: {
    gradStart: '#F59E0B',
    gradEnd: '#D97706',
    text: 'text-amber-800',
    bg: 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60',
    border: 'border-amber-200',
    track: '#FEF3C7',
    glow: 'bg-amber-400/20',
  },
  high: {
    gradStart: '#F97316',
    gradEnd: '#DC2626',
    text: 'text-orange-800',
    bg: 'bg-gradient-to-br from-orange-50/90 via-white to-red-50/60',
    border: 'border-orange-200',
    track: '#FFEDD5',
    glow: 'bg-orange-400/20',
  },
  critical: {
    gradStart: '#EF4444',
    gradEnd: '#991B1B',
    text: 'text-red-800',
    bg: 'bg-gradient-to-br from-red-50/90 via-white to-rose-50/70',
    border: 'border-red-200',
    track: '#FEE2E2',
    glow: 'bg-red-500/20',
  },
};

export function RiskMeter({ result, language }: RiskMeterProps) {
  const t = UI_STRINGS[language];
  const st = SEVERITY_STYLES[result.severity];
  const clamped = Math.max(0, Math.min(100, result.score));

  const [displayScore, setDisplayScore] = useState<number>(clamped);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || clamped === 0) {
      setDisplayScore(clamped);
      return;
    }

    let rafId = 0;
    const duration = 420;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(clamped * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    setDisplayScore(0);
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [clamped, result.originalText]);

  const Icon =
    result.severity === 'critical'
      ? AlertOctagon
      : result.severity === 'high' || result.severity === 'caution'
      ? AlertTriangle
      : result.verdict === 'insufficient_evidence'
      ? Info
      : ShieldCheck;

  const radius = 64;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - displayScore / 100);
  const gradId = `cs-gauge-${result.severity}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 flex flex-col justify-between shadow-sm transition-all ${st.bg} ${st.border}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-32 rounded-full blur-2xl ${st.glow}`}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700">{t.analyzer.scoreLabel}</p>
        <div
          className={`inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm ${st.text}`}
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t.severity[result.severity]}</span>
        </div>
      </div>

      {/* Semi-circular Gradient Gauge with Animated Score Count-Up */}
      <div className="relative my-3 flex flex-col items-center">
        <div
          className="relative w-52 h-30 flex items-end justify-center"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.analyzer.scoreLabel}
        >
          <svg viewBox="0 0 160 92" className="w-52 h-30 overflow-visible">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={st.gradStart} />
                <stop offset="100%" stopColor={st.gradEnd} />
              </linearGradient>
            </defs>
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke={st.track}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          <div className="absolute bottom-1 flex items-baseline gap-1">
            <span
              className={`text-4xl font-display font-bold font-mono tabular-nums ${st.text}`}
            >
              {displayScore}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between w-48 text-[11px] font-mono tabular-nums text-slate-500">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Score composition */}
      <div className="relative pt-3 border-t border-slate-200/80 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono tabular-nums text-slate-700">
          <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200">
            Rules +{result.scoreBreakdown.rulePoints}
          </span>
          <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200">
            Cross-Signal +{result.scoreBreakdown.crossSignalPoints}
          </span>
          <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200">
            URL +{result.scoreBreakdown.urlPoints}
          </span>
        </div>
        <p className="text-xs text-slate-600 text-center leading-relaxed">
          {t.analyzer.heuristicNote}
        </p>
      </div>
    </div>
  );
}
