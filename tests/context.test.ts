import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '../src/engine/classifier';

describe('Negative Context & False-Positive Protection', () => {
  it('suppresses credential rules in genuine bank OTP/PIN warnings', () => {
    const res = analyzeMessage(
      'Never share your OTP or UPI PIN with anyone. Your bank will never ask you to disclose it.'
    );
    expect(res.verdict).toBe('no_strong_indicators');
    expect(res.score).toBeLessThan(20);
    expect(res.contextAssessment.hasNegationWarning).toBe(true);
  });

  it('suppresses fake KYC / phishing rules in educational awareness advice', () => {
    const res = analyzeMessage(
      'Do not click unknown phishing links. Learn to recognize fake KYC messages.'
    );
    expect(res.verdict).toBe('no_strong_indicators');
    expect(res.score).toBeLessThan(20);
  });

  it('protects genuine interview messages explicitly stating no registration fee', () => {
    const res = analyzeMessage(
      'Your interview is scheduled for Monday. There is no registration fee.'
    );
    expect(res.verdict).toBe('no_strong_indicators');
    expect(res.score).toBe(0);
  });

  it('protects genuine bank statement and parcel delivery notifications', () => {
    const bank = analyzeMessage(
      'Your account statement is available in the official bank application.'
    );
    expect(bank.verdict).toBe('no_strong_indicators');
    expect(bank.score).toBe(0);

    const parcel = analyzeMessage(
      'Your parcel is scheduled for delivery tomorrow. Please check the official courier application for updates.'
    );
    expect(parcel.verdict).toBe('no_strong_indicators');
    expect(parcel.score).toBe(0);
  });

  it('protects natural Hindi awareness warnings', () => {
    const res = analyzeMessage(
      'अपना OTP किसी को मत बताना, चाहे वो बैंक से होने का दावा करे।'
    );
    expect(res.verdict).toBe('no_strong_indicators');
    expect(res.score).toBeLessThan(20);
  });

  it('still catches multi-clause scams that open with a fake awareness sentence', () => {
    const res = analyzeMessage(
      'Bank will never ask your password. However, your account will be blocked today, complete KYC immediately and share your OTP.'
    );
    expect(res.verdict).toBe('suspicious');
    expect(res.score).toBeGreaterThanOrEqual(45);
  });

  it('protects peer warnings, bank statement ready notices, and benign delivery updates', () => {
    const peerWarning = analyzeMessage(
      'I am warning my friend about a fake job scam asking for registration fee.'
    );
    expect(peerWarning.verdict).toBe('no_strong_indicators');
    expect(peerWarning.score).toBeLessThan(20);

    const stmt = analyzeMessage('Your bank statement is ready.');
    expect(stmt.verdict).toBe('no_strong_indicators');
    expect(stmt.score).toBe(0);

    const courier = analyzeMessage('The courier is arriving tomorrow.');
    expect(courier.verdict).toBe('no_strong_indicators');
    expect(courier.score).toBe(0);
  });
});
