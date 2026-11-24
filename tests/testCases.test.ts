import { describe, expect, it } from 'vitest';
import candidateRulesData from '../src/data/candidateRules.json';
import testCasesData from '../src/data/testCases.json';
import { evaluateCandidateSandbox } from '../src/engine/candidateEvaluator';
import { analyzeMessage } from '../src/engine/classifier';
import { CandidateRule, TestCase } from '../src/types/analysis';

const TEST_CASES: TestCase[] = testCasesData as TestCase[];
const CANDIDATE_RULES: CandidateRule[] = candidateRulesData as CandidateRule[];

describe('Red-Team Validation Lab Bundled Test Suite', () => {
  it('passes all 35 baseline regression test cases (including newly added production rules)', () => {
    const baselineCases = TEST_CASES.filter((tc) => tc.isBaseline !== false);
    expect(baselineCases.length).toBe(35);

    for (const tc of baselineCases) {
      const res = analyzeMessage(tc.input);
      expect(res.verdict, `${tc.id} (${tc.title}) verdict`).toBe(tc.expectedVerdict);
      expect(res.primaryCategory, `${tc.id} (${tc.title}) category`).toBe(tc.expectedCategory);
      expect(res.score, `${tc.id} (${tc.title}) min score`).toBeGreaterThanOrEqual(
        tc.minExpectedScore
      );
      expect(res.score, `${tc.id} (${tc.title}) max score`).toBeLessThanOrEqual(
        tc.maxExpectedScore
      );
    }
  });

  it('honestly exposes real detection gaps on emerging indirect test cases without hiding failures', () => {
    const emergingGapCases = TEST_CASES.filter((tc) => tc.isBaseline === false);
    expect(emergingGapCases.length).toBe(6);

    const summary = evaluateCandidateSandbox(TEST_CASES, []);
    // Production engine without candidates genuinely fails the 6 indirect emerging patterns
    expect(summary.beforeMetrics.failed).toBe(6);
    expect(summary.beforeMetrics.fp).toBe(0);
    expect(summary.beforeMetrics.fn).toBe(6);
  });

  it('validates candidate rules in sandbox mode: closes emerging gaps with zero false-positive regressions', () => {
    const summary = evaluateCandidateSandbox(TEST_CASES, CANDIDATE_RULES);
    expect(summary.improvedCount).toBe(6);
    expect(summary.regressedCount).toBe(0);
    expect(summary.afterMetrics.fp).toBe(0);
    expect(summary.afterMetrics.fn).toBe(0);
    expect(summary.afterMetrics.passed).toBe(TEST_CASES.length);
  });
});
