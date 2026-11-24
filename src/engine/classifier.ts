import {
  AnalysisResult,
  HighlightedSpan,
  RuleDefinition,
  ScamCategoryId,
  TriggeredRule,
  UrlAnalysisResult,
} from '../types/analysis';
import { buildTrustBoundaries } from './advice';
import { assessMessageContext } from './contextAnalyzer';
import { evaluateCrossSignals } from './crossSignalEngine';
import { extractEntities } from './entityExtractor';
import { normalizeMessage } from './normalizer';
import { evaluateRules } from './rulesEngine';
import { computeRiskScore } from './scoringEngine';
import { analyzeUrlsInText } from './urlAnalyzer';

const MAX_INPUT_LENGTH = 20000;

function mergeHighlightSpans(
  triggeredRules: TriggeredRule[],
  urlAnalyses: UrlAnalysisResult[]
): HighlightedSpan[] {
  const rawSpans: HighlightedSpan[] = [];

  for (const rule of triggeredRules) {
    const sev: HighlightedSpan['severity'] =
      rule.appliedWeight >= 22 ? 'critical' : rule.appliedWeight >= 12 ? 'high' : 'caution';
    for (const sp of rule.spans) {
      if (sp.end > sp.start) {
        rawSpans.push({
          start: sp.start,
          end: sp.end,
          text: sp.text,
          ruleId: rule.ruleId,
          category: rule.category,
          severity: sev,
        });
      }
    }
  }

  for (const url of urlAnalyses) {
    if (url.totalUrlWeight >= 5 && url.end > url.start) {
      rawSpans.push({
        start: url.start,
        end: url.end,
        text: url.raw,
        ruleId: 'URL-SIGNAL',
        category: 'phishing_link',
        severity: url.totalUrlWeight >= 15 ? 'high' : 'caution',
      });
    }
  }

  // Sort by start offset, then longest span first
  rawSpans.sort((a, b) => a.start - b.start || b.end - a.end);

  // Deduplicate overlapping spans (keep highest severity / earlier start)
  const merged: HighlightedSpan[] = [];
  for (const span of rawSpans) {
    const prev = merged[merged.length - 1];
    if (!prev || span.start >= prev.end) {
      merged.push(span);
    } else if (span.end > prev.end) {
      // Partial overlap: keep higher severity if current is stricter
      const sevRank = { critical: 3, high: 2, caution: 1 };
      if (sevRank[span.severity] > sevRank[prev.severity]) {
        merged[merged.length - 1] = span;
      }
    }
  }

  return merged;
}

