import rulesData from '../data/rules.json';
import {
  RuleDefinition,
  SuppressedRule,
  TriggeredRule,
} from '../types/analysis';
import { TextClause } from './contextAnalyzer';
import { mapSpanToOriginal, NormalizedTextResult } from './normalizer';

const RULES: RuleDefinition[] = rulesData as RuleDefinition[];

function compileRegex(pattern: string, flags?: string): RegExp {
  const safeFlags = flags ? (flags.includes('g') ? flags : `${flags}g`) : 'gi';
  return new RegExp(pattern, safeFlags);
}

function findClauseAtOrigOffset(clauses: TextClause[], origStart: number): TextClause | undefined {
  return clauses.find((c) => origStart >= c.start && origStart < c.end);
}

export function getActiveRules(): RuleDefinition[] {
  return RULES;
}

/**
 * Evaluates contextual rules against normalized/canonical text while enforcing
 * clause-level negation & awareness protection and deduplicating repeated hits.
 */
export function evaluateRules(
  normResult: NormalizedTextResult,
  clauses: TextClause[],
  extraSandboxRules: RuleDefinition[] = []
): { triggeredRules: TriggeredRule[]; suppressedRules: SuppressedRule[] } {
  const triggeredRules: TriggeredRule[] = [];
  const suppressedRules: SuppressedRule[] = [];

  if (!normResult.canonical.trim()) {
    return { triggeredRules, suppressedRules };
  }

  const ruleList = extraSandboxRules.length > 0 ? [...RULES, ...extraSandboxRules] : RULES;

  for (const rule of ruleList) {
    const matchedSpans: Array<{ start: number; end: number; text: string }> = [];
    const seenSpanKeys = new Set<string>();

    for (const pat of rule.patterns) {
      const re = compileRegex(pat.regex, pat.flags);
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(normResult.canonical)) !== null && guard < 30) {
        guard++;
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        const origSpan = mapSpanToOriginal(
          m.index,
          m.index + m[0].length,
          normResult.canonicalMap,
          normResult.original.length
        );
        const spanText = normResult.original.slice(origSpan.start, origSpan.end);
        const key = `${origSpan.start}:${origSpan.end}`;
        if (!seenSpanKeys.has(key) && spanText.trim().length > 0) {
          seenSpanKeys.add(key);
          matchedSpans.push({
            start: origSpan.start,
            end: origSpan.end,
            text: spanText,
          });
        }
      }
    }

    if (matchedSpans.length === 0) continue;

    // Check requiredContext if defined
    if (rule.requiredContext && rule.requiredContext.length > 0) {
      const hasReq = rule.requiredContext.some((rc) =>
        new RegExp(rc.regex, rc.flags ?? 'i').test(normResult.canonical)
      );
      if (!hasReq) continue;
    }

    // Filter spans against clause-level protective context & rule exclusions
    const activeSpans: Array<{ start: number; end: number; text: string }> = [];
    let lastSuppressionReason: { en: string; hi: string; hinglish: string } | null = null;
    let suppressedSampleText = matchedSpans[0].text;

    for (const span of matchedSpans) {
      const clause = findClauseAtOrigOffset(clauses, span.start);
      const clauseText = clause ? clause.text : normResult.original;

      // 1. Check rule-specific exclusions within the local clause
      const excludedByRule =
        rule.exclusions?.some((ex) =>
          new RegExp(ex.regex, ex.flags ?? 'i').test(clauseText)
        ) ?? false;

      if (excludedByRule) {
        suppressedSampleText = span.text;
        lastSuppressionReason = {
          en: 'Suppressed by negation or protective exclusion phrase in the same sentence.',
          hi: 'उसी वाक्य में नकारात्मक या सुरक्षा सलाह वाले शब्दों के कारण इसे रोका गया।',
          hinglish: 'Usi sentence mein negation ya protective context hone ki wajah se rule suppress hua.',
        };
        continue;
      }

      // 2. Check awareness/official-channel/benign clause suppression
      if (
        rule.suppressibleByAwarenessContext &&
        clause &&
        (clause.isAwarenessOrNegation ||
          clause.isNoFeeGuarantee ||
          (clause.isOfficialChannelAdvice && !clauseText.includes('http')) ||
          clause.isBenignNotification)
      ) {
        suppressedSampleText = span.text;
        lastSuppressionReason = {
          en: 'Matched inside a protective awareness warning, official-app reference, or no-fee notice.',
          hi: 'यह सुरक्षा चेतावनी, आधिकारिक ऐप निर्देश या बिना फीस की सूचना के संदर्भ में मिला है।',
          hinglish: 'Yeh protective safety warning, official app reference ya no-fee notice ke context mein mila hai.',
        };
        continue;
      }

      activeSpans.push(span);
    }

    if (activeSpans.length === 0 && lastSuppressionReason) {
      suppressedRules.push({
        ruleId: rule.id,
        name: rule.name,
        matchedText: suppressedSampleText,
        suppressionReason: lastSuppressionReason,
      });
      continue;
    }

    if (activeSpans.length > 0) {
      triggeredRules.push({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        group: rule.group,
        baseWeight: rule.weight,
        appliedWeight: Math.min(rule.weight, rule.maxContribution),
        matchedText: activeSpans[0].text,
        spans: activeSpans,
        explanation: rule.explanation,
        recommendedAction: rule.recommendedAction,
        sourceId: rule.sourceId,
        sourceVerificationStatus: rule.sourceVerificationStatus,
      });
    }
  }

  return { triggeredRules, suppressedRules };
}
