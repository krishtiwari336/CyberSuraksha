import {
  AnalysisResult,
  CandidateRule,
  ContributedCoverageStatus,
  FeedbackChoice,
  FeedbackComparison,
  RuleDefinition,
  SanitizedPatternResult,
  UserContributedPattern,
} from '../types/analysis';

/**
 * Strips personal identifiers, numeric secrets, handles, and unique URL paths
 * locally in memory so raw user messages are never retained in contributions.
 */
export function sanitizeMessageLocally(rawInput: string): SanitizedPatternResult {
  if (!rawInput.trim()) {
    return {
      sanitizedPattern: '',
      generalizedPattern: '',
      redactionsApplied: [],
    };
  }

  let text = rawInput.trim();
  const redactions = new Set<string>();

  const applyReplace = (
    pattern: RegExp,
    replacement: string | ((...args: string[]) => string),
    tag: string
  ) => {
    const next = text.replace(pattern, replacement as never);
    if (next !== text) {
      redactions.add(tag);
      text = next;
    }
  };

  // 1. Strip unique URL paths/queries/tokens while preserving only generic domain cue
  applyReplace(
    /\bhttps?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?:\/[^\s]*)?/gi,
    (_m, host) => `[URL:${String(host).toLowerCase()}/...]`,
    'Unique URL paths & query tokens'
  );
  applyReplace(
    /\bwww\.([a-z0-9.-]+\.[a-z]{2,})(?:\/[^\s]*)?/gi,
    (_m, host) => `[URL:www.${String(host).toLowerCase()}/...]`,
    'Unique URL paths & query tokens'
  );
  applyReplace(/\bupi:\/\/[^\s.,;!?]+/gi, '[UPI_LINK]', 'UPI payment URIs');

  // 2. Email addresses (before UPI IDs since both use @)
  applyReplace(
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    '[EMAIL]',
    'Email addresses'
  );

  // 3. UPI IDs (e.g. name@okaxis, 9876543210@ybl)
  applyReplace(/\b[a-z0-9._-]{2,}@[a-z0-9.-]{2,}\b/gi, '[UPI_ID]', 'UPI IDs');

  // 4. Indian mobile / phone numbers (+91 optional, 10 digits starting 6-9)
  applyReplace(
    /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g,
    '[PHONE]',
    'Phone numbers'
  );

  // 5. PAN & IFSC-like identifiers
  applyReplace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[PAN_ID]', 'PAN numbers');
  applyReplace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[IFSC]', 'Bank IFSC codes');

  // 6. Masked/partial account or card numbers (e.g. XXXX1234, **** 5678, A/C 1234567890)
  applyReplace(
    /(?:x{3,}|\*{3,})[\s-]?\d{3,6}\b/gi,
    '[ACCOUNT_REF]',
    'Account/card references'
  );
  applyReplace(
    /\b(?:a\/c|acct|account|card)\s*(?:no\.?|number|#|:)?\s*\d{4,16}\b/gi,
    '[ACCOUNT_NUMBER]',
    'Account/card references'
  );

  // 7. Currency amounts (₹5,000, Rs. 499, INR 1,45,000)
  applyReplace(
    /(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d{1,2})?/gi,
    '[AMOUNT]',
    'Currency amounts'
  );

  // 8. Standalone 4–16 digit numeric codes / Aadhaar / OTPs
  applyReplace(/\b\d{4}(?:[\s-]\d{4}){2}\b/g, '[ID_NUMBER]', '12-digit ID numbers');
  applyReplace(/\b\d{4,16}\b/g, '[NUMBER]', 'Numeric codes & IDs');

  // 9. Salutations & signature names (e.g. "Dear Rajesh,", "Hi Priya Verma", "Regards, Amit Kumar")
  applyReplace(
    /\b([Dd]ear|[Hh]ello|[Hh]i|[Mm]r\.?|[Mm]rs\.?|[Mm]s\.?|[Ss]hri|[Ss]mt\.?)\s+(?!(?:Customer|Sir|Madam|User|Member|Friend|Team|Applicant|Holder)\b)([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?)(?=[,:\s.!?\n]|$)/g,
    (_m, salutation) => `${salutation} [NAME]`,
    'Personal names'
  );
  applyReplace(
    /\b([Rr]egards|[Tt]hanks|[Ff]rom|[Ss]igned|[Ss]ent\s+by)([:,\s]+)(?!(?:Team|Support|Desk|Department|Bank|Service)\b)([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?)(?=[,:\s.!?\n]|$)/g,
    (_m, label, sep) => `${label}${sep}[NAME]`,
    'Personal names'
  );

  const sanitizedPattern = text.replace(/\s+/g, ' ').trim();
  const generalizedPattern = buildGeneralizedTemplate(sanitizedPattern);

  return {
    sanitizedPattern,
    generalizedPattern,
    redactionsApplied: Array.from(redactions),
  };
}

function buildGeneralizedTemplate(sanitized: string): string {
  const tokens = sanitized
    .replace(/\[(?:PHONE|UPI_ID|EMAIL|AMOUNT|NUMBER|ID_NUMBER|NAME|ACCOUNT_REF|ACCOUNT_NUMBER|PAN_ID|IFSC|URL:[^\]]+)\]/g, '<MASK>')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f<>_\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w !== '<mask>')
    .slice(0, 8);

  if (tokens.length === 0) {
    return sanitized;
  }
  return tokens.join(' + ');
}

