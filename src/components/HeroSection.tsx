import { ArrowDown, ArrowRight, Check, FlaskConical, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/cybersuraksha-logo.png';
import { UI_STRINGS } from '../i18n/translations';
import { Language } from '../types/analysis';

interface HeroSectionProps {
  language: Language;
  onFocusAnalyzer: () => void;
  onOpenLab: () => void;
}

export function HeroSection({
  language,
  onFocusAnalyzer,
  onOpenLab,
}: HeroSectionProps) {
  const t = UI_STRINGS[language].hero;

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white border border-slate-800/90 p-6 sm:p-8 lg:p-10 overflow-hidden shadow-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-12 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Official Identity + Headline + Compact Journey + Colored CTAs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="CyberSuraksha official logo"
              className="h-12 w-12 object-contain rounded-full shrink-0"
            />
            <div>
              <div className="text-sm font-display font-bold text-white tracking-tight">
                CyberSuraksha
              </div>
              <p className="text-xs sm:text-sm font-medium text-cyan-300 tracking-wide">
                {t.kicker}
              </p>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white text-balance leading-[1.12]">
            {t.headline}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t.subtitle}
          </p>

          {/* Streamlined 4-step workflow */}
          <div
            aria-label="CyberSuraksha workflow"
            className="flex flex-wrap items-center gap-1.5 text-xs text-slate-200 pt-1"
          >
            {t.journeySteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 font-medium">
                  {step}
                </span>
                {idx < t.journeySteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onFocusAnalyzer}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 text-slate-950 font-semibold text-sm shadow-md shadow-cyan-500/20 hover:from-teal-400 hover:via-cyan-400 hover:to-teal-300 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span>{t.ctaAnalyze}</span>
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenLab}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/90 to-blue-600/90 border border-violet-400/30 text-white font-semibold text-sm shadow-md shadow-violet-950/30 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <FlaskConical className="w-4 h-4 text-violet-200" aria-hidden="true" />
              <span>{t.ctaLab}</span>
            </button>
          </div>

          <ul className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs text-slate-300">
            {t.trustItems.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Lightweight Animated Shield Scan Visualization */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-md rounded-xl border border-slate-800/90 bg-slate-950/75 p-5 shadow-inner">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
              <div>
                <div className="text-sm font-semibold text-white">{t.shieldTitle}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.shieldSub}</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
            </div>

            <div className="relative my-4 flex items-center justify-center h-36">
              <svg
                viewBox="0 0 180 140"
                className="w-44 h-36 overflow-visible"
                aria-hidden="true"
              >
                <circle
                  cx="90"
                  cy="70"
                  r="58"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.2)"
                  strokeWidth="1.5"
                  className="cs-ring-pulse"
                />
                <circle
                  cx="90"
                  cy="70"
                  r="44"
                  fill="none"
                  stroke="rgba(45, 212, 191, 0.32)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <path
                  d="M90 22 L126 36 V66 C126 91 110 110 90 118 C70 110 54 91 54 66 V36 Z"
                  fill="rgba(20, 184, 166, 0.18)"
                  stroke="#22D3EE"
                  strokeWidth="2"
                />
                <path
                  d="M77 69 L86 78 L104 59"
                  fill="none"
                  stroke="#67E8F9"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="50"
                  y1="70"
                  x2="130"
                  y2="70"
                  stroke="#22D3EE"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="cs-scan-line"
                />
              </svg>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-300">
              {t.layers.map((layer) => (
                <div
                  key={layer}
                  className="px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800"
                >
                  {layer}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
