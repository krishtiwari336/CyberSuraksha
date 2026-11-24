import {
  AnalysisResult,
  CandidateRule,
  CandidateValidationCaseDelta,
  CandidateValidationSummary,
  TestCase,
} from '../types/analysis';
import { analyzeMessage, analyzeMessageWithSandbox } from './classifier';

export interface SuiteEvalStats {
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
}

export function doesResultPassCase(tc: TestCase, res: AnalysisResult): boolean {
  return (
    res.verdict === tc.expectedVerdict &&
    res.primaryCategory === tc.expectedCategory &&
    res.score >= tc.minExpectedScore &&
    res.score <= tc.maxExpectedScore
  );
}

function computeSuiteMetrics(
  cases: TestCase[],
  results: AnalysisResult[]
): SuiteEvalStats {
  let passed = 0;
  let failed = 0;
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const res = results[i];
    if (doesResultPassCase(tc, res)) passed++;
    else failed++;

    const actualSuspicious = res.verdict === 'suspicious';
    if (tc.expectedSuspicious && actualSuspicious) tp++;
    else if (!tc.expectedSuspicious && !actualSuspicious) tn++;
    else if (!tc.expectedSuspicious && actualSuspicious) fp++;
    else if (tc.expectedSuspicious && !actualSuspicious) fn++;
  }

  const total = cases.length;
  const accuracy = total > 0 ? ((tp + tn) / total) * 100 : null;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : null;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : null;
  const f1 =
    precision !== null && recall !== null && precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null;

  return { passed, failed, tp, tn, fp, fn, accuracy, precision, recall, f1 };
}

/**
 * Evaluates selected candidate rules in a strictly non-mutating sandbox against
 * both scam and genuine test cases, returning before/after deltas and regressions.
 */
export function evaluateCandidateSandbox(
  testCases: TestCase[],
  selectedCandidates: CandidateRule[]
): CandidateValidationSummary {
  const beforeResults = testCases.map((tc) => analyzeMessage(tc.input));
  const afterResults = testCases.map((tc) =>
    analyzeMessageWithSandbox(tc.input, selectedCandidates)
  );

  const beforeMetrics = computeSuiteMetrics(testCases, beforeResults);
  const afterMetrics = computeSuiteMetrics(testCases, afterResults);

  let improvedCount = 0;
  let regressedCount = 0;
  const caseDeltas: CandidateValidationCaseDelta[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const beforePassed = doesResultPassCase(tc, beforeResults[i]);
    const afterPassed = doesResultPassCase(tc, afterResults[i]);

    let outcome: CandidateValidationCaseDelta['outcome'];
    if (!beforePassed && afterPassed) {
      outcome = 'improved';
      improvedCount++;
    } else if (beforePassed && !afterPassed) {
      outcome = 'regressed';
      regressedCount++;
    } else if (afterPassed) {
      outcome = 'unchanged_pass';
    } else {
      outcome = 'unchanged_fail';
    }

    caseDeltas.push({
      testCase: tc,
      beforePassed,
      afterPassed,
      beforeScore: beforeResults[i].score,
      afterScore: afterResults[i].score,
      beforeVerdict: beforeResults[i].verdict,
      afterVerdict: afterResults[i].verdict,
      outcome,
    });
  }

  return {
    candidateIds: selectedCandidates.map((c) => c.id),
    beforeMetrics,
    afterMetrics,
    improvedCount,
    regressedCount,
    caseDeltas,
  };
}
