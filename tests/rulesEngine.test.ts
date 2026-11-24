import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '../src/engine/classifier';

describe('Contextual Rules Engine (EN / HI / Hinglish)', () => {
  it('detects English fake KYC + OTP scam', () => {
    const res = analyzeMessage(
      'Dear customer, your bank account will be blocked today. Complete KYC immediately and share your OTP.'
    );
    expect(res.verdict).toBe('suspicious');
    expect(res.primaryCategory).toBe('fake_kyc_bank');
    expect(res.triggeredRules.some((r) => r.ruleId === 'RULE-OTP-01')).toBe(true);
    expect(res.triggeredRules.some((r) => r.ruleId === 'RULE-KYC-BLOCK-06')).toBe(true);
  });

  it('detects Hinglish fake KYC + OTP scam', () => {
    const res = analyzeMessage(
      'Aapka bank khata aaj band ho jayega. Turant KYC update karwao aur apna OTP batao.'
    );
    expect(res.verdict).toBe('suspicious');
    expect(res.primaryCategory).toBe('fake_kyc_bank');
  });

  it('detects Hindi Devanagari fake KYC + OTP scam', () => {
    const res = analyzeMessage(
      'आपका बैंक खाता आज बंद हो जाएगा। तुरंत केवाईसी अपडेट करें और अपना ओटीपी भेजें।'
    );
    expect(res.verdict).toBe('suspicious');
    expect(res.primaryCategory).toBe('fake_kyc_bank');
  });

  it('detects UPI PIN / QR request to receive cashback', () => {
    const res = analyzeMessage('To receive ₹5,000 cashback, scan this QR and enter your UPI PIN.');
    expect(res.verdict).toBe('suspicious');
    expect(res.primaryCategory).toBe('upi_pin_scam');
  });

  it('does not flag isolated single words like bank, OTP, job, police, or KYC alone', () => {
    for (const single of ['bank', 'OTP', 'job', 'payment', 'police', 'KYC']) {
      const res = analyzeMessage(single);
      expect(res.verdict).not.toBe('suspicious');
      expect(res.score).toBe(0);
    }
  });
});
