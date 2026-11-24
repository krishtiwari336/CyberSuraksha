export type Language = 'en' | 'hi' | 'hinglish';

export interface LocalizedText {
  en: string;
  hi: string;
  hinglish: string;
}

export type SourceVerificationStatus = 'officially_supported' | 'prototype_heuristic';

export type RuleGroup =
  | 'credential_theft'
  | 'upi_qr_fraud'
  | 'kyc_account_threat'
  | 'job_task_fee'
  | 'lottery_reward'
  | 'digital_arrest_legal'
  | 'remote_access_apk'
  | 'courier_utility'
  | 'investment_loan'
  | 'impersonation_social'
  | 'payment_demand'
  | 'phishing_link'
  | 'urgency_pressure';

export type ScamCategoryId =
  | 'otp_scam'
  | 'upi_pin_scam'
  | 'fake_job_internship'
  | 'fake_kyc_bank'
  | 'lottery_reward'
  | 'digital_arrest_police'
  | 'remote_access_app'
  | 'phishing_link'
  | 'courier_parcel'
  | 'electricity_utility'
  | 'investment_return'
  | 'generic_mixed'
  | 'no_strong_indicators';

export interface RulePattern {
  regex: string;
  flags?: string;
}

export type RuleOrigin = 'original' | 'newly_added';

export interface RuleDefinition {
  id: string;
  ruleOrigin?: RuleOrigin;
  addedReason?: LocalizedText;
  exampleTrigger?: string;
  safeguardsSummary?: LocalizedText;
  name: LocalizedText;
  category: ScamCategoryId;
  languages: Language[];
  patterns: RulePattern[];
  requiredContext?: RulePattern[];
  exclusions?: RulePattern[];
  weight: number;
  maxContribution: number;
  group: RuleGroup;
  explanation: LocalizedText;
  recommendedAction: LocalizedText;
  sourceId: string;
  sourceVerificationStatus: SourceVerificationStatus;
  suppressibleByAwarenessContext: boolean;
}

export interface TriggeredRule {
  ruleId: string;
  name: LocalizedText;
  category: ScamCategoryId;
  group: RuleGroup;
  baseWeight: number;
  appliedWeight: number;
  matchedText: string;
  spans: Array<{ start: number; end: number; text: string }>;
  explanation: LocalizedText;
  recommendedAction: LocalizedText;
  sourceId: string;
  sourceVerificationStatus: SourceVerificationStatus;
}

export interface SuppressedRule {
  ruleId: string;
  name: LocalizedText;
  matchedText: string;
  suppressionReason: LocalizedText;
}

export interface CrossSignalDefinition {
  id: string;
  name: LocalizedText;
  requiredGroups: RuleGroup[];
  requiredAnyUrlRisk?: boolean;
  bonusWeight: number;
  categoryOverride?: ScamCategoryId;
  whyItMatters: LocalizedText;
  recommendedAction: LocalizedText;
  sourceId: string;
  sourceVerificationStatus: SourceVerificationStatus;
}

export interface CrossSignalMatch {
  id: string;
  name: LocalizedText;
  signalsInvolved: string[];
  bonusWeight: number;
  whyItMatters: LocalizedText;
  recommendedAction: LocalizedText;
  sourceId: string;
  sourceVerificationStatus: SourceVerificationStatus;
}

export interface UrlSignal {
  type:
    | 'brand_in_subdomain'
    | 'lookalike_domain'
    | 'shortener'
    | 'ip_hostname'
    | 'punycode'
    | 'at_trick'
    | 'excessive_subdomains'
    | 'suspicious_path'
    | 'encoded_obfuscation'
    | 'obfuscated_notation'
    | 'http_only'
    | 'https_present'
    | 'suspicious_tld';
  weight: number;
  label: LocalizedText;
  detail: LocalizedText;
}

export interface UrlAnalysisResult {
  raw: string;
  normalizedUrl: string;
  start: number;
  end: number;
  protocol: string;
  hostname: string;
  subdomain: string | null;
  registrableDomain: string | null;
  publicSuffix: string | null;
  path: string;
  query: string;
  isShortener: boolean;
  isIpAddress: boolean;
  isPunycode: boolean;
  hasAtTrick: boolean;
  impersonatedBrand: string | null;
  officialBrandDomain: string | null;
  signals: UrlSignal[];
  totalUrlWeight: number;
  deceptionExplanation: LocalizedText;
}

export interface ExtractedEntities {
  phoneNumbers: string[];
  urls: string[];
  upiIds: string[];
  emailAddresses: string[];
  currencyAmounts: string[];
  paymentTerms: string[];
  credentialTerms: string[];
  appInstallRequests: string[];
  remoteAccessRequests: string[];
  bankNames: string[];
  brandNames: string[];
}

export interface HighlightedSpan {
  start: number;
  end: number;
  text: string;
  ruleId: string;
  category: ScamCategoryId;
  severity: 'critical' | 'high' | 'caution';
}

export type SeverityLevel = 'low' | 'caution' | 'high' | 'critical';
export type VerdictType = 'suspicious' | 'no_strong_indicators' | 'insufficient_evidence';

export interface ContextAssessment {
  hasAwarenessContext: boolean;
  hasNegationWarning: boolean;
  hasOfficialChannelReference: boolean;
  hasReceiveMoneyContext: boolean;
  hasNoFeeGuarantee: boolean;
  hasBenignDeliveryContext: boolean;
  awarenessMatches: string[];
  clauseCount: number;
}

export interface TrustBoundaries {
  whatWasDetected: LocalizedText[];
  whatCannotBeVerified: LocalizedText[];
  whatUserShouldDo: LocalizedText[];
}

