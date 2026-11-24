import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Copy,
  FlaskConical,
  Play,
  Radar,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';
import candidateRulesData from '../data/candidateRules.json';
import emergingPatternsData from '../data/emergingPatterns.json';
import testCasesData from '../data/testCases.json';
import { analyzeMessage, getCategoryLabel } from '../engine/classifier';
import { getActiveRules } from '../engine/rulesEngine';
import { UI_STRINGS } from '../i18n/translations';
import {
  AnalysisResult,
  CandidateRule,
  EmergingPattern,
  Language,
  TestCase,
} from '../types/analysis';

const TEST_CASES: TestCase[] = testCasesData as TestCase[];
const EMERGING_PATTERNS: EmergingPattern[] = emergingPatternsData as EmergingPattern[];
const CANDIDATE_RULES: CandidateRule[] = candidateRulesData as CandidateRule[];
const ACTIVE_RULE_COUNT = getActiveRules().length;

type FilterKey =
  | 'all'
  | 'scam'
  | 'genuine'
  | 'passed'
  | 'failed'
  | 'emerging'
  | 'not_run'
  | 'kyc'
  | 'otp'
  | 'upi'
  | 'job'
  | 'lottery'
  | 'phishing'
  | 'digital_arrest'
  | 'courier'
  | 'remote_access'
  | 'utility'
  | 'awareness';

interface CaseEvaluation {
  testCase: TestCase;
  result: AnalysisResult;
  passed: boolean;
  failureReasons: string[];
}

interface RedTeamPageProps {
  language: Language;
  sessionTestCases?: TestCase[];
  onOpenCandidates?: () => void;
}

function evaluateCase(tc: TestCase): CaseEvaluation {
  const result = analyzeMessage(tc.input);
  const failureReasons: string[] = [];

  if (result.verdict !== tc.expectedVerdict) {
    failureReasons.push(
      `Expected verdict "${tc.expectedVerdict}", but engine returned "${result.verdict}".`
    );
  }
  if (result.primaryCategory !== tc.expectedCategory) {
    failureReasons.push(
      `Expected category "${tc.expectedCategory}", but engine detected "${result.primaryCategory}".`
    );
  }
  if (result.score < tc.minExpectedScore || result.score > tc.maxExpectedScore) {
    failureReasons.push(
      `Score ${result.score} fell outside expected range [${tc.minExpectedScore}, ${tc.maxExpectedScore}].`
    );
  }

  return {
    testCase: tc,
    result,
    passed: failureReasons.length === 0,
    failureReasons,
  };
}

const FILTER_OPTIONS: Array<{ id: FilterKey; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'scam', label: 'Scam' },
  { id: 'genuine', label: 'Genuine' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
  { id: 'emerging', label: 'Emerging Gaps' },
  { id: 'not_run', label: 'Not Run' },
  { id: 'kyc', label: 'Fake KYC' },
  { id: 'otp', label: 'OTP' },
  { id: 'upi', label: 'UPI' },
  { id: 'job', label: 'Job Scams' },
  { id: 'lottery', label: 'Lottery' },
  { id: 'phishing', label: 'Phishing' },
  { id: 'digital_arrest', label: 'Digital Arrest' },
  { id: 'courier', label: 'Courier' },
  { id: 'remote_access', label: 'Remote Access' },
  { id: 'utility', label: 'Utility Scams' },
  { id: 'awareness', label: 'Awareness Messages' },
];

