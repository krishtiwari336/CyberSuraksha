import { describe, expect, it } from 'vitest';
import { mapSpanToOriginal, normalizeMessage } from '../src/engine/normalizer';

describe('Message Normalizer', () => {
  it('handles empty and whitespace-only input safely', () => {
    expect(normalizeMessage('').canonical).toBe('');
    expect(normalizeMessage('   \n\t  ').canonical).toBe('');
  });

  it('collapses dotted OTP and KYC obfuscation while mapping original span', () => {
    const input = 'Share your O.T.P. to finish K.Y.C. immediately';
    const res = normalizeMessage(input);
    expect(res.canonical).toContain('otp');
    expect(res.canonical).toContain('kyc');

    const idx = res.canonical.indexOf('otp');
    const orig = mapSpanToOriginal(idx, idx + 3, res.canonicalMap, input.length);
    expect(input.slice(orig.start, orig.end)).toBe('O.T.P.');
  });

  it('collapses spaced letters such as F R E E and O T P', () => {
    const input = 'Claim F R E E prize by sending O T P';
    const res = normalizeMessage(input);
    expect(res.canonical).toContain('free');
    expect(res.canonical).toContain('otp');
  });

  it('applies token-scoped leetspeak without corrupting amounts, URLs, or emails', () => {
    const input = 'Send 0tp for ₹30,000 refund to user01@gmail.com via https://example.com/p1';
    const res = normalizeMessage(input);
    expect(res.canonical).toContain('otp');
    expect(res.canonical).toContain('₹30,000');
    expect(res.canonical).toContain('user01@gmail.com');
    expect(res.canonical).toContain('https://example.com/p1');
  });

  it('preserves Devanagari Hindi Unicode characters and strips zero-width chars', () => {
    const input = 'तुरंत\u200B अपना ओटीपी भेजें!!!';
    const res = normalizeMessage(input);
    expect(res.canonical).toBe('तुरंत अपना ओटीपी भेजें!');
  });

  it('decodes o8p, P@ssword, and spaced a c c o u n t obfuscations without altering numbers', () => {
    const input = 'Verify a c c o u n t P@ssword and o8p for ₹800';
    const res = normalizeMessage(input);
    expect(res.canonical).toContain('account');
    expect(res.canonical).toContain('password');
    expect(res.canonical).toContain('otp');
    expect(res.canonical).toContain('₹800');
  });
});