export interface AnalysisResult {
  originalText: string;
  normalizedText: string;
  score: number;
  severity: SeverityLevel;
  verdict: VerdictType;
  primaryCategory: ScamCategoryId;
  triggeredRules: TriggeredRule[];
  suppressedRules: SuppressedRule[];
  crossSignals: CrossSignalMatch[];
  urlAnalyses: UrlAnalysisResult[];
  entities: ExtractedEntities;
  highlightedSpans: HighlightedSpan[];
  contextAssessment: ContextAssessment;
  trustBoundaries: TrustBoundaries;
  scoreBreakdown: {
    rulePoints: number;
    crossSignalPoints: number;
    urlPoints: number;
    rawTotal: number;
    cappedScore: number;
  };
  analyzedAtMs: number;
}

export type AwarenessAudience = 'family' | 'friends' | 'detailed';
export type AwarenessLanguageMode = 'hi' | 'en' | 'both';

export interface AwarenessResult {
  categoryUsed: ScamCategoryId;
  isNeutralFallback: boolean;
  hindiMessage: string;
  englishMessage: string;
  combinedMessage: string;
}

export interface SourceRecord {
  id: string;
  organization: string;
  title: string;
  url: string;
  date?: string;
  summary: LocalizedText;
}

export interface SafetyTip {
  id: string;
  text: LocalizedText;
  sourceId: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  message: string;
  isScam: boolean;
  options: Array<{
    id: string;
    label: LocalizedText;
  }>;
  correctOptionId: string;
  highlightPhrases: string[];
  explanation: LocalizedText;
  safetyLesson: LocalizedText;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  input: string;
  expectedSuspicious: boolean;
  expectedVerdict: VerdictType;
  expectedCategory: ScamCategoryId;
  minExpectedScore: number;
  maxExpectedScore: number;
  tags: string[];
  isBaseline?: boolean;
}

export type EmergingPatternStatus =
  | 'Newly Added Test Pattern'
  | 'Covered by Existing Rule'
  | 'Partially Covered'
  | 'Uncovered'
  | 'Candidate Rule'
  | 'Under Validation';

export interface EmergingPattern {
  id: string;
  name: LocalizedText;
  category: ScamCategoryId;
  exampleWording: string;
  scammerGoal: LocalizedText;
  signalsInvolved: string[];
  whyEngineMayMiss: LocalizedText;
  relatedActiveRuleIds: string[];
  suggestedImprovement: LocalizedText;
  linkedTestCaseId?: string;
  linkedCandidateRuleId?: string;
}

export type CandidateValidationStatus =
  | 'candidate'
  | 'under_validation'
  | 'approved_active'
  | 'rejected';

export type FalsePositiveRisk = 'low' | 'medium' | 'high';

export interface CandidateRule extends RuleDefinition {
  version: string;
  status: 'candidate_review' | 'under_validation';
  validationState?: CandidateValidationStatus;
  targetGapId: string;
  targetGapDescription?: LocalizedText;
  overlapsWithRuleIds?: string[];
  falsePositiveRisk?: FalsePositiveRisk;
  falsePositiveNotes?: LocalizedText;
  rationale: LocalizedText;
  exampleTrigger: string;
  isSessionUserDraft?: boolean;
}

export type FeedbackChoice = 'scam' | 'legit' | 'unsure';

export type FeedbackComparisonOutcome =
  | 'confirmed_scam'
  | 'potential_false_negative'
  | 'potential_false_positive'
  | 'confirmed_legit'
  | 'inconclusive';

export interface FeedbackComparison {
  outcome: FeedbackComparisonOutcome;
  title: LocalizedText;
  detail: LocalizedText;
}

export interface SanitizedPatternResult {
  sanitizedPattern: string;
  generalizedPattern: string;
  redactionsApplied: string[];
}

export type ContributedCoverageStatus =
  | 'detection_gap'
  | 'false_positive_review'
  | 'covered_by_existing'
  | 'needs_triage';

export type ContributedPatternStatus =
  | 'candidate'
  | 'under_validation'
  | 'approved_active'
  | 'rejected';

/**
 * In-memory session contribution record.
 * Intentionally omits raw/original user text so sensitive messages are never retained.
 */
export interface UserContributedPattern {
  id: string;
  sanitizedPattern: string;
  generalizedPattern: string;
  redactionsApplied: string[];
  feedbackType: FeedbackChoice;
  comparisonOutcome: FeedbackComparisonOutcome;
  analyzerVerdict: VerdictType;
  analyzerScore: number;
  analyzerCategory: ScamCategoryId;
  triggeredRuleIds: string[];
  triggeredRuleNames: LocalizedText[];
  missedOrMisclassifiedNote: LocalizedText;
  relatedExistingRuleIds: string[];
  coverageStatus: ContributedCoverageStatus;
  candidateImprovementId?: string;
  currentStatus: ContributedPatternStatus;
  addedAsSessionTestCase: boolean;
  sessionTestCaseId?: string;
  contributedAtLabel: string;
}

export interface CandidateValidationCaseDelta {
  testCase: TestCase;
  beforePassed: boolean;
  afterPassed: boolean;
  beforeScore: number;
  afterScore: number;
  beforeVerdict: VerdictType;
  afterVerdict: VerdictType;
  outcome: 'improved' | 'regressed' | 'unchanged_pass' | 'unchanged_fail';
}

export interface CandidateValidationSummary {
  candidateIds: string[];
  beforeMetrics: {
    passed: number;
    failed: number;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1: number | null;
  };
  afterMetrics: {
    passed: number;
    failed: number;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1: number | null;
  };
  improvedCount: number;
  regressedCount: number;
  caseDeltas: CandidateValidationCaseDelta[];
}

