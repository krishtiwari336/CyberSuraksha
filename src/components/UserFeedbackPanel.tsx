import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Lock,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { getActiveRules } from '../engine/rulesEngine';
import {
  buildContributionRecord,
  compareFeedbackWithAnalysis,
  sanitizeMessageLocally,
} from '../engine/sanitizer';
import { UI_STRINGS } from '../i18n/translations';
import {
  AnalysisResult,
  FeedbackChoice,
  Language,
  SanitizedPatternResult,
  UserContributedPattern,
} from '../types/analysis';

interface UserFeedbackPanelProps {
  analysis: AnalysisResult;
  language: Language;
  nextContributionNumber: number;
  onContributePattern: (record: UserContributedPattern) => void;
  onViewRulebook: () => void;
}

const ACTIVE_RULES = getActiveRules();

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function UserFeedbackPanel({
  analysis,
  language,
  nextContributionNumber,
  onContributePattern,
  onViewRulebook,
}: UserFeedbackPanelProps) {
  const t = UI_STRINGS[language].feedback;
  const [dismissed, setDismissed] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackChoice | null>(null);
  const [consentChoice, setConsentChoice] = useState<'yes' | 'no' | null>(null);
  const [previewSanitized, setPreviewSanitized] = useState<SanitizedPatternResult | null>(null);
  const [confirmedAdded, setConfirmedAdded] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (dismissed) return null;

  const comparison = selectedFeedback
    ? compareFeedbackWithAnalysis(selectedFeedback, analysis)
    : null;

  const handleSelectFeedback = (choice: FeedbackChoice) => {
    setSelectedFeedback(choice);
    setConsentChoice(null);
    setPreviewSanitized(null);
    setConfirmedAdded(false);
  };

  const handleConsentYes = () => {
    const sanitized = sanitizeMessageLocally(analysis.originalText);
    setPreviewSanitized(sanitized);
    setConsentChoice('yes');
  };

  const handleConsentNo = () => {
    setConsentChoice('no');
    setPreviewSanitized(null);
  };

  const handleConfirmContribution = () => {
    if (!selectedFeedback || !previewSanitized || confirmedAdded) return;
    const record = buildContributionRecord(
      previewSanitized,
      selectedFeedback,
      analysis,
      ACTIVE_RULES,
      nextContributionNumber
    );
    onContributePattern(record);
    setConfirmedAdded(true);
  };

  const handleCancelContribution = () => {
    setConsentChoice(null);
    setPreviewSanitized(null);
  };

  const handleCopySanitized = async () => {
    if (!previewSanitized) return;
    const ok = await copyText(previewSanitized.sanitizedPattern);
    if (ok) {
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2200);
    }
  };

  const insightToneClass =
    comparison?.outcome === 'confirmed_scam' || comparison?.outcome === 'confirmed_legit'
      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
      : comparison?.outcome === 'potential_false_negative'
      ? 'border-red-200 bg-red-50/70 text-red-950'
      : comparison?.outcome === 'potential_false_positive'
      ? 'border-amber-200 bg-amber-50/80 text-amber-950'
      : 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <section
      aria-labelledby="optional-feedback-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4 cs-fade-up"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MessageSquareHeart
            className="w-5 h-5 text-violet-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h3
              id="optional-feedback-heading"
              className="text-base font-display font-bold text-slate-900"
            >
              {t.heading}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.sessionNotice}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t.dismissBtn}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.dismissBtn}</span>
        </button>
      </div>

      {/* Step 1: Optional Feedback Prompt */}
      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-slate-900">{t.question}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectFeedback('scam')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              selectedFeedback === 'scam'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/25 ring-2 ring-red-600 ring-offset-1'
                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-600 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white/80 shrink-0" aria-hidden="true" />
            <span>{t.scamBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectFeedback('legit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              selectedFeedback === 'legit'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600 ring-offset-1'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white/80 shrink-0" aria-hidden="true" />
            <span>{t.legitBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectFeedback('unsure')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              selectedFeedback === 'unsure'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25 ring-2 ring-amber-500 ring-offset-1'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-500 hover:text-slate-950'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-900/40 shrink-0" aria-hidden="true" />
            <span>{t.unsureBtn}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">{t.unverifiedNote}</p>
      </div>

      {/* Step 2: Comparison Insight + Separate Explicit Consent Prompt */}
      {selectedFeedback && comparison && (
        <div className="space-y-4 pt-2 border-t border-slate-100 cs-fade-up">
          <div className={`rounded-xl border p-3.5 text-xs sm:text-sm space-y-1 ${insightToneClass}`}>
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{comparison.title[language]}</span>
            </div>
            <p className="leading-relaxed">{comparison.detail[language]}</p>
          </div>

          {!confirmedAdded && consentChoice === null && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                {t.consentQuestion}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleConsentYes}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.yesContributeBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConsentNo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.noPrivateBtn}</span>
                </button>
              </div>
            </div>
          )}

          {consentChoice === 'no' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 cs-fade-up">
              {t.privateConfirmed}
            </div>
          )}

          {/* Step 3: Local Sanitization Preview & Explicit Confirmation */}
          {consentChoice === 'yes' && previewSanitized && !confirmedAdded && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 cs-fade-up">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {t.previewTitle}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.previewSubtitle}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    {t.sanitizedLabel}
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 font-mono text-slate-900 break-words">
                    {previewSanitized.sanitizedPattern}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    {t.generalizedLabel}
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-violet-900 break-words">
                    {previewSanitized.generalizedPattern}
                  </div>
                </div>

                {previewSanitized.redactionsApplied.length > 0 && (
                  <p className="text-slate-600">
                    Redacted locally: {previewSanitized.redactionsApplied.join(' · ')}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmContribution}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>{t.confirmAddBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySanitized}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copiedNotice ? t.copiedFeedback : t.copySanitizedBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelContribution}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    {t.cancelBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmedAdded && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-3 cs-pop-in">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-900">
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.addedSuccess}</span>
              </div>
              <button
                type="button"
                onClick={onViewRulebook}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{t.viewRulebookBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
