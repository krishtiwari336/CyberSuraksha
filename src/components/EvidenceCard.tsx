import { ReactNode, useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Gavel,
  Globe,
  KeyRound,
  Landmark,
  Package,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trophy,
  Zap,
} from 'lucide-react';
import sourcesData from '../data/sources.json';
import { UI_STRINGS } from '../i18n/translations';
import {
  AnalysisResult,
  Language,
  ScamCategoryId,
  SourceRecord,
} from '../types/analysis';

const SOURCES: SourceRecord[] = sourcesData as SourceRecord[];

interface EvidenceCardProps {
  result: AnalysisResult;
  language: Language;
}

function CategoryIcon({ category }: { category: ScamCategoryId }) {
  const cls = 'w-4 h-4 text-amber-700 shrink-0';
  switch (category) {
    case 'otp_scam':
      return <KeyRound className={cls} aria-hidden="true" />;
    case 'upi_pin_scam':
    case 'fake_kyc_bank':
      return <Landmark className={cls} aria-hidden="true" />;
    case 'fake_job_internship':
      return <Briefcase className={cls} aria-hidden="true" />;
    case 'lottery_reward':
      return <Trophy className={cls} aria-hidden="true" />;
    case 'digital_arrest_police':
      return <Gavel className={cls} aria-hidden="true" />;
    case 'remote_access_app':
      return <Smartphone className={cls} aria-hidden="true" />;
    case 'courier_parcel':
      return <Package className={cls} aria-hidden="true" />;
    case 'electricity_utility':
      return <Zap className={cls} aria-hidden="true" />;
    case 'phishing_link':
      return <Globe className={cls} aria-hidden="true" />;
    default:
      return <ShieldAlert className={cls} aria-hidden="true" />;
  }
}

function renderHighlightedOriginal(result: AnalysisResult): ReactNode[] {
  const { originalText, highlightedSpans } = result;
  if (!originalText) return [];
  if (highlightedSpans.length === 0) return [originalText];

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < highlightedSpans.length; i++) {
    const sp = highlightedSpans[i];
    if (sp.start > cursor) {
      nodes.push(originalText.slice(cursor, sp.start));
    }

    const markClass =
      sp.severity === 'critical'
        ? 'bg-red-100 text-red-950 border-b-2 border-red-500 px-1 rounded-xs font-medium'
        : sp.severity === 'high'
        ? 'bg-amber-100 text-amber-950 border-b-2 border-amber-500 px-1 rounded-xs font-medium'
        : 'bg-slate-200 text-slate-900 border-b-2 border-slate-500 px-1 rounded-xs';

    nodes.push(
      <mark key={`${sp.start}-${sp.end}-${i}`} className={markClass}>
        {originalText.slice(sp.start, sp.end)}
      </mark>
    );
    cursor = sp.end;
  }

  if (cursor < originalText.length) {
    nodes.push(originalText.slice(cursor));
  }

  return nodes;
}

export function EvidenceCard({ result, language }: EvidenceCardProps) {
  const t = UI_STRINGS[language].analyzer;
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const toggleRule = (id: string) => {
    setExpandedRules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      {/* Highlighted original message */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-display font-bold text-slate-900">
            {t.highlightedHeading}
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {result.highlightedSpans.length} highlighted
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {renderHighlightedOriginal(result)}
        </div>
      </section>

      {/* Triggered Evidence Cards with progressive disclosure */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-display font-bold text-slate-900">
            {t.evidenceHeading}
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {result.triggeredRules.length}
          </span>
        </div>

        {result.triggeredRules.length === 0 ? (
          <p className="text-sm text-slate-600">{t.noEvidence}</p>
        ) : (
          <div className="space-y-3">
            {result.triggeredRules.map((rule) => {
              const source = SOURCES.find((s) => s.id === rule.sourceId);
              const isOpen = !!expandedRules[rule.ruleId];
              const sevText =
                rule.appliedWeight >= 22
                  ? 'High weight'
                  : rule.appliedWeight >= 12
                  ? 'Medium weight'
                  : 'Low weight';

              return (
                <article
                  key={rule.ruleId}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 hover:border-teal-300/80 hover:bg-white transition-all p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={rule.category} />
                      <h4 className="text-sm font-semibold text-slate-900">
                        {rule.name[language]}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                      <span>{sevText}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-slate-900">
                        +{rule.appliedWeight}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    {rule.explanation[language]}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600">
                      <span>Matched phrase: </span>
                      <code className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-900">
                        {rule.matchedText}
                      </code>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRule(rule.ruleId)}
                      aria-expanded={isOpen}
                      className="inline-flex items-center gap-1 text-teal-800 font-medium hover:underline cursor-pointer"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{t.techDetails}</span>
                    </button>
                  </div>

                  {/* Progressive disclosure: Technical Rule ID, Source & Recommended Action */}
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-slate-600">
                        <span>Rule ID: {rule.ruleId}</span>
                        <span aria-hidden="true">·</span>
                        <span>Group: {rule.group}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {rule.sourceVerificationStatus === 'officially_supported'
                            ? t.officialBadge
                            : t.prototypeBadge}
                        </span>
                      </div>

                      <p className="text-slate-800">
                        <strong className="text-teal-900">{t.recommendedNext}: </strong>
                        {rule.recommendedAction[language]}
                      </p>

                      {source && (
                        <div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-800 hover:underline font-medium"
                          >
                            <span>
                              {source.organization}: {source.title}
                            </span>
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Suppressed matches (False-positive protection transparency) */}
      {result.suppressedRules.length > 0 && (
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 mb-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-display font-bold">{t.suppressedHeading}</h3>
          </div>
          <p className="text-xs text-emerald-800 mb-3">{t.suppressedDesc}</p>
          <ul className="space-y-2 text-xs text-emerald-900">
            {result.suppressedRules.map((sup) => (
              <li
                key={sup.ruleId}
                className="border-t border-emerald-200/70 pt-2 first:border-t-0 first:pt-0"
              >
                <span className="font-semibold">{sup.name[language]}</span> (
                <code className="font-mono">{sup.matchedText}</code>):{' '}
                {sup.suppressionReason[language]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
