import { AlertTriangle, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getCategoryLabel } from '../engine/classifier';
import { UI_STRINGS } from '../i18n/translations';
import { AnalysisResult, Language } from '../types/analysis';

interface VerdictBadgeProps {
  result: AnalysisResult;
  language: Language;
}

export function VerdictBadge({ result, language }: VerdictBadgeProps) {
  const t = UI_STRINGS[language];
  const verdictCopy = t.verdict[result.verdict];
  const catLabel = getCategoryLabel(result.primaryCategory)[language];

  const styleMap =
    result.verdict === 'suspicious'
      ? result.severity === 'critical'
        ? {
            card: 'border-red-200 bg-gradient-to-br from-white via-white to-red-50/60',
            badge: 'bg-red-100 text-red-900 border-red-200',
            text: 'text-red-800',
          }
        : {
            card: 'border-amber-200 bg-gradient-to-br from-white via-white to-amber-50/60',
            badge: 'bg-amber-100 text-amber-900 border-amber-200',
            text: 'text-amber-800',
          }
      : result.verdict === 'insufficient_evidence'
      ? {
          card: 'border-slate-200 bg-white',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          text: 'text-slate-700',
        }
      : {
          card: 'border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/60',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          text: 'text-emerald-800',
        };

  const Icon =
    result.verdict === 'suspicious'
      ? AlertTriangle
      : result.verdict === 'insufficient_evidence'
      ? HelpCircle
      : ShieldCheck;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${styleMap.card}`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${styleMap.badge}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.severity[result.severity]}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <Sparkles className="w-3 h-3 text-teal-600" aria-hidden="true" />
            <span>{result.triggeredRules.length} signals</span>
          </span>
        </div>

        <div className={`flex items-center gap-2.5 font-display font-bold text-xl ${styleMap.text}`}>
          <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
          <h3>{verdictCopy.title}</h3>
        </div>
        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{verdictCopy.subtitle}</p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          <span className="text-slate-500">{t.analyzer.categoryLabel}: </span>
          <span className="font-semibold text-slate-900">{catLabel}</span>
        </div>
        <span className="font-mono tabular-nums text-slate-500">
          {t.analyzer.analyzedIn} {result.analyzedAtMs} ms
        </span>
      </div>
    </div>
  );
}