/**
 * Compares unverified user feedback with the analyzer verdict without treating
 * feedback as verified ground truth.
 */
export function compareFeedbackWithAnalysis(
  feedback: FeedbackChoice,
  analysis: AnalysisResult
): FeedbackComparison {
  const flagged = analysis.verdict === 'suspicious';

  if (feedback === 'unsure') {
    return {
      outcome: 'inconclusive',
      title: {
        en: 'Inconclusive feedback',
        hi: 'अनिश्चित प्रतिक्रिया',
        hinglish: 'Inconclusive feedback',
      },
      detail: {
        en: 'Marked as unsure. No rule accuracy or safety claim is inferred from this entry.',
        hi: 'निश्चित नहीं चुना गया। इससे नियम की सटीकता पर कोई निष्कर्ष नहीं निकाला जाता।',
        hinglish: 'Unsure mark kiya gaya. Isse rule accuracy par koi claim nahi nikala jata.',
      },
    };
  }

  if (flagged && feedback === 'scam') {
    return {
      outcome: 'confirmed_scam',
      title: {
        en: 'Confirmed feedback',
        hi: 'पुष्टिकृत प्रतिक्रिया (स्काम मेल)',
        hinglish: 'Confirmed feedback',
      },
      detail: {
        en: `Analyzer flagged suspicious signals (${analysis.score}/100) and your feedback aligns that it was a scam.`,
        hi: `इंजन ने संदिग्ध संकेत पकड़े (${analysis.score}/100) और आपकी प्रतिक्रिया भी इसे ठगी बताती है।`,
        hinglish: `Analyzer ne suspicious signals detect kiye (${analysis.score}/100) aur aapne bhi ise scam confirm kiya.`,
      },
    };
  }

  if (!flagged && feedback === 'scam') {
    return {
      outcome: 'potential_false_negative',
      title: {
        en: 'Potential false negative (Detection Gap)',
        hi: 'संभावित छूटा हुआ स्काम (Detection Gap)',
        hinglish: 'Potential false negative',
      },
      detail: {
        en: `Analyzer scored ${analysis.score}/100 (${analysis.verdict}), while you reported it was a scam. Reviewable as a potential coverage gap.`,
        hi: `इंजन ने इसे ${analysis.score}/100 (${analysis.verdict}) दिया, लेकिन आपने इसे ठगी बताया। यह संभावित पहचान अंतराल हो सकता है।`,
        hinglish: `Analyzer score ${analysis.score}/100 (${analysis.verdict}) tha, par aapne scam bataya. Yeh potential detection gap ho sakta hai.`,
      },
    };
  }

  if (flagged && feedback === 'legit') {
    return {
      outcome: 'potential_false_positive',
      title: {
        en: 'Potential false positive',
        hi: 'संभावित गलत चेतावनी (False Positive)',
        hinglish: 'Potential false positive',
      },
      detail: {
        en: `Analyzer flagged suspicious indicators (${analysis.score}/100), while you reported it was legitimate. Reviewable for exclusion tuning.`,
        hi: `इंजन ने संदिग्ध संकेत दिखाए (${analysis.score}/100), लेकिन आपने इसे सही संदेश बताया। इसे गलत अलार्म समीक्षा में देखा जा सकता है।`,
        hinglish: `Analyzer ne flag kiya (${analysis.score}/100), par aapne legit bataya. Exclusion/context tuning review ke liye note kiya ja sakta hai.`,
      },
    };
  }

  return {
    outcome: 'confirmed_legit',
    title: {
      en: 'Aligned genuine feedback',
      hi: 'सही संदेश से मेल खाती प्रतिक्रिया',
      hinglish: 'Confirmed legit alignment',
    },
    detail: {
      en: `Analyzer found no strong scam signals (${analysis.score}/100) and your feedback aligns that it was legitimate.`,
      hi: `इंजन को कोई मजबूत ठगी संकेत नहीं मिला (${analysis.score}/100) और आपने भी इसे सही बताया।`,
      hinglish: `Analyzer ko strong scam signals nahi mile (${analysis.score}/100) aur aapne bhi ise legit confirm kiya.`,
    },
  };
}

