import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '../src/engine/classifier';

describe('Risk Scoring & Boundaries', () => {
  it('caps score at 100 even with extreme combined scam phrases', () => {
    const extreme =
      'Dear customer, your bank account will be blocked today! Complete KYC immediately, share your OTP, ATM PIN, CVV, password, pay ₹5000 registration fee, install AnyDesk, avoid digital arrest warrant at https://paypal.com.security-check.example/login';
    const res = analyzeMessage(extreme);
    expect(res.score).toBeLessThanOrEqual(100);
    expect(res.severity).toBe('critical');
    expect(res.verdict).toBe('suspicious');
  });

  it('does not inflate score when the same suspicious phrase is repeated', () => {
    const single = analyzeMessage('Share your OTP now.');
    const repeated = analyzeMessage(
      'Share your OTP now. Share your OTP now. Share your OTP now. Share your OTP now.'
    );
    expect(repeated.score).toBe(single.score);
  });

  it('never produces critical or suspicious verdict from urgency alone', () => {
    const res = analyzeMessage('Please respond immediately, this is urgent today only!');
    expect(res.score).toBeLessThanOrEqual(10);
    expect(res.verdict).not.toBe('suspicious');
  });

  it('never scores phone numbers, UPI IDs, currency amounts, or Gmail addresses alone', () => {
    const res = analyzeMessage(
      'Contact Ravi at +91 9876543210, ravi@okicici, ravi@gmail.com for ₹1,250 dinner split.'
    );
    expect(res.score).toBe(0);
    expect(res.verdict).toBe('no_strong_indicators');
    expect(res.entities.phoneNumbers.length).toBeGreaterThan(0);
    expect(res.entities.upiIds).toContain('ravi@okicici');
    expect(res.entities.emailAddresses).toContain('ravi@gmail.com');
    expect(res.entities.currencyAmounts.length).toBeGreaterThan(0);
  });

  it('returns insufficient_evidence for very short ambiguous inputs', () => {
    const res = analyzeMessage('Hello there');
    expect(res.score).toBe(0);
    expect(res.verdict).toBe('insufficient_evidence');
  });

  it('handles empty and very long inputs without crashing or hanging', () => {
    const empty = analyzeMessage('');
    expect(empty.score).toBe(0);
    expect(empty.verdict).toBe('insufficient_evidence');

    const longText = 'Normal update message for order tracking. '.repeat(600);
    const start = performance.now();
    const longRes = analyzeMessage(longText);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(longRes.verdict).toBe('no_strong_indicators');
  });
});