function matchesFilter(
  tc: TestCase,
  ev: CaseEvaluation | undefined,
  filter: FilterKey
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'scam':
      return tc.expectedSuspicious;
    case 'genuine':
      return !tc.expectedSuspicious;
    case 'passed':
      return Boolean(ev && ev.passed);
    case 'failed':
      return Boolean(ev && !ev.passed);
    case 'emerging':
      return tc.isBaseline === false || tc.tags.includes('emerging');
    case 'not_run':
      return !ev;
    case 'kyc':
      return tc.tags.includes('kyc') || tc.expectedCategory === 'fake_kyc_bank';
    case 'otp':
      return tc.tags.includes('otp') || tc.tags.includes('dotted-otp');
    case 'upi':
      return tc.tags.includes('upi') || tc.expectedCategory === 'upi_pin_scam';
    case 'job':
      return tc.tags.includes('job') || tc.expectedCategory === 'fake_job_internship';
    case 'lottery':
      return tc.tags.includes('lottery') || tc.expectedCategory === 'lottery_reward';
    case 'phishing':
      return (
        tc.tags.includes('phishing') ||
        tc.tags.includes('url') ||
        tc.tags.includes('multiple-urls') ||
        tc.expectedCategory === 'phishing_link'
      );
    case 'digital_arrest':
      return (
        tc.tags.includes('digital-arrest') ||
        tc.expectedCategory === 'digital_arrest_police'
      );
    case 'courier':
      return tc.tags.includes('courier') || tc.expectedCategory === 'courier_parcel';
    case 'remote_access':
      return (
        tc.tags.includes('remote-access') ||
        tc.tags.includes('apk') ||
        tc.expectedCategory === 'remote_access_app'
      );
    case 'utility':
      return (
        tc.tags.includes('electricity') || tc.expectedCategory === 'electricity_utility'
      );
    case 'awareness':
      return tc.tags.includes('awareness') || tc.tags.includes('negation');
    default:
      return true;
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
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

export function RedTeamPage({
  language,
  sessionTestCases = [],
  onOpenCandidates,
}: RedTeamPageProps) {
  const t = UI_STRINGS[language].redTeam;
  const [evaluations, setEvaluations] = useState<Record<string, CaseEvaluation>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [rawJsonIds, setRawJsonIds] = useState<Record<string, boolean>>({});
  const [copiedJsonId, setCopiedJsonId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const scanTimerRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);

  const allTestCases = useMemo(
    () => [...TEST_CASES, ...sessionTestCases],
    [sessionTestCases]
  );

  useEffect(() => {
    return () => {
      if (scanTimerRef.current !== null) {
        window.clearTimeout(scanTimerRef.current);
      }
      runTokenRef.current += 1;
    };
  }, []);

  const patternByTestId = useMemo(() => {
    const map = new Map<string, EmergingPattern>();
    for (const p of EMERGING_PATTERNS) {
      if (p.linkedTestCaseId) map.set(p.linkedTestCaseId, p);
    }
    return map;
  }, []);

  const candidateById = useMemo(() => {
    const map = new Map<string, CandidateRule>();
    for (const c of CANDIDATE_RULES) map.set(c.id, c);
    return map;
  }, []);

  const cancelPendingScan = () => {
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    runTokenRef.current += 1;
    setIsScanning(false);
    setActiveCaseId(null);
  };

  const runBatchAnimated = (casesToRun: TestCase[], resetFirst: boolean) => {
    cancelPendingScan();
    const currentToken = runTokenRef.current;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (resetFirst) {
      setEvaluations({});
    }

    if (prefersReducedMotion || casesToRun.length <= 1) {
      const next: Record<string, CaseEvaluation> = resetFirst ? {} : { ...evaluations };
      for (const tc of casesToRun) {
        next[tc.id] = evaluateCase(tc);
      }
      setEvaluations(next);
      return;
    }

    setIsScanning(true);
    let idx = 0;

    const step = () => {
      if (runTokenRef.current !== currentToken) return;
      const tc = casesToRun[idx];
      setActiveCaseId(tc.id);
      const ev = evaluateCase(tc);
      setEvaluations((prev) => ({ ...prev, [tc.id]: ev }));
      idx += 1;

      if (idx < casesToRun.length) {
        scanTimerRef.current = window.setTimeout(step, 20);
      } else {
        scanTimerRef.current = null;
        setIsScanning(false);
        setActiveCaseId(null);
      }
    };

    step();
  };

  const runAll = () => runBatchAnimated(allTestCases, true);
  const runScamOnly = () =>
    runBatchAnimated(
      allTestCases.filter((c) => c.expectedSuspicious),
      false
    );
  const runGenuineOnly = () =>
    runBatchAnimated(
      allTestCases.filter((c) => !c.expectedSuspicious),
      false
    );

  const runSingle = (tc: TestCase) => {
    cancelPendingScan();
    setEvaluations((prev) => ({
      ...prev,
      [tc.id]: evaluateCase(tc),
    }));
  };

  const resetAll = () => {
    cancelPendingScan();
    setEvaluations({});
    setExpandedIds({});
    setRawJsonIds({});
    setCopiedJsonId(null);
  };

  const toggleTrace = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRawJson = (id: string) => {
    setRawJsonIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyJson = async (id: string, ev: CaseEvaluation) => {
    const payload = JSON.stringify(
      {
        testCaseId: id,
        score: ev.result.score,
        verdict: ev.result.verdict,
        category: ev.result.primaryCategory,
        breakdown: ev.result.scoreBreakdown,
        urls: ev.result.urlAnalyses.map((u) => ({
          hostname: u.hostname,
          registrableDomain: u.registrableDomain,
          subdomain: u.subdomain,
          weight: u.totalUrlWeight,
        })),
      },
      null,
      2
    );
    const ok = await copyTextToClipboard(payload);
    if (ok) {
      setCopiedJsonId(id);
      window.setTimeout(() => {
        setCopiedJsonId((cur) => (cur === id ? null : cur));
      }, 2200);
    }
  };

  const stats = useMemo(() => {
    const totalCases = allTestCases.length;
    const scamCases = allTestCases.filter((c) => c.expectedSuspicious).length;
    const genuineCases = totalCases - scamCases;

    const executed = Object.values(evaluations);
    let passedCount = 0;
    let failedCount = 0;
    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;

    for (const ev of executed) {
      if (ev.passed) passedCount++;
      else failedCount++;

      const actualSuspicious = ev.result.verdict === 'suspicious';
      const expectedSuspicious = ev.testCase.expectedSuspicious;

      if (expectedSuspicious && actualSuspicious) tp++;
      else if (!expectedSuspicious && !actualSuspicious) tn++;
      else if (!expectedSuspicious && actualSuspicious) fp++;
      else if (expectedSuspicious && !actualSuspicious) fn++;
    }

    const totalRun = executed.length;
    const notRunCount = totalCases - totalRun;
    const passRate = totalRun > 0 ? (passedCount / totalRun) * 100 : 0;
    const accuracy = totalRun > 0 ? ((tp + tn) / totalRun) * 100 : null;
    const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : null;
    const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : null;
    const f1 =
      precision !== null && recall !== null && precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : null;

    return {
      totalCases,
      scamCases,
      genuineCases,
      totalRun,
      notRunCount,
      passedCount,
      failedCount,
      passRate,
      tp,
      tn,
      fp,
      fn,
      accuracy,
      precision,
      recall,
      f1,
    };
  }, [allTestCases, evaluations]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTestCases.filter((tc) => {
      if (!matchesFilter(tc, evaluations[tc.id], activeFilter)) return false;
      if (!q) return true;
      return (
        tc.id.toLowerCase().includes(q) ||
        tc.title.toLowerCase().includes(q) ||
        tc.input.toLowerCase().includes(q) ||
        tc.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [allTestCases, activeFilter, searchQuery, evaluations]);

  const ringR = 26;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc * (1 - stats.passRate / 100);

  return (
    <div className="space-y-6">
      {/* Lab Header + Animated Radar Scanner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-950/15">
        {isScanning && (
          <div
            className="absolute inset-x-0 top-0 h-1 bg-slate-800 overflow-hidden"
            aria-hidden="true"
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 cs-beam-x" />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-300">
              <Target className="w-4 h-4" aria-hidden="true" />
              <span>
                Engine Verification Laboratory · {ACTIVE_RULE_COUNT} Active Production Rules
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-violet-400 shrink-0" aria-hidden="true" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{t.title}</h1>
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{t.subtitle}</p>
          </div>

          {/* Live Scanner Status + Progress Ring */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 shadow-inner">
            <svg viewBox="0 0 64 64" className="w-16 h-16 shrink-0" aria-hidden="true">
              <defs>
                <linearGradient id="redteamRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#2DD4BF" />
                </linearGradient>
              </defs>
              <circle
                cx="32"
                cy="32"
                r={ringR}
                fill="none"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r={ringR}
                fill="none"
                stroke="url(#redteamRingGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={stats.totalRun > 0 ? ringOffset : ringCirc}
                transform="rotate(-90 32 32)"
                className="transition-[stroke-dashoffset] duration-150"
              />
              <text
                x="32"
                y="36"
                textAnchor="middle"
                className="fill-white text-[12px] font-mono font-bold"
              >
                {stats.totalRun > 0 ? `${Math.round(stats.passRate)}%` : '—'}
              </text>
            </svg>
            <div className="text-xs font-mono tabular-nums">
              <div className="flex items-center gap-1.5 text-violet-300">
                <Radar
                  className={`w-3.5 h-3.5 ${isScanning ? 'cs-radar-sweep text-cyan-300' : ''}`}
                  aria-hidden="true"
                />
                <span>
                  {isScanning && activeCaseId
                    ? `${t.running} ${activeCaseId}`
                    : `${stats.totalRun} / ${stats.totalCases} Executed`}
                </span>
              </div>
              <div className="text-slate-400 mt-1">
                {isScanning ? t.scannerRunning : t.scannerStandby}
              </div>
            </div>
          </div>
        </div>

        {/* Test Execution Controls: Violet/Blue Run buttons + Neutral Reset */}
        <div className="mt-5 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={runAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-violet-600/25 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>{t.runAllBtn}</span>
          </button>

          <button
            type="button"
            onClick={runScamOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-400/50 bg-violet-600/20 text-violet-100 text-xs sm:text-sm font-medium hover:bg-violet-600/35 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ShieldAlert className="w-4 h-4 text-violet-300" aria-hidden="true" />
            <span>{t.runScamBtn}</span>
          </button>

          <button
            type="button"
            onClick={runGenuineOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-400/50 bg-blue-600/20 text-blue-100 text-xs sm:text-sm font-medium hover:bg-blue-600/35 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ShieldCheck className="w-4 h-4 text-blue-300" aria-hidden="true" />
            <span>{t.runGenuineBtn}</span>
          </button>

          <button
            type="button"
            onClick={resetAll}
            disabled={stats.totalRun === 0 && !isScanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800/80 text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.resetBtn}</span>
          </button>
        </div>
      </section>

      {/* Lab Overview Dashboard + Confusion Matrix Metrics */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-display font-bold text-slate-900">
            {t.metricsHeading}
          </h2>
          <span className="text-xs font-medium text-amber-800">{t.disclaimer}</span>
        </div>

        {/* 7 Suite Overview Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono tabular-nums">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Total Cases</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalCases}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Executed</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalRun}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="text-[11px] text-emerald-800">Passed</div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{stats.passedCount}</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/70 p-3">
            <div className="text-[11px] text-red-800">Failed</div>
            <div className="text-xl font-bold text-red-900 mt-0.5">{stats.failedCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Not Run</div>
            <div className="text-xl font-bold text-slate-700 mt-0.5">{stats.notRunCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Scam Cases</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.scamCases}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Genuine Cases</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.genuineCases}</div>
          </div>
        </div>

        {/* Real Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 transition-[width] duration-150"
            style={{ width: `${(stats.totalRun / stats.totalCases) * 100}%` }}
          />
        </div>

        {/* Confusion Matrix & Derived Scores */}
        {stats.totalRun === 0 ? (
          <p className="text-sm text-slate-600">{t.notRunYet}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono tabular-nums cs-fade-up">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">TP</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.tp}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">TN</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.tn}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">FP</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.fp}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">FN</div>
              <div className="text-lg font-bold text-red-700 mt-0.5">{stats.fn}</div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
              <div className="text-xs text-violet-800">Accuracy</div>
              <div className="text-lg font-bold text-violet-950 mt-0.5">
                {stats.accuracy !== null ? `${stats.accuracy.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div className="text-xs text-blue-800">Precision</div>
              <div className="text-lg font-bold text-blue-950 mt-0.5">
                {stats.precision !== null ? `${stats.precision.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <div className="text-xs text-teal-800">Recall</div>
              <div className="text-lg font-bold text-teal-950 mt-0.5">
                {stats.recall !== null ? `${stats.recall.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <div className="text-xs text-teal-800">F1 Score</div>
              <div className="text-lg font-bold text-teal-950 mt-0.5">
                {stats.f1 !== null ? `${stats.f1.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Category Filters & Search */}
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
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            />
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Showing {filteredCases.length} / {allTestCases.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Test case filters">
          {FILTER_OPTIONS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Individual Test Case Cards */}
      {filteredCases.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          {t.emptyFilter}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.map((tc) => {
            const ev = evaluations[tc.id];
            const expanded = !!expandedIds[tc.id];
            const showRaw = !!rawJsonIds[tc.id];
            const isActiveScan = activeCaseId === tc.id;
            const linkedPattern = patternByTestId.get(tc.id);
            const linkedCandidate = linkedPattern?.linkedCandidateRuleId
              ? candidateById.get(linkedPattern.linkedCandidateRuleId)
              : undefined;

            const statusBadge = isActiveScan ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-violet-50 text-violet-800 border border-violet-300">
                <Radar className="w-3.5 h-3.5 cs-radar-sweep" aria-hidden="true" />
                <span>{t.running}</span>
              </span>
            ) : !ev ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <CircleDashed className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.notRun}</span>
              </span>
            ) : ev.passed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 cs-pop-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>
                  {t.pass} · {ev.result.score}/100
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-100 text-red-900 border border-red-300 cs-pop-in">
                <XCircle className="w-3.5 h-3.5 text-red-700" aria-hidden="true" />
                <span>
                  {t.fail} · {ev.result.score}/100
                </span>
              </span>
            );

            const cardStateClass = isActiveScan
              ? 'border-violet-500 ring-2 ring-violet-500/25 bg-violet-50/20 shadow-md'
              : ev
              ? ev.passed
                ? 'border-emerald-200/90 hover:border-emerald-300'
                : 'border-red-200/90 hover:border-red-300'
              : 'border-slate-200/90 hover:border-violet-200';

            return (
              <article
                key={tc.id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all ${cardStateClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800">{tc.id}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          tc.expectedSuspicious ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                      >
                        {tc.expectedSuspicious ? 'Scam Test' : 'Genuine Test'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{getCategoryLabel(tc.expectedCategory)[language]}</span>
                      {tc.isBaseline === false && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-violet-800 font-semibold">
                            Emerging Pattern
                          </span>
                        </>
                      )}
                      {tc.tags.includes('session-contributed') && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-blue-700 font-semibold">
                            Session Test Case
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
                      {tc.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">{tc.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {statusBadge}

                    <button
                      type="button"
                      onClick={() => runSingle(tc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold shadow-xs hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Play className="w-3 h-3" aria-hidden="true" />
                      <span>{t.runSingleBtn}</span>
                    </button>

                    {ev && (
                      <button
                        type="button"
                        onClick={() => toggleTrace(tc.id)}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-violet-800 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {expanded ? (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{t.traceToggle}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Test Message Payload */}
                <p className="mt-3 text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-200 px-3.5 py-2.5 break-words">
                  {tc.input}
                </p>

                {/* Expected vs Actual comparison */}
                {ev && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                    <span>
                      <strong>{t.expectedCol}:</strong> {tc.expectedVerdict} (
                      {getCategoryLabel(tc.expectedCategory)[language]}, {tc.minExpectedScore}–
                      {tc.maxExpectedScore})
                    </span>
                    <span>
                      <strong>{t.actualCol}:</strong> {ev.result.verdict} (
                      {getCategoryLabel(ev.result.primaryCategory)[language]}, {ev.result.score})
                    </span>
                  </div>
                )}

                {/* Failed Test Diagnostic Panel */}
                {ev && !ev.passed && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-2.5 text-xs text-red-950 cs-fade-up">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
                      <span>{t.failedDiagTitle}</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {ev.failureReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>

                    {linkedPattern && (
                      <div className="pt-2 border-t border-red-200/80 space-y-1.5 text-red-950">
                        <p>
                          <strong>Gap analysis:</strong> {linkedPattern.whyEngineMayMiss[language]}
                        </p>
                        <p>
                          <strong>{t.impactLabel}:</strong>{' '}
                          {linkedPattern.scammerGoal[language]}
                        </p>
                        {linkedCandidate && (
                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              <strong>{t.candidateSuggestionLabel}:</strong>{' '}
                              <code className="font-mono font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-red-200">
                                {linkedCandidate.id}
                              </code>{' '}
                              ({linkedCandidate.version})
                            </span>
                            {onOpenCandidates && (
                              <button
                                type="button"
                                onClick={onOpenCandidates}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <span>{t.openCandidatesBtn}</span>
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Rule Trace */}
                {ev && expanded && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-3 cs-fade-up">
                    <div>
                      <div className="font-semibold text-slate-800 mb-1.5">
                        {t.triggeredRules} ({ev.result.triggeredRules.length})
                      </div>
                      {ev.result.triggeredRules.length === 0 ? (
                        <div className="text-slate-500">None</div>
                      ) : (
                        <div className="space-y-2">
                          {ev.result.triggeredRules.map((r) => (
                            <div
                              key={r.ruleId}
                              className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                                <span className="font-semibold text-slate-900">
                                  {r.ruleId} · {r.name[language]}
                                </span>
                                <span className="font-bold text-amber-800">
                                  +{r.appliedWeight}
                                </span>
                              </div>
                              <div className="text-slate-600">
                                Phrase:{' '}
                                <code className="font-mono bg-slate-100 px-1 rounded">
                                  {r.matchedText}
                                </code>{' '}
                                · Source: {r.sourceId} ({r.sourceVerificationStatus})
                              </div>
                              <div className="text-slate-700">{r.explanation[language]}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {ev.result.crossSignals.length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-800 mb-1.5">
                          Cross-Signals ({ev.result.crossSignals.length})
                        </div>
                        <div className="space-y-1.5">
                          {ev.result.crossSignals.map((cs) => (
                            <div
                              key={cs.id}
                              className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-amber-950"
                            >
                              <span className="font-mono font-semibold">
                                {cs.id} (+{cs.bonusWeight})
                              </span>{' '}
                              — {cs.name[language]}: {cs.whyItMatters[language]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="font-semibold text-slate-800 mb-1.5">
                        {t.suppressedRules} ({ev.result.suppressedRules.length})
                      </div>
                      {ev.result.suppressedRules.length === 0 ? (
                        <div className="text-slate-500">None</div>
                      ) : (
                        <ul className="space-y-1 text-emerald-900">
                          {ev.result.suppressedRules.map((s) => (
                            <li key={s.ruleId}>
                              <span className="font-mono font-semibold">{s.ruleId}</span> (
                              {s.matchedText}): {s.suppressionReason[language]}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRawJson(tc.id)}
                          className="text-xs font-mono text-violet-700 hover:underline cursor-pointer"
                        >
                          {t.rawJsonToggle}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyJson(tc.id, ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                        >
                          {copiedJsonId === tc.id ? (
                            <>
                              <Check className="w-3 h-3" aria-hidden="true" />
                              <span>{t.copiedJson}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" aria-hidden="true" />
                              <span>{t.copyJsonBtn}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {showRaw && (
                        <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-[11px] font-mono">
                          {JSON.stringify(
                            {
                              score: ev.result.score,
                              verdict: ev.result.verdict,
                              category: ev.result.primaryCategory,
                              breakdown: ev.result.scoreBreakdown,
                              urls: ev.result.urlAnalyses.map((u) => ({
                                hostname: u.hostname,
                                registrableDomain: u.registrableDomain,
                                subdomain: u.subdomain,
                                weight: u.totalUrlWeight,
                              })),
                            },
                            null,
                            2
                          )}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