/**
 * Builds a privacy-sanitized, session-only contribution record.
 * Never receives or stores raw input text.
 */
export function buildContributionRecord(
  sanitized: SanitizedPatternResult,
  feedback: FeedbackChoice,
  analysis: AnalysisResult,
  activeRules: RuleDefinition[],
  idSuffix: number
): UserContributedPattern {
  const comparison = compareFeedbackWithAnalysis(feedback, analysis);

  let coverageStatus: ContributedCoverageStatus = 'needs_triage';
  let missedOrMisclassifiedNote = comparison.detail;

  if (comparison.outcome === 'potential_false_negative') {
    coverageStatus = 'detection_gap';
    missedOrMisclassifiedNote = {
      en: 'Production rules scored below the suspicious threshold; candidate pattern drafting recommended for human review.',
      hi: 'मौजूदा नियम इसे संदिग्ध सीमा से नीचे आंकते हैं; मानवीय समीक्षा के लिए प्रस्तावित नियम बनाया जा सकता है।',
      hinglish: 'Active rules score suspicious threshold se kam raha; human review ke liye candidate rule draft kiya ja sakta hai.',
    };
  } else if (comparison.outcome === 'potential_false_positive') {
    coverageStatus = 'false_positive_review';
    const ruleList = analysis.triggeredRules.map((r) => r.ruleId).join(', ') || 'URL heuristics';
    missedOrMisclassifiedNote = {
      en: `Potentially over-triggered on legitimate wording (${ruleList}); exclusion or awareness context check recommended.`,
      hi: `सही संदेश पर संभावित रूप से अधिक स्कोर (${ruleList}); सुरक्षा अपवाद जाँचने योग्य है।`,
      hinglish: `Genuine text par rule (${ruleList}) zyada score de raha ho sakta hai; exclusion review zaroori hai.`,
    };
  } else if (comparison.outcome === 'confirmed_scam') {
    coverageStatus = 'covered_by_existing';
  }

  const triggeredIds = analysis.triggeredRules.map((r) => r.ruleId);
  const relatedIds =
    triggeredIds.length > 0
      ? triggeredIds
      : activeRules
          .filter((r) => r.category === analysis.primaryCategory)
          .slice(0, 3)
          .map((r) => r.id);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: `USR-${String(idSuffix).padStart(2, '0')}`,
    sanitizedPattern: sanitized.sanitizedPattern,
    generalizedPattern: sanitized.generalizedPattern,
    redactionsApplied: sanitized.redactionsApplied,
    feedbackType: feedback,
    comparisonOutcome: comparison.outcome,
    analyzerVerdict: analysis.verdict,
    analyzerScore: analysis.score,
    analyzerCategory: analysis.primaryCategory,
    triggeredRuleIds: triggeredIds,
    triggeredRuleNames: analysis.triggeredRules.map((r) => r.name),
    missedOrMisclassifiedNote,
    relatedExistingRuleIds: relatedIds,
    coverageStatus,
    currentStatus: coverageStatus === 'covered_by_existing' ? 'under_validation' : 'candidate',
    addedAsSessionTestCase: false,
    contributedAtLabel: `Session · ${timeLabel}`,
  };
}

