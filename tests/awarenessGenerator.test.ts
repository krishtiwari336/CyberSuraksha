import { describe, expect, it } from 'vitest';
import { generateAwarenessMessage } from '../src/engine/awarenessGenerator';
import { analyzeMessage } from '../src/engine/classifier';

describe('Smart Awareness Message Generator', () => {
  it('generates natural Hindi, English, and Combined alerts for fake KYC without echoing user text', () => {
    const pasted =
      'Dear customer, unique-ref-99182, your bank account will be blocked today. Complete KYC immediately and share your OTP.';
    const analysis = analyzeMessage(pasted);
    const family = generateAwarenessMessage(analysis, 'family');
    const friends = generateAwarenessMessage(analysis, 'friends');
    const detailed = generateAwarenessMessage(analysis, 'detailed');

    expect(family.isNeutralFallback).toBe(false);
    expect(family.categoryUsed).toBe('fake_kyc_bank');
    expect(family.hindiMessage).toContain('KYC');
    expect(family.englishMessage).toContain('KYC');
    expect(family.combinedMessage).toContain(family.hindiMessage);
    expect(family.combinedMessage).toContain(family.englishMessage);

    // Must never echo original submitted reference string
    expect(family.combinedMessage).not.toContain('unique-ref-99182');
    expect(friends.hindiMessage.length).toBeLessThan(detailed.hindiMessage.length);
  });

  it('generates category-specific alerts for UPI PIN, Job Fee, Digital Arrest, and Courier', () => {
    const upi = generateAwarenessMessage(
      analyzeMessage('To receive ₹5,000 cashback, scan this QR and enter your UPI PIN.'),
      'family'
    );
    expect(upi.categoryUsed).toBe('upi_pin_scam');
    expect(upi.hindiMessage).toContain('UPI');
    expect(upi.englishMessage).toContain('UPI PIN');

    const job = generateAwarenessMessage(
      analyzeMessage(
        'Work from home internship. Earn ₹30,000 monthly. Pay ₹799 registration fee to confirm your slot.'
      ),
      'family'
    );
    expect(job.categoryUsed).toBe('fake_job_internship');
    expect(job.hindiMessage).toContain('internship');

    const arrest = generateAwarenessMessage(
      analyzeMessage(
        'Your Aadhaar is linked to illegal activity. Police action is pending. Pay immediately to avoid arrest.'
      ),
      'family'
    );
    expect(arrest.categoryUsed).toBe('digital_arrest_police');
    expect(arrest.englishMessage).toContain('police');
  });

  it('generates neutral safety fallback for genuine awareness messages (never frightening alert)', () => {
    const genuine = analyzeMessage(
      'Never share your OTP or UPI PIN with anyone. Your bank will never ask you to disclose it.'
    );
    const out = generateAwarenessMessage(genuine, 'family');
    expect(out.isNeutralFallback).toBe(true);
    expect(out.hindiMessage).toContain('कोई मजबूत ठगी का संकेत नहीं मिला');
    expect(out.englishMessage).toContain('No strong scam indicators were detected');
    expect(out.englishMessage).not.toContain('100% safe');
  });
});
