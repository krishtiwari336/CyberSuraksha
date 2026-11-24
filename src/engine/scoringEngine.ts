import {
  ContextAssessment,
  CrossSignalMatch,
  RuleGroup,
  ScamCategoryId,
  SeverityLevel,
  TriggeredRule,
  UrlAnalysisResult,
  VerdictType,
} from '../types/analysis';

const GROUP_CAPS: Record<RuleGroup, number> = {
  credential_theft: 32,
  upi_qr_fraud: 30,
  kyc_account_threat: 28,
  job_task_fee: 28,
  lottery_reward: 28,
  digital_arrest_legal: 32,
  remote_access_apk: 28,
  courier_utility: 24,
  investment_loan: 26,
  impersonation_social: 15,
  payment_demand: 25,
  phishing_link: 18,
  urgency_pressure: 5,
};

const MAX_CROSS_SIGNAL_BONUS = 22;
const MAX_URL_POINTS = 25;

export interface ScoreComputation {
  score: number;
  severity: SeverityLevel;
  verdict: VerdictType;
  primaryCategory: ScamCategoryId;
  breakdown: {
    rulePoints: number;
    crossSignalPoints: number;
    urlPoints: number;
    rawTotal: number;
    cappedScore: number;
  };
}

const CATEGORY_PRIORITY: Record<ScamCategoryId, number> = {
  digital_arrest_police: 11,
  upi_pin_scam: 10,
  remote_access_app: 9,
  fake_kyc_bank: 8,
  otp_scam: 7,
  fake_job_internship: 6,
  lottery_reward: 5,
  electricity_utility: 4,
  courier_parcel: 3,
  investment_return: 3,
  phishing_link: 2,
  generic_mixed: 1,
  no_strong_indicators: 0,
};

export function computeRiskScore(
  originalText: string,
  triggeredRules: TriggeredRule[],
  crossSignals: CrossSignalMatch[],
  urlAnalyses: UrlAnalysisResult[],
  contextAssessment: ContextAssessment
): ScoreComputation {
  // 1. Group-capped rule contributions (prevents overlapping/repeated over-scoring)
  const groupTotals = new Map<RuleGroup, number>();

  for (const rule of triggeredRules) {
    const prev = groupTotals.get(rule.group) ?? 0;
    const cap = GROUP_CAPS[rule.group] ?? 25;
    const next = Math.min(cap, prev + rule.appliedWeight);
    groupTotals.set(rule.group, next);
  }

  let rulePoints = 0;
  for (const val of groupTotals.values()) {
    rulePoints += val;
  }

  // 2. Controlled cross-signal bonus
  const rawCrossSignal = crossSignals.reduce((acc, m) => acc + m.bonusWeight, 0);
  const crossSignalPoints = Math.min(MAX_CROSS_SIGNAL_BONUS, rawCrossSignal);

  // 3. Capped URL signal contribution (never double-count same URL pattern infinitely)
  const rawUrlPoints = urlAnalyses.reduce((acc, u) => acc + u.totalUrlWeight, 0);
  const urlPoints = Math.min(MAX_URL_POINTS, rawUrlPoints);

  const rawTotal = rulePoints + crossSignalPoints + urlPoints;
  const cappedScore = Math.max(0, Math.min(100, rawTotal));

  // Severity classification
  let severity: SeverityLevel = 'low';
  if (cappedScore >= 70) {
    severity = 'critical';
  } else if (cappedScore >= 40) {
    severity = 'high';
  } else if (cappedScore >= 20) {
    severity = 'caution';
  }

  // Three-state verdict
  const trimmedWords = originalText.trim().split(/\s+/).filter(Boolean).length;
  let verdict: VerdictType;

  if (cappedScore >= 20) {
    verdict = 'suspicious';
  } else if (
    triggeredRules.length === 0 &&
    urlAnalyses.length === 0 &&
    !contextAssessment.hasAwarenessContext &&
    trimmedWords <= 6
  ) {
    verdict = 'insufficient_evidence';
  } else {
    verdict = 'no_strong_indicators';
  }

  // Determine primary category
  let primaryCategory: ScamCategoryId = 'no_strong_indicators';

  if (verdict === 'suspicious') {
    // Prefer specific high-risk category from triggered rules
    const categoryWeights = new Map<ScamCategoryId, number>();
    if (urlPoints >= 10) {
      categoryWeights.set('phishing_link', urlPoints);
    }
    for (const r of triggeredRules) {
      if (r.category === 'generic_mixed' && triggeredRules.length > 1) continue;
      categoryWeights.set(r.category, (categoryWeights.get(r.category) ?? 0) + r.appliedWeight);
    }

    // If URL signals dominate (e.g. standalone deceptive URL)
    if (categoryWeights.size === 0 && urlPoints >= 15) {
      primaryCategory = 'phishing_link';
    } else if (categoryWeights.size > 0) {
      let bestCat: ScamCategoryId = 'generic_mixed';
      let bestScore = -1;
      for (const [cat, weight] of categoryWeights.entries()) {
        const tieBreaker = CATEGORY_PRIORITY[cat] ?? 0;
        const composite = weight * 100 + tieBreaker;
        if (composite > bestScore) {
          bestScore = composite;
          bestCat = cat;
        }
      }
      primaryCategory = bestCat;
    } else {
      primaryCategory = 'generic_mixed';
    }

    // Cross-signal category overrides if applicable and primary was generic/phishing
    if (
      crossSignals.some((cs) => cs.id === 'XSIG-KYC-BLOCK-OTP' || cs.id === 'XSIG-KYC-URL-PHISH') &&
      (primaryCategory === 'otp_scam' || primaryCategory === 'phishing_link')
    ) {
      primaryCategory = 'fake_kyc_bank';
    }
    if (crossSignals.some((cs) => cs.id === 'XSIG-REMOTE-APP-SUPPORT')) {
      primaryCategory = 'remote_access_app';
    }
    if (crossSignals.some((cs) => cs.id === 'XSIG-DIGITAL-ARREST-PAY')) {
      primaryCategory = 'digital_arrest_police';
    }
    if (crossSignals.some((cs) => cs.id === 'XSIG-UPI-PIN-RECEIVE')) {
      primaryCategory = 'upi_pin_scam';
    }
  }

  return {
    score: cappedScore,
    severity,
    verdict,
    primaryCategory,
    breakdown: {
      rulePoints,
      crossSignalPoints,
      urlPoints,
      rawTotal,
      cappedScore,
    },
  };
}