/**
 * Generates an unpromoted draft CandidateRule from a consented missed-scam pattern.
 * Strictly isolated to sandbox review; never auto-added to production rules.
 */
export function buildDraftCandidateFromContribution(
  contribution: UserContributedPattern
): CandidateRule {
  const keywords = contribution.sanitizedPattern
    .replace(/\[[^\]]+\]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 4);

  const safePattern =
    keywords.length >= 2
      ? keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.{0,45}')
      : 'unverified\\s+user\\s+reported\\s+pattern';

  const candId = `CAND-${contribution.id}`;
  return {
    id: candId,
    version: 'session-draft',
    status: 'candidate_review',
    validationState: 'candidate',
    isSessionUserDraft: true,
    targetGapId: contribution.id,
    targetGapDescription: {
      en: `User-reported potential false negative from sanitized pattern: "${contribution.generalizedPattern}"`,
      hi: `उपयोगकर्ता द्वारा रिपोर्ट किया गया संभावित अंतराल: "${contribution.generalizedPattern}"`,
      hinglish: `User-reported potential detection gap: "${contribution.generalizedPattern}"`,
    },
    overlapsWithRuleIds: contribution.relatedExistingRuleIds,
    falsePositiveRisk: 'medium',
    falsePositiveNotes: {
      en: 'Medium risk — generated from a single unverified user report; requires multi-case Red-Team and genuine-message validation before any promotion.',
      hi: 'मध्यम जोखिम — केवल एक असत्यापित रिपोर्ट से बना ड्राफ्ट; सक्रिय करने से पहले रेड-टीम और सही संदेशों पर परीक्षण जरूरी है।',
      hinglish: 'Medium risk — single unverified report se bana draft; production mein lene se pehle Red-Team validation zaroori hai.',
    },
    exampleTrigger: contribution.sanitizedPattern,
    rationale: {
      en: 'Drafted strictly in session sandbox from an anonymized pattern where the analyzer scored below the suspicious threshold.',
      hi: 'गुमनाम पैटर्न से सैंडबॉक्स समीक्षा के लिए तैयार प्रस्तावित नियम (उत्पादन में सक्रिय नहीं)।',
      hinglish: 'Anonymized pattern se sandbox review ke liye draft rule (active production mein nahi hai).',
    },
    name: {
      en: `Session Candidate (${contribution.id})`,
      hi: `सत्र प्रस्तावित नियम (${contribution.id})`,
      hinglish: `Session Candidate (${contribution.id})`,
    },
    category:
      contribution.analyzerCategory !== 'no_strong_indicators'
        ? contribution.analyzerCategory
        : 'generic_mixed',
    languages: ['en', 'hi', 'hinglish'],
    patterns: [{ regex: safePattern, flags: 'gi' }],
    exclusions: [
      { regex: '\\b(?:never|do\\s+not|beware\\s+of|official\\s+app\\s+only)\\b', flags: 'i' },
    ],
    weight: 22,
    maxContribution: 22,
    group: 'payment_demand',
    explanation: {
      en: `Draft pattern derived from sanitized contribution ${contribution.id}; inactive in production until human review.`,
      hi: `योगदान ${contribution.id} से बना ड्राफ्ट पैटर्न; समीक्षा तक सक्रिय नहीं।`,
      hinglish: `Contribution ${contribution.id} se bana draft pattern; review ke bina active nahi.`,
    },
    recommendedAction: {
      en: 'Verify independently through official apps and helplines before trusting unexpected requests.',
      hi: 'किसी भी अनजान संदेश पर भरोसा करने से पहले आधिकारिक ऐप या हेल्पलाइन से पुष्टि करें।',
      hinglish: 'Unexpected messages ko official app ya helpline se verify karein.',
    },
    sourceId: 'certin-2024-0050',
    sourceVerificationStatus: 'prototype_heuristic',
    suppressibleByAwarenessContext: true,
  };
}
