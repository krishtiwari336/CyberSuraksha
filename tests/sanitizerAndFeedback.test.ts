import { describe, expect, it } from 'vitest';
import candidateRulesData from '../src/data/candidateRules.json';
import { analyzeMessage } from '../src/engine/classifier';
import { getActiveRules } from '../src/engine/rulesEngine';
import {
  buildContributionRecord,
  buildDraftCandidateFromContribution,
  compareFeedbackWithAnalysis,
  sanitizeMessageLocally,
} from '../src/engine/sanitizer';
import { CandidateRule } from '../src/types/analysis';

const ACTIVE_RULES = getActiveRules();
const CANDIDATE_RULES = candidateRulesData as CandidateRule[];

describe('Rulebook Counts & Candidate Isolation', () => {
  it('accurately accounts for 32 original rules and 2 newly added production rules', () => {
    const original = ACTIVE_RULES.filter((r) => r.ruleOrigin !== 'newly_added');
    const newlyAdded = ACTIVE_RULES.filter((r) => r.ruleOrigin === 'newly_added');

    expect(original.length).toBe(32);
    expect(newlyAdded.length).toBe(2);
    expect(ACTIVE_RULES.length).toBe(34);
    expect(newlyAdded.map((r) => r.id)).toEqual([
      'RULE-WHATSAPP-CODE-33',
      'RULE-CARD-LIMIT-34',
    ]);
  });

  it('never allows inactive candidate rules to affect production analyzer scores', () => {
    expect(CANDIDATE_RULES.length).toBe(6);
    // Candidate CAND-REWARD-EXPIRE-01 pattern should NOT trigger production analyzer
    const res = analyzeMessage(
      '8,420 credit card reward points expire tonight. Redeem voucher worth ₹4,210 on our portal.'
    );
    expect(res.triggeredRules.some((r) => r.ruleId.startsWith('CAND-'))).toBe(false);
    expect(res.verdict).toBe('no_strong_indicators');
  });
});

describe('Local Sanitization & Feedback Comparison', () => {
  it('strips phone numbers, UPI IDs, emails, PAN, accounts, amounts, URLs, OTPs, and names locally', () => {
    const raw =
      'Dear Rajesh Sharma, your ₹15,000 refund is pending on ramesh@okaxis or +91 9876543210. Use OTP 482910 at https://fake-bank.example.com/verify?token=secret99 or upi://pay?pa=fraud@ybl. Email help@fake.in, PAN ABCDE1234F, A/C 1234567890. Regards, Amit Kumar';

    const sanitized = sanitizeMessageLocally(raw);

    expect(sanitized.sanitizedPattern).not.toContain('Rajesh Sharma');
    expect(sanitized.sanitizedPattern).not.toContain('Amit Kumar');
    expect(sanitized.sanitizedPattern).not.toContain('9876543210');
    expect(sanitized.sanitizedPattern).not.toContain('ramesh@okaxis');
    expect(sanitized.sanitizedPattern).not.toContain('help@fake.in');
    expect(sanitized.sanitizedPattern).not.toContain('482910');
    expect(sanitized.sanitizedPattern).not.toContain('token=secret99');
    expect(sanitized.sanitizedPattern).not.toContain('ABCDE1234F');
    expect(sanitized.sanitizedPattern).not.toContain('1234567890');
    expect(sanitized.sanitizedPattern).not.toContain('upi://pay');
    expect(sanitized.sanitizedPattern).toContain('[NAME]');
    expect(sanitized.sanitizedPattern).toContain('[PHONE]');
    expect(sanitized.sanitizedPattern).toContain('[UPI_ID]');
    expect(sanitized.sanitizedPattern).toContain('[EMAIL]');
    expect(sanitized.sanitizedPattern).toContain('[AMOUNT]');
    expect(sanitized.sanitizedPattern).toContain('[URL:fake-bank.example.com/...]');
    expect(sanitized.sanitizedPattern).toContain('[UPI_LINK]');
  });

  it('compares user feedback against analyzer verdict without treating feedback as verified truth', () => {
    const flagged = analyzeMessage(
      'Your bank account will be blocked today. Complete KYC and share OTP immediately.'
    );
    const unflagged = analyzeMessage(
      '8,420 credit card reward points expire tonight. Redeem voucher worth ₹4,210 on our portal.'
    );

    expect(compareFeedbackWithAnalysis('scam', flagged).outcome).toBe('confirmed_scam');
    expect(compareFeedbackWithAnalysis('legit', flagged).outcome).toBe(
      'potential_false_positive'
    );
    expect(compareFeedbackWithAnalysis('scam', unflagged).outcome).toBe(
      'potential_false_negative'
    );
    expect(compareFeedbackWithAnalysis('legit', unflagged).outcome).toBe('confirmed_legit');
    expect(compareFeedbackWithAnalysis('unsure', flagged).outcome).toBe('inconclusive');
  });

  it('never retains original message text in contribution records and only drafts inactive candidates', () => {
    const raw =
      'Hi Priya Verma, send ₹2,500 processing fee to scammer@ybl or call 9811122233 urgently.';
    const analysis = analyzeMessage(raw);
    const sanitized = sanitizeMessageLocally(raw);
    const record = buildContributionRecord(sanitized, 'scam', analysis, ACTIVE_RULES, 1);

    expect('originalText' in record).toBe(false);
    expect(JSON.stringify(record)).not.toContain('Priya Verma');
    expect(JSON.stringify(record)).not.toContain('9811122233');
    expect(JSON.stringify(record)).not.toContain('scammer@ybl');

    const draft = buildDraftCandidateFromContribution(record);
    expect(draft.id).toBe('CAND-USR-01');
    expect(draft.validationState).toBe('candidate');
    expect(draft.isSessionUserDraft).toBe(true);
  });
});
