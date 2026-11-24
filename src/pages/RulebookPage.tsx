import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Info,
  MessageSquarePlus,
  PlusCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import candidateRulesData from '../data/candidateRules.json';
import crossSignalsData from '../data/crossSignals.json';
import sourcesData from '../data/sources.json';
import testCasesData from '../data/testCases.json';
import { evaluateCandidateSandbox } from '../engine/candidateEvaluator';
import { getCategoryLabel } from '../engine/classifier';
import { getActiveRules } from '../engine/rulesEngine';
import { UI_STRINGS } from '../i18n/translations';
import {
  CandidateRule,
  CandidateValidationSummary,
  CrossSignalDefinition,
  Language,
  RuleDefinition,
  RuleGroup,
  ScamCategoryId,
  SourceRecord,
  TestCase,
  UserContributedPattern,
} from '../types/analysis';

export type RulebookSubTab = 'original' | 'newly_added' | 'candidates';

interface RulebookPageProps {
  language: Language;
  activeSubTab: RulebookSubTab;
  onChangeSubTab: (tab: RulebookSubTab) => void;
  contributedPatterns: UserContributedPattern[];
  sessionCandidates: CandidateRule[];
  sessionTestCases: TestCase[];
  validatedCandidateIds: Record<string, boolean>;
  onCreateCandidateFromContribution: (contribId: string) => void;
  onAddSessionTestCase: (contribId: string) => void;
  onMarkCandidatesValidated: (candidateIds: string[]) => void;
  onGoToAnalyzer: () => void;
}

const ACTIVE_RULES: RuleDefinition[] = getActiveRules();
const ORIGINAL_RULES: RuleDefinition[] = ACTIVE_RULES.filter(
  (r) => r.ruleOrigin !== 'newly_added'
);
const NEWLY_ADDED_RULES: RuleDefinition[] = ACTIVE_RULES.filter(
  (r) => r.ruleOrigin === 'newly_added'
);
const CROSS_SIGNALS: CrossSignalDefinition[] = crossSignalsData as CrossSignalDefinition[];
const BUILT_IN_CANDIDATES: CandidateRule[] = candidateRulesData as CandidateRule[];
const BUNDLED_TEST_CASES: TestCase[] = testCasesData as TestCase[];
const SOURCES: SourceRecord[] = sourcesData as SourceRecord[];