export function getCategoryLabel(category: ScamCategoryId): {
  en: string;
  hi: string;
  hinglish: string;
} {
  const labels: Record<ScamCategoryId, { en: string; hi: string; hinglish: string }> = {
    otp_scam: {
      en: 'OTP / Credential Theft Indicator',
      hi: 'OTP / गुप्त जानकारी चोरी का संकेत',
      hinglish: 'OTP / Credential Theft Indicator',
    },
    upi_pin_scam: {
      en: 'UPI PIN / QR Fraud Indicator',
      hi: 'UPI PIN / QR ठगी का संकेत',
      hinglish: 'UPI PIN / QR Fraud Indicator',
    },
    fake_job_internship: {
      en: 'Fake Job / Internship Fee Indicator',
      hi: 'नकली नौकरी / इंटर्नशिप फीस का संकेत',
      hinglish: 'Fake Job / Internship Fee Indicator',
    },
    fake_kyc_bank: {
      en: 'Fake KYC / Bank Alert Indicator',
      hi: 'नकली KYC / बैंक अलर्ट का संकेत',
      hinglish: 'Fake KYC / Bank Alert Indicator',
    },
    lottery_reward: {
      en: 'Lottery / Prize Fee Indicator',
      hi: 'लॉटरी / इनाम फीस का संकेत',
      hinglish: 'Lottery / Prize Fee Indicator',
    },
    digital_arrest_police: {
      en: 'Digital Arrest / Official Impersonation Indicator',
      hi: 'डिजिटल अरेस्ट / अधिकारी पहचान का संकेत',
      hinglish: 'Digital Arrest / Impersonation Indicator',
    },
    remote_access_app: {
      en: 'Remote-Access / Unknown APK Indicator',
      hi: 'Remote-Access / अनजान APK का संकेत',
      hinglish: 'Remote-Access / Unknown APK Indicator',
    },
    phishing_link: {
      en: 'Suspicious / Deceptive Link Indicator',
      hi: 'संदिग्ध / भ्रामक लिंक का संकेत',
      hinglish: 'Suspicious / Deceptive Link Indicator',
    },
    courier_parcel: {
      en: 'Fake Courier / Parcel Fee Indicator',
      hi: 'नकली कूरियर / पार्सल शुल्क का संकेत',
      hinglish: 'Fake Courier / Parcel Indicator',
    },
    electricity_utility: {
      en: 'Electricity / Utility Disconnection Indicator',
      hi: 'बिजली / यूटिलिटी कटौती धमकी संकेत',
      hinglish: 'Electricity / Utility Disconnection Indicator',
    },
    investment_return: {
      en: 'Guaranteed Return / Investment Trap Indicator',
      hi: 'पक्का मुनाफा / निवेश जाल संकेत',
      hinglish: 'Investment / Guaranteed Return Indicator',
    },
    generic_mixed: {
      en: 'Mixed Suspicious Indicators',
      hi: 'मिश्रित संदिग्ध संकेत',
      hinglish: 'Mixed Suspicious Indicators',
    },
    no_strong_indicators: {
      en: 'No Strong Scam Category Matched',
      hi: 'कोई मजबूत ठगी श्रेणी नहीं मिली',
      hinglish: 'No Strong Scam Category Matched',
    },
  };

  return labels[category] ?? labels.generic_mixed;
}

/**
 * Top-level local deterministic analyzer.
 * Executes purely in memory inside the browser—zero network calls, zero storage, zero logging.
 */
export function analyzeMessage(rawInput: string): AnalysisResult {
  return analyzeMessageWithSandbox(rawInput, []);
}

/**
 * Evaluates a message using the production rulebook plus optional sandbox candidate rules.
 * Used strictly in the Detection Rulebook Candidate Validation Lab to measure before/after impact
 * and false-positive regressions without modifying the active production rulebook.
 */
export function analyzeMessageWithSandbox(
  rawInput: string,
  sandboxCandidateRules: RuleDefinition[]
): AnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const safeInput = typeof rawInput === 'string' ? rawInput.slice(0, MAX_INPUT_LENGTH) : '';

  const normResult = normalizeMessage(safeInput);
  const urlAnalyses = analyzeUrlsInText(safeInput);
  const entities = extractEntities(safeInput, urlAnalyses);
  const { assessment, clauses } = assessMessageContext(safeInput);
  const { triggeredRules, suppressedRules } = evaluateRules(
    normResult,
    clauses,
    sandboxCandidateRules
  );
  const crossSignals = evaluateCrossSignals(triggeredRules, urlAnalyses);

  const scoreResult = computeRiskScore(
    safeInput,
    triggeredRules,
    crossSignals,
    urlAnalyses,
    assessment
  );

  const highlightedSpans = mergeHighlightSpans(triggeredRules, urlAnalyses);
  const trustBoundaries = buildTrustBoundaries(
    scoreResult.verdict,
    triggeredRules,
    crossSignals,
    urlAnalyses,
    assessment
  );

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    originalText: safeInput,
    normalizedText: normResult.canonical,
    score: scoreResult.score,
    severity: scoreResult.severity,
    verdict: scoreResult.verdict,
    primaryCategory: scoreResult.primaryCategory,
    triggeredRules,
    suppressedRules,
    crossSignals,
    urlAnalyses,
    entities,
    highlightedSpans,
    contextAssessment: assessment,
    trustBoundaries,
    scoreBreakdown: scoreResult.breakdown,
    analyzedAtMs: Math.max(0.1, Number((endTime - startTime).toFixed(2))),
  };
}
