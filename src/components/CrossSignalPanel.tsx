import { ArrowRight, GitMerge, Plus } from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { CrossSignalMatch, Language } from '../types/analysis';

interface CrossSignalPanelProps {
  crossSignals: CrossSignalMatch[];
  language: Language;
}

export function CrossSignalPanel({ crossSignals, language }: CrossSignalPanelProps) {
  if (crossSignals.length === 0) return null;
  const t = UI_STRINGS[language].analyzer;

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-2.5 mb-4">
        <GitMerge className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-base font-display font-bold text-slate-900">
            {t.crossSignalHeading}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">{t.crossSignalSub}</p>
        </div>
      </div>

      <div className="space-y-4">
        {crossSignals.map((cs) => (
          <div
            key={cs.id}
            className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs space-y-3"
          >
            {/* Signal Flow Visualization */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {cs.signalsInvolved.map((sig, idx) => (
                <div key={sig} className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 font-medium text-slate-800">
                    {sig}
                  </span>
                  {idx < cs.signalsInvolved.length - 1 && (
                    <Plus className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                  )}
                </div>
              ))}

              <ArrowRight className="w-4 h-4 text-amber-800 shrink-0" aria-hidden="true" />

              <span className="px-2.5 py-1 rounded-md border border-amber-300 bg-amber-100/80 font-semibold text-amber-950">
                {cs.name[language]}
              </span>

              <span className="ml-auto font-mono tabular-nums font-bold text-amber-900">
                +{cs.bonusWeight} bonus
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {cs.whyItMatters[language]}
            </p>

            <p className="text-xs font-semibold text-teal-900">
              {t.recommendedNext}: {cs.recommendedAction[language]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