const GROUP_CAP_MAP: Record<RuleGroup, number> = {
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

const RULE_TRIGGER_EXAMPLES: Record<string, string> = {
  'RULE-OTP-01': 'Please share your 6-digit bank OTP immediately to keep your account active.',
  'RULE-PIN-02': 'Enter your ATM PIN / MPIN to complete card verification now.',
  'RULE-CVV-03': 'Submit your card CVV and netbanking password to confirm refund.',
  'RULE-UPI-PIN-RECEIVE-04': 'Scan this QR code and enter your UPI PIN to receive ₹2,500 cashback.',
  'RULE-UPI-COLLECT-05': 'Approve the UPI collect request to claim your refund today.',
  'RULE-KYC-BLOCK-06': 'Your bank account will be blocked today unless you update KYC immediately.',
  'RULE-BANK-IMPERSONATION-07': 'Dear customer, bank alert: verification team warns suspension within 24 hours.',
  'RULE-JOB-FEE-08': 'Work from home internship selected! Pay ₹499 registration fee to confirm slot.',
  'RULE-TASK-SCAM-09': 'Like YouTube videos and earn ₹3,000 daily! Message on Telegram for prepaid task.',
  'RULE-LOTTERY-PRIZE-10': 'Congratulations! You won ₹25,00,000 KBC lottery. Pay ₹2,000 processing fee to claim prize.',
  'RULE-CASHBACK-FAKE-11': 'Cashback of ₹1,500 expiring today! Click now to claim your reward.',
  'RULE-DIGITAL-ARREST-12': 'CBI notice: your Aadhaar is linked to an illegal drugs parcel; stay on call under digital arrest.',
  'RULE-LEGAL-THREAT-PAY-13': 'Court warrant issued—pay ₹15,000 immediately via UPI to avoid arrest.',
  'RULE-REMOTE-ACCESS-14': 'Download AnyDesk and share the 9-digit support code for KYC verification.',
  'RULE-MALICIOUS-APK-15': 'Download and install echallan-verify.apk from this app link now.',
  'RULE-COURIER-PARCEL-16': 'India Post parcel held at customs due to incomplete address; pay ₹35 redelivery fee.',
  'RULE-ELECTRICITY-UTILITY-17': 'Electricity supply will be disconnected tonight at 9:30 PM. Call 9876543210 immediately.',
  'RULE-INVESTMENT-GUARANTEED-18': 'Join VIP trading group for guaranteed profit and 100% risk-free double your money.',
  'RULE-FAKE-LOAN-19': 'Pre-approved instant loan ₹2,00,000! Pay ₹1,999 processing fee before disbursal.',
  'RULE-SIM-SWAP-20': 'Your SIM card will be blocked today; forward 20-digit eSIM SMS code now.',
  'RULE-CUSTOMER-CARE-21': 'Bank customer care helpline: call immediately on 9876501234 for refund.',
  'RULE-MONEY-MULE-22': 'Rent your bank account and earn 3% commission on every transfer you receive and forward.',
  'RULE-SOCIAL-EMERGENCY-23': 'Phone lost, stuck in hospital emergency—send ₹8,000 on this new UPI number urgently.',
  'RULE-MISTAKEN-TRANSFER-24': 'Sir galti se paise bhej diye ₹2,500 aapke number par, turant wapas bhej do.',
  'RULE-FAKE-CHARITY-25': 'Critical surgery child ICU relief fund—donate urgently, send to UPI now.',
  'RULE-CHALLAN-TAX-26': 'Pending traffic e-challan court notice—click here to pay now or install APK.',
  'RULE-UPFRONT-PAYMENT-27': 'Pay ₹999 verification fee to unlock your approved payout immediately.',
  'RULE-PHISHING-LINK-CRED-28': 'Click the below link to verify your KYC and reactivate account.',
  'RULE-URGENCY-29': 'Final warning: complete action within 2 hours or face permanent suspension.',
  'RULE-IMPERSONATION-30': 'Official notice from bank KYC officer head office calling regarding compliance.',
  'RULE-RECRUITMENT-31': 'Refer friends and earn team commission—add 5 members to unlock bonus.',
  'RULE-OBFUSCATED-CRED-32': 'Verify your O.T.P. and K.Y.C. details before account freeze.',
  'RULE-WHATSAPP-CODE-33':
    'Hey, I accidentally sent my 6-digit WhatsApp verification code to your number, please forward it back urgently.',
  'RULE-CARD-LIMIT-34':
    'Credit card limit upgrade approved up to ₹5,00,000! Submit card number and expiry now to activate annual fee waiver.',
};

function formatRate(val: number | null): string {
  return val !== null ? `${val.toFixed(1)}%` : 'N/A';
}

function summarizeRegexList(patterns?: Array<{ regex: string }>): string[] {
  if (!patterns || patterns.length === 0) return [];
  return patterns.map((p) =>
    p.regex
      .replace(/\\b/g, '')
      .replace(/\\s[+*?]?/g, ' ')
      .replace(/\(\?:/g, '(')
      .replace(/\\\\/g, '\\')
  );
}

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

export function RulebookPage({
  language,
  activeSubTab,
  onChangeSubTab,
  contributedPatterns,
  sessionCandidates,
  sessionTestCases,
  validatedCandidateIds,
  onCreateCandidateFromContribution,
  onAddSessionTestCase,
  onMarkCandidatesValidated,
  onGoToAnalyzer,
}: RulebookPageProps) {
  const t = UI_STRINGS[language].rulebook;
  const analyzerStrings = UI_STRINGS[language].analyzer;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScamCategoryId | 'all'>('all');
  const [verificationFilter, setVerificationFilter] = useState<
    'all' | 'officially_supported' | 'prototype_heuristic'
  >('all');
  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<string, boolean>>({});
  const [pipelineTrack, setPipelineTrack] = useState<'candidate' | 'promoted'>('candidate');
  const [copiedContribId, setCopiedContribId] = useState<string | null>(null);

  const allCandidates = useMemo(
    () => [...BUILT_IN_CANDIDATES, ...sessionCandidates],
    [sessionCandidates]
  );

  const allSandboxTestCases = useMemo(
    () => [...BUNDLED_TEST_CASES, ...sessionTestCases],
    [sessionTestCases]
  );

  // Selected candidate rules for sandbox testing (never mutates production engine)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const c of BUILT_IN_CANDIDATES) {
      initial[c.id] = true;
    }
    return initial;
  });
  const [sandboxSummary, setSandboxSummary] = useState<CandidateValidationSummary | null>(null);
  const [deltaFilter, setDeltaFilter] = useState<
    'all' | 'improved' | 'regressed' | 'scam' | 'genuine'
  >('improved');

  const sourceMap = useMemo(() => {
    const map = new Map<string, SourceRecord>();
    for (const s of SOURCES) map.set(s.id, s);
    return map;
  }, []);

  const originalOfficialCount = useMemo(
    () => ORIGINAL_RULES.filter((r) => r.sourceVerificationStatus === 'officially_supported').length,
    []
  );
  const originalPrototypeCount = ORIGINAL_RULES.length - originalOfficialCount;

  const originalCategoriesPresent = useMemo(() => {
    const set = new Set<ScamCategoryId>();
    for (const r of ORIGINAL_RULES) set.add(r.category);
    return Array.from(set);
  }, []);

  const filteredOriginalRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ORIGINAL_RULES.filter((rule) => {
      if (selectedCategory !== 'all' && rule.category !== selectedCategory) return false;
      if (
        verificationFilter !== 'all' &&
        rule.sourceVerificationStatus !== verificationFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        rule.id.toLowerCase().includes(q) ||
        rule.name[language].toLowerCase().includes(q) ||
        rule.name.en.toLowerCase().includes(q) ||
        rule.explanation[language].toLowerCase().includes(q) ||
        rule.group.toLowerCase().includes(q) ||
        getCategoryLabel(rule.category)[language].toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory, verificationFilter, language]);

  const toggleRuleExpanded = (id: string) => {
    setExpandedRuleIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) => ({ ...prev, [id]: !prev[id] }));
    setSandboxSummary(null);
  };

  const handleRunSandbox = () => {
    const activeSelection = allCandidates.filter(
      (c) => selectedCandidateIds[c.id] ?? c.isSessionUserDraft === true
    );
    const summary = evaluateCandidateSandbox(allSandboxTestCases, activeSelection);
    setSandboxSummary(summary);
    setDeltaFilter(summary.improvedCount > 0 ? 'improved' : 'all');
    onMarkCandidatesValidated(activeSelection.map((c) => c.id));
  };

  const handleCopyContribution = async (id: string, sanitizedPattern: string) => {
    const ok = await copyText(sanitizedPattern);
    if (ok) {
      setCopiedContribId(id);
      window.setTimeout(() => {
        setCopiedContribId((cur) => (cur === id ? null : cur));
      }, 2200);
    }
  };

  const filteredDeltas = useMemo(() => {
    if (!sandboxSummary) return [];
    return sandboxSummary.caseDeltas.filter((d) => {
      if (deltaFilter === 'improved') return d.outcome === 'improved';
      if (deltaFilter === 'regressed') return d.outcome === 'regressed';
      if (deltaFilter === 'scam') return d.testCase.expectedSuspicious;
      if (deltaFilter === 'genuine') return !d.testCase.expectedSuspicious;
      return true;
    });
  }, [sandboxSummary, deltaFilter]);

  const anyCandidateValidated = Object.keys(validatedCandidateIds).length > 0;
  const hasContributions = contributedPatterns.length > 0;
  const hasSessionTestCase = sessionTestCases.length > 0;

  type PipelineTone = 'green' | 'blue' | 'violet' | 'grey';
  const getPipelineStepState = (
    idx: number
  ): { tone: PipelineTone; statusLabel: string } => {
    if (pipelineTrack === 'promoted') {
      return { tone: 'green', statusLabel: 'Approved / Active' };
    }

    // Honest state for non-promoted Candidates & Session Contributions
    switch (idx) {
      case 0: // User Feedback
        return hasContributions
          ? { tone: 'green', statusLabel: 'Recorded (Session)' }
          : { tone: 'grey', statusLabel: 'Optional' };
      case 1: // Consent
        return hasContributions
          ? { tone: 'green', statusLabel: 'Explicit Yes' }
          : { tone: 'grey', statusLabel: 'Pending' };
      case 2: // Sanitized Pattern
        return hasContributions
          ? { tone: 'blue', statusLabel: 'Sanitized Locally' }
          : { tone: 'grey', statusLabel: 'Pending' };
      case 3: // Test Case
        return hasSessionTestCase || anyCandidateValidated
          ? { tone: 'blue', statusLabel: 'Linked Test Case' }
          : { tone: 'grey', statusLabel: 'Pending' };
      case 4: // Candidate Rule
        return { tone: 'violet', statusLabel: 'Candidate' };
      case 5: // Validation
        return anyCandidateValidated
          ? { tone: 'blue', statusLabel: 'Under validation' }
          : { tone: 'grey', statusLabel: 'Not yet run' };
      case 6: // Approval
        return { tone: 'grey', statusLabel: 'Pending Review' };
      case 7: // Active Rule
      default:
        return { tone: 'grey', statusLabel: 'Inactive' };
    }
  };

  const pipelineToneClass: Record<PipelineTone, string> = {
    green: 'border-emerald-300 bg-emerald-50/90 text-emerald-950',
    blue: 'border-blue-300 bg-blue-50/90 text-blue-950',
    violet: 'border-violet-300 bg-violet-50/90 text-violet-950',
    grey: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  const pipelinePillClass: Record<PipelineTone, string> = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    grey: 'bg-slate-200/80 text-slate-600 border-slate-300/70',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner + Real Computed Counts */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white border border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-950/15 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-300">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Deterministic Rule Transparency · Zero Black-Box AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">{t.title}</h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{t.subtitle}</p>
          </div>
        </div>

        {/* 4 Real Dynamic Count Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-3">
            <div className="text-xs text-slate-400 font-sans">{t.counts.original}</div>
            <div className="text-2xl font-bold text-white mt-0.5">{ORIGINAL_RULES.length}</div>
          </div>

          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3">
            <div className="text-xs text-emerald-300 font-sans">{t.counts.newlyAdded}</div>
            <div className="text-2xl font-bold text-emerald-300 mt-0.5">
              {NEWLY_ADDED_RULES.length}
            </div>
          </div>

          <div className="rounded-xl border border-violet-500/40 bg-violet-950/40 px-4 py-3">
            <div className="text-xs text-violet-300 font-sans">{t.counts.candidates}</div>
            <div className="text-2xl font-bold text-violet-300 mt-0.5">
              {allCandidates.length}
            </div>
          </div>

          <div className="rounded-xl border border-teal-500/40 bg-teal-950/50 px-4 py-3">
            <div className="text-xs text-teal-300 font-sans">{t.counts.totalActive}</div>
            <div className="text-2xl font-bold text-teal-300 mt-0.5">{ACTIVE_RULES.length}</div>
          </div>
        </div>

        {/* 3 Clear Rule Category Tabs */}
        <div
          role="tablist"
          aria-label="Rulebook categories"
          className="pt-4 border-t border-slate-800 flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'original'}
            onClick={() => onChangeSubTab('original')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'original'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            {t.tabs.original} ({ORIGINAL_RULES.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'newly_added'}
            onClick={() => onChangeSubTab('newly_added')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'newly_added'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-emerald-950/50 text-emerald-200 border border-emerald-700/60 hover:bg-emerald-900/60'
            }`}
          >
            {t.tabs.newlyAdded} ({NEWLY_ADDED_RULES.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'candidates'}
            onClick={() => onChangeSubTab('candidates')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'candidates'
                ? 'bg-violet-500 text-white shadow-sm'
                : 'bg-violet-950/50 text-violet-200 border border-violet-700/60 hover:bg-violet-900/60'
            }`}
          >
            {t.tabs.candidates} ({allCandidates.length})
          </button>
        </div>
      </section>

      {/* 8-Step Rule Improvement Pipeline */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-700" aria-hidden="true" />
            <h2 className="text-base font-display font-bold text-slate-900">{t.pipelineTitle}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPipelineTrack('candidate')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                pipelineTrack === 'candidate'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Session & Candidate Track
            </button>
            <button
              type="button"
              onClick={() => setPipelineTrack('promoted')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                pipelineTrack === 'promoted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Newly Added Active Rules
            </button>
          </div>
        </div>

        <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {t.pipelineSteps.map((step, idx) => {
            const state = getPipelineStepState(idx);
            return (
              <li
                key={step}
                className={`rounded-xl border px-2.5 py-2.5 text-xs transition-all ${pipelineToneClass[state.tone]}`}
              >
                <div className="flex items-center justify-between gap-1 font-mono text-[10px] opacity-75">
                  <span>0{idx + 1}</span>
                </div>
                <div className="font-semibold mt-0.5 leading-snug">{step}</div>
                <span
                  className={`mt-1.5 inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium ${pipelinePillClass[state.tone]}`}
                >
                  {state.statusLabel}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" aria-hidden="true" />
            <span>Violet: Candidate</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true" />
            <span>Blue: Under validation</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Green: Approved / Active</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Grey: Pending / Rejected / Inactive</span>
          </span>
        </div>
      </section>

      {/* CATEGORY 1: ORIGINAL RULES */}
      {activeSubTab === 'original' && (
        <div className="space-y-4 cs-fade-up">
          {/* Search & Category Controls */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="Filter by category"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as ScamCategoryId | 'all')
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
                >
                  <option value="all">{t.allCategories}</option>
                  {originalCategoriesPresent.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)[language]}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(
                    [
                      { id: 'all', label: `All (${ORIGINAL_RULES.length})` },
                      {
                        id: 'officially_supported',
                        label: `Official (${originalOfficialCount})`,
                      },
                      {
                        id: 'prototype_heuristic',
                        label: `Prototype (${originalPrototypeCount})`,
                      },
                    ] as const
                  ).map((vf) => (
                    <button
                      key={vf.id}
                      type="button"
                      onClick={() => setVerificationFilter(vf.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                        verificationFilter === vf.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {vf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
              <span>
                Showing <strong className="text-slate-800">{filteredOriginalRules.length}</strong>{' '}
                of <strong className="text-slate-800">{ORIGINAL_RULES.length}</strong>{' '}
                {t.counts.original}
              </span>
              <span className="font-mono">
                Cross-Signal Pairs: {CROSS_SIGNALS.length} · Group-Capped Scoring
              </span>
            </div>
          </section>

          <div className="space-y-3">
            {filteredOriginalRules.map((rule) => {
              const isExpanded = !!expandedRuleIds[rule.id];
              const groupCap = GROUP_CAP_MAP[rule.group] ?? 25;
              const weightPct = Math.min(100, Math.round((rule.weight / 32) * 100));
              const source = sourceMap.get(rule.sourceId);
              const pairedCrossSignals = CROSS_SIGNALS.filter((cs) =>
                cs.requiredGroups.includes(rule.group)
              );
              const exclusionSummaries = summarizeRegexList(rule.exclusions);
              const reqContextSummaries = summarizeRegexList(rule.requiredContext);
              const triggerExample =
                RULE_TRIGGER_EXAMPLES[rule.id] ?? `Example matching ${rule.name.en} pattern.`;

              return (
                <article
                  key={rule.id}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-teal-300/80 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleRuleExpanded(rule.id)}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-800">{rule.id}</span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-medium text-teal-800">
                            {getCategoryLabel(rule.category)[language]}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              rule.sourceVerificationStatus === 'officially_supported'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {rule.sourceVerificationStatus === 'officially_supported' ? (
                              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                            ) : (
                              <Info className="w-3 h-3" aria-hidden="true" />
                            )}
                            <span>
                              {rule.sourceVerificationStatus === 'officially_supported'
                                ? analyzerStrings.officialBadge
                                : 'Prototype Heuristic'}
                            </span>
                          </span>
                        </div>

                        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                          {rule.name[language]}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                          {rule.explanation[language]}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono tabular-nums">
                          <div className="text-xs font-bold text-slate-900">
                            +{rule.weight} pts
                          </div>
                          <div className="text-[11px] text-slate-500">
                            cap {groupCap} · {rule.group}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold whitespace-nowrap">
                          {t.statusOriginal}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4 text-xs sm:text-sm cs-fade-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                          <div className="text-xs font-semibold text-slate-800">
                            {t.whatDetects}
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {rule.explanation[language]}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                          <div className="text-xs font-semibold text-slate-800">{t.whyMatters}</div>
                          <p className="text-slate-700 leading-relaxed">
                            {rule.recommendedAction[language]}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
                        <div className="text-xs font-semibold text-amber-900">
                          {t.triggerExample}
                        </div>
                        <p className="font-mono text-xs text-amber-950 break-words">
                          &ldquo;{triggerExample}&rdquo;
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                          <div className="text-xs font-semibold text-slate-800">
                            {t.strengthensContext}
                          </div>
                          {reqContextSummaries.length > 0 && (
                            <p className="text-xs text-slate-700">
                              Required context:{' '}
                              <code className="font-mono bg-slate-100 px-1 rounded">
                                {reqContextSummaries.join('; ')}
                              </code>
                            </p>
                          )}
                          {pairedCrossSignals.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-700">
                              {pairedCrossSignals.map((cs) => (
                                <li key={cs.id}>
                                  <span className="font-mono font-semibold text-teal-800">
                                    {cs.id}
                                  </span>{' '}
                                  (+{cs.bonusWeight}): {cs.name[language]}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-600">
                              Combined with suspicious URL signals, urgency cues, or independent
                              rule groups raises severity.
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                          <div className="text-xs font-semibold text-slate-800">
                            {t.suppressesContext}
                          </div>
                          <p className="text-xs text-slate-700">
                            Awareness / negation guard:{' '}
                            <strong>
                              {rule.suppressibleByAwarenessContext ? 'Enabled' : 'Disabled'}
                            </strong>
                            {rule.suppressibleByAwarenessContext
                              ? ' (suppressed inside warnings like "never share" or "official app only").'
                              : '.'}
                          </p>
                          {exclusionSummaries.length > 0 && (
                            <p className="text-xs text-slate-600 break-words">
                              Rule exclusions:{' '}
                              <code className="font-mono bg-slate-100 px-1 rounded">
                                {exclusionSummaries.join(' | ')}
                              </code>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex justify-between font-mono text-slate-600">
                              <span>{t.scoreWeight}</span>
                              <span className="font-bold text-slate-900">
                                {rule.weight} / max {rule.maxContribution}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${weightPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="font-mono text-slate-700">
                            {t.groupCap}: <strong>{groupCap}</strong> ({rule.group})
                          </div>

                          <div className="font-mono text-slate-700">
                            {t.languagesLabel}:{' '}
                            <strong>{rule.languages.join(' / ').toUpperCase()}</strong>
                          </div>
                        </div>

                        {source && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-teal-800 hover:underline"
                          >
                            <span>
                              {t.sourceAttribution}: {source.organization}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 2: NEWLY ADDED RULES (GENUINELY ACTIVE IN PRODUCTION) */}
      {activeSubTab === 'newly_added' && (
        <div className="space-y-5 cs-fade-up">
          <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 max-w-3xl">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h2 className="text-base font-display font-bold text-emerald-950">
                  {t.tabs.newlyAdded} ({NEWLY_ADDED_RULES.length})
                </h2>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  These rules were genuinely added to the production Analyzer rule engine during this
                  upgrade, verified against matching scam and genuine awareness test cases (TC-39,
                  TC-40, TC-41).
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.statusNewlyAdded}</span>
            </span>
          </section>

          <div className="grid grid-cols-1 gap-5">
            {NEWLY_ADDED_RULES.map((rule) => {
              const groupCap = GROUP_CAP_MAP[rule.group] ?? 25;
              const source = sourceMap.get(rule.sourceId);
              const exclusionSummaries = summarizeRegexList(rule.exclusions);
              const triggerExample =
                rule.exampleTrigger ??
                RULE_TRIGGER_EXAMPLES[rule.id] ??
                `Example matching ${rule.name.en} pattern.`;

              return (
                <article
                  key={rule.id}
                  className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
                >
                  {/* Header: Rule Name, ID, Green Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {rule.id}
                        </span>
                        <span className="font-semibold text-teal-800">
                          {t.scamTypeCovered}: {getCategoryLabel(rule.category)[language]}
                        </span>
                      </div>
                      <h3 className="text-lg font-display font-bold text-slate-900">
                        {rule.name[language]}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-200">
                        +{rule.weight} pts (max {rule.maxContribution} · cap {groupCap})
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.statusNewlyAdded}</span>
                      </span>
                    </div>
                  </div>

                  {/* Required Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
                      <div className="text-xs font-bold text-slate-800">{t.whatDetects}</div>
                      <p className="text-slate-700 leading-relaxed">{rule.explanation[language]}</p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
                      <div className="text-xs font-bold text-emerald-950">{t.whyAdded}</div>
                      <p className="text-emerald-900 leading-relaxed">
                        {rule.addedReason?.[language] ?? rule.recommendedAction[language]}
                      </p>
                    </div>
                  </div>

                  {/* Example Pattern */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                    <div className="text-xs font-bold text-amber-950">{t.triggerExample}</div>
                    <p className="font-mono text-xs text-amber-950 break-words">
                      &ldquo;{triggerExample}&rdquo;
                    </p>
                  </div>

                  {/* Context & False-Positive Safeguards + Score/Source */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                      <div className="font-bold text-slate-900">{t.suppressesContext}</div>
                      <p className="text-slate-700 leading-relaxed">
                        {rule.safeguardsSummary?.[language] ??
                          'Paired context required + suppressed inside protective awareness messages.'}
                      </p>
                      {exclusionSummaries.length > 0 && (
                        <p className="text-slate-600 break-words pt-1">
                          Exclusions:{' '}
                          <code className="font-mono bg-slate-100 px-1 rounded">
                            {exclusionSummaries.join(' | ')}
                          </code>
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-2">
                      <div className="space-y-1 text-slate-700 font-mono">
                        <div>
                          {t.scoreWeight}: <strong>+{rule.weight}</strong> (Group:{' '}
                          <strong>{rule.group}</strong>, cap {groupCap})
                        </div>
                        <div>
                          {t.languagesLabel}:{' '}
                          <strong>{rule.languages.join(' / ').toUpperCase()}</strong>
                        </div>
                      </div>

                      {source && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          <span>
                            {t.sourceAttribution}: {source.organization}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 3: CANDIDATE RULES (INACTIVE / SANDBOX VALIDATION) */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-5 cs-fade-up">
          <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-blue-50/60 p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 max-w-3xl">
                <Sparkles className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    {t.selectCandidatesLabel} ({allCandidates.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                    {t.candidateIntroNote}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSandbox}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-violet-600/20 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
                <span>{t.runSandboxBtn}</span>
              </button>
            </div>

            <div className="rounded-xl border border-violet-200/80 bg-white/90 px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-700">
              <ShieldAlert className="w-4 h-4 text-violet-700 shrink-0" aria-hidden="true" />
              <span>{t.noAutoPromoteNote}</span>
            </div>
          </section>

          {/* Candidate Rule Cards showing all 7 required fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allCandidates.map((cand) => {
              const checked = selectedCandidateIds[cand.id] ?? cand.isSessionUserDraft === true;
              const isValidated = !!validatedCandidateIds[cand.id];
              const fpRisk = cand.falsePositiveRisk ?? 'low';

              return (
                <article
                  key={cand.id}
                  className={`rounded-2xl border p-5 transition-all space-y-3.5 ${
                    checked
                      ? 'border-violet-400 bg-white shadow-sm ring-1 ring-violet-400/30'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCandidate(cand.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900">{cand.id}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {cand.version} · +{cand.weight} pts
                          </span>
                          {cand.isSessionUserDraft && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                              Session Draft
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-display font-bold text-slate-900 mt-1">
                          {cand.name[language]}
                        </h3>
                      </div>
                    </label>

                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                        isValidated
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-violet-100 text-violet-900 border-violet-300'
                      }`}
                    >
                      {isValidated ? 'Under validation' : 'Candidate'}
                    </span>
                  </div>

                  {/* Example Pattern */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 break-words">
                    <span className="font-sans font-semibold text-slate-600 block mb-1">
                      Example:
                    </span>
                    &ldquo;{cand.exampleTrigger}&rdquo;
                  </div>

                  {/* 5 Structured Explanation Fields */}
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>
                      <strong className="text-slate-900">Why proposed:</strong>{' '}
                      {cand.rationale[language]}
                    </p>
                    <p>
                      <strong className="text-slate-900">Gap addressed:</strong>{' '}
                      <span className="font-mono text-violet-800 font-semibold">
                        {cand.targetGapId}
                      </span>{' '}
                      —{' '}
                      {cand.targetGapDescription?.[language] ??
                        getCategoryLabel(cand.category)[language]}
                    </p>
                    <p>
                      <strong className="text-slate-900">Overlaps with existing rules:</strong>{' '}
                      <span className="font-mono text-slate-800">
                        {cand.overlapsWithRuleIds && cand.overlapsWithRuleIds.length > 0
                          ? cand.overlapsWithRuleIds.join(', ')
                          : 'None'}
                      </span>
                    </p>
                  </div>

                  {/* False-positive risk badge & notes */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">False-positive risk:</span>
                      <span
                        className={`px-2 py-0.5 rounded border font-mono text-[11px] font-semibold uppercase ${
                          fpRisk === 'high'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : fpRisk === 'medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {fpRisk}
                      </span>
                    </div>
                    {cand.falsePositiveNotes && (
                      <p className="text-slate-600 leading-relaxed">
                        {cand.falsePositiveNotes[language]}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sandbox Validation Output */}
          {sandboxSummary && (
            <section className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-6 shadow-sm space-y-5 cs-fade-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono tabular-nums">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">{t.beforeLabel}</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {sandboxSummary.beforeMetrics.passed} / {allSandboxTestCases.length} pass
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                    <span>TP: {sandboxSummary.beforeMetrics.tp}</span>
                    <span>TN: {sandboxSummary.beforeMetrics.tn}</span>
                    <span>FP: {sandboxSummary.beforeMetrics.fp}</span>
                    <span className="text-red-700 font-bold">
                      FN: {sandboxSummary.beforeMetrics.fn}
                    </span>
                    <span>Acc: {formatRate(sandboxSummary.beforeMetrics.accuracy)}</span>
                    <span>Rec: {formatRate(sandboxSummary.beforeMetrics.recall)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
                  <div className="text-xs font-semibold text-blue-900">{t.afterLabel}</div>
                  <div className="text-2xl font-bold text-blue-950">
                    {sandboxSummary.afterMetrics.passed} / {allSandboxTestCases.length} pass
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-blue-950">
                    <span>TP: {sandboxSummary.afterMetrics.tp}</span>
                    <span>TN: {sandboxSummary.afterMetrics.tn}</span>
                    <span>FP: {sandboxSummary.afterMetrics.fp}</span>
                    <span className="font-bold">FN: {sandboxSummary.afterMetrics.fn}</span>
                    <span>Acc: {formatRate(sandboxSummary.afterMetrics.accuracy)}</span>
                    <span>Rec: {formatRate(sandboxSummary.afterMetrics.recall)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">
                    Sandbox Validation Delta
                  </div>
                  <div className="flex items-baseline gap-4 mt-1">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">
                        +{sandboxSummary.improvedCount}
                      </div>
                      <div className="text-xs text-slate-600">{t.improvedLabel}</div>
                    </div>
                    <div>
                      <div
                        className={`text-2xl font-bold ${
                          sandboxSummary.regressedCount > 0 ? 'text-red-700' : 'text-slate-900'
                        }`}
                      >
                        {sandboxSummary.regressedCount}
                      </div>
                      <div className="text-xs text-slate-600">{t.regressedLabel}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 pt-1">
                    F1 Score: {formatRate(sandboxSummary.beforeMetrics.f1)} →{' '}
                    <strong>{formatRate(sandboxSummary.afterMetrics.f1)}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'improved', label: `Improved (+${sandboxSummary.improvedCount})` },
                      { id: 'regressed', label: `Regressed (${sandboxSummary.regressedCount})` },
                      { id: 'all', label: `All (${allSandboxTestCases.length})` },
                      { id: 'scam', label: 'Scam Cases' },
                      { id: 'genuine', label: 'Genuine Cases' },
                    ] as const
                  ).map((df) => (
                    <button
                      key={df.id}
                      type="button"
                      onClick={() => setDeltaFilter(df.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap transition-all ${
                        deltaFilter === df.id
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {df.label}
                    </button>
                  ))}
                </div>

                {filteredDeltas.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No cases in this filter category.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
                    {filteredDeltas.map((d) => (
                      <div
                        key={d.testCase.id}
                        className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {d.testCase.id}
                            </span>
                            <span className="font-medium text-slate-800 truncate">
                              {d.testCase.title}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            Before: {d.beforeVerdict} ({d.beforeScore}) → After: {d.afterVerdict} (
                            {d.afterScore})
                          </div>
                        </div>

                        {d.outcome === 'improved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold cs-pop-in">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Gap Closed</span>
                          </span>
                        )}
                        {d.outcome === 'regressed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 font-semibold cs-pop-in">
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Regression</span>
                          </span>
                        )}
                        {d.outcome === 'unchanged_pass' && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            Pass
                          </span>
                        )}
                        {d.outcome === 'unchanged_fail' && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                            Still Failing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* USER-CONTRIBUTED PATTERNS SUBSECTION (ALWAYS SESSION-ONLY & EXPLICIT CONSENT) */}
      <section
        aria-labelledby="user-contributed-patterns-heading"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <MessageSquarePlus
              className="w-5 h-5 text-violet-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2
                id="user-contributed-patterns-heading"
                className="text-base font-display font-bold text-slate-900"
              >
                {t.contributedTitle} ({contributedPatterns.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{t.contributedSubtitle}</p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">
            In-Memory Session Only · Unverified Input
          </span>
        </div>

        {contributedPatterns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-800">{t.contributedEmptyTitle}</h3>
            <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t.contributedEmptyBody}
            </p>
            <button
              type="button"
              onClick={onGoToAnalyzer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-semibold hover:from-teal-400 hover:to-cyan-400 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{t.contributedEmptyCta}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contributedPatterns.map((item) => {
              const fbBadge =
                item.feedbackType === 'scam'
                  ? 'bg-red-100 text-red-900 border-red-200'
                  : item.feedbackType === 'legit'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border-amber-200';

              const coverageLabel =
                item.coverageStatus === 'detection_gap'
                  ? 'Detection Gap (Missed Scam)'
                  : item.coverageStatus === 'false_positive_review'
                  ? 'False-Positive Review'
                  : item.coverageStatus === 'covered_by_existing'
                  ? 'Covered by Existing Rule'
                  : 'Needs Triage';

              const candValidated =
                item.candidateImprovementId && validatedCandidateIds[item.candidateImprovementId];

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 cs-fade-up"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900">{item.id}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">{item.contributedAtLabel}</span>
                      <span className={`px-2 py-0.5 rounded-md border font-semibold ${fbBadge}`}>
                        Feedback: {item.feedbackType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700 font-medium">
                        {coverageLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${
                          candValidated || item.currentStatus === 'under_validation'
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-violet-100 text-violet-900 border-violet-200'
                        }`}
                      >
                        {candValidated || item.currentStatus === 'under_validation'
                          ? 'Under validation'
                          : 'Candidate'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyContribution(item.id, item.sanitizedPattern)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        {copiedContribId === item.id ? (
                          <>
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" aria-hidden="true" />
                            <span>Copy Sanitized</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sanitized & Generalized Pattern */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-700">Sanitized pattern</div>
                    <p className="font-mono text-slate-900 break-words">{item.sanitizedPattern}</p>
                    <div className="text-[11px] font-mono text-violet-800 pt-1">
                      Generalized: {item.generalizedPattern}
                    </div>
                  </div>

                  {/* Detection Metadata & Gap Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                      <div>
                        <strong>What analyzer detected:</strong> {item.analyzerVerdict} (
                        {item.analyzerScore}/100 ·{' '}
                        {getCategoryLabel(item.analyzerCategory)[language]})
                      </div>
                      <div>
                        <strong>Related existing rules:</strong>{' '}
                        <span className="font-mono text-slate-900">
                          {item.relatedExistingRuleIds.length > 0
                            ? item.relatedExistingRuleIds.join(', ')
                            : 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                      <div>
                        <strong>Missed or misclassified check:</strong>
                      </div>
                      <p className="leading-relaxed">{item.missedOrMisclassifiedNote[language]}</p>
                    </div>
                  </div>

                  {/* Honest Actions: Draft Candidate or Add Session Test Case */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.coverageStatus === 'detection_gap' && !item.candidateImprovementId && (
                      <button
                        type="button"
                        onClick={() => onCreateCandidateFromContribution(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Create Draft Candidate Rule</span>
                      </button>
                    )}

                    {item.candidateImprovementId && (
                      <button
                        type="button"
                        onClick={() => onChangeSubTab('candidates')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-900 border border-violet-200 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Linked Candidate: {item.candidateImprovementId}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}

                    {!item.addedAsSessionTestCase ? (
                      <button
                        type="button"
                        onClick={() => onAddSessionTestCase(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add as Session Test Case</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Session Test Case: {item.sessionTestCaseId}</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Compact Official Advisory & Verification References */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-display font-bold text-slate-900">
            {t.officialResourcesTitle}
          </h2>
          <span className="text-xs font-semibold text-red-700">
            Emergency Fraud Helpline: 1930 · cybercrime.gov.in
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {SOURCES.map((src) => (
            <div
              key={src.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white transition-all p-3.5 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-slate-900">{src.organization}</div>
                <div className="font-medium text-teal-800 mt-0.5">{src.title}</div>
                <p className="text-slate-600 mt-1 leading-relaxed">{src.summary[language]}</p>
              </div>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 hover:underline w-fit"
              >
                <span>Open Official Source</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
