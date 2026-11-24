import crossSignalsData from '../data/crossSignals.json';
import {
  CrossSignalDefinition,
  CrossSignalMatch,
  RuleGroup,
  TriggeredRule,
  UrlAnalysisResult,
} from '../types/analysis';

const CROSS_SIGNALS: CrossSignalDefinition[] = crossSignalsData as CrossSignalDefinition[];

/**
 * Correlates independent rule groups and URL risk signals to identify
 * multi-signal scam attack sequences without double-counting.
 */
export function evaluateCrossSignals(
  triggeredRules: TriggeredRule[],
  urlAnalyses: UrlAnalysisResult[]
): CrossSignalMatch[] {
  const activeGroups = new Set<RuleGroup>(triggeredRules.map((r) => r.group));
  const hasUrlRisk = urlAnalyses.some((u) => u.totalUrlWeight >= 5);

  const matches: CrossSignalMatch[] = [];

  for (const def of CROSS_SIGNALS) {
    const groupsSatisfied = def.requiredGroups.every((g) => activeGroups.has(g));
    if (!groupsSatisfied) continue;

    if (def.requiredAnyUrlRisk && !hasUrlRisk) {
      continue;
    }

    const signalsInvolved = triggeredRules
      .filter((r) => def.requiredGroups.includes(r.group))
      .map((r) => r.name.en);

    if (def.requiredAnyUrlRisk && hasUrlRisk) {
      signalsInvolved.push('Suspicious / Unverified URL');
    }

    matches.push({
      id: def.id,
      name: def.name,
      signalsInvolved: Array.from(new Set(signalsInvolved)),
      bonusWeight: def.bonusWeight,
      whyItMatters: def.whyItMatters,
      recommendedAction: def.recommendedAction,
      sourceId: def.sourceId,
      sourceVerificationStatus: def.sourceVerificationStatus,
    });
  }

  // Additional URL + KYC/Credential correlation if a deceptive URL co-occurs with KYC threat or credentials
  // and XSIG-KYC-BLOCK-OTP wasn't already triggered
  const alreadyHasKycXsig = matches.some((m) => m.id === 'XSIG-KYC-BLOCK-OTP');
  if (!alreadyHasKycXsig && hasUrlRisk && activeGroups.has('kyc_account_threat')) {
    matches.push({
      id: 'XSIG-KYC-URL-PHISH',
      name: {
        en: 'Fake KYC / Account Threat + Suspicious Link',
        hi: 'नकली KYC / खाता धमकी + संदिग्ध लिंक',
        hinglish: 'Fake KYC Threat + Suspicious Link',
      },
      signalsInvolved: [
        ...triggeredRules
          .filter((r) => r.group === 'kyc_account_threat')
          .map((r) => r.name.en),
        'Suspicious / Unverified URL',
      ],
      bonusWeight: 12,
      whyItMatters: {
        en: 'Combines an urgent account-blocking claim with an unverified or lookalike URL designed to harvest banking credentials.',
        hi: 'खाता बंद होने के डर के साथ एक अनजान या मिलते-जुलते लिंक पर जाने को कहा जा रहा है।',
        hinglish: 'Account block threat ke saath unverified ya lookalike URL diya gaya hai jo credentials chura sakta hai.',
      },
      recommendedAction: {
        en: 'Do not tap the link; open your bank’s official app yourself to check account status.',
        hi: 'लिंक पर क्लिक न करें; खुद बैंक की आधिकारिक ऐप खोलकर जाँच करें।',
        hinglish: 'Link par tap na karein; khud official bank app open karke status check karein.',
      },
      sourceId: 'rbi-kyc-2024',
      sourceVerificationStatus: 'officially_supported',
    });
  }

  return matches;
}
