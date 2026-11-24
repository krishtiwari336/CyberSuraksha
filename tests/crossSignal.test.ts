import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '../src/engine/classifier';

describe('Cross-Signal Intelligence Engine', () => {
  it('correlates Fake KYC + Account Threat + OTP', () => {
    const res = analyzeMessage(
      'Dear customer, your bank account will be blocked today. Complete KYC immediately and share your OTP.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-KYC-BLOCK-OTP')).toBe(true);
  });

  it('correlates Job/Internship + Upfront Fee', () => {
    const res = analyzeMessage(
      'Work from home internship. Earn ₹30,000 monthly. Pay ₹799 registration fee to confirm your slot.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-JOB-UPFRONT-FEE')).toBe(true);
  });

  it('correlates Lottery + Processing Fee', () => {
    const res = analyzeMessage(
      'Congratulations! You won ₹50,000. Pay ₹499 processing fee to claim your reward.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-LOTTERY-PAYMENT')).toBe(true);
  });

  it('correlates Digital Arrest + Urgency / Payment Threat', () => {
    const res = analyzeMessage(
      'Your Aadhaar is linked to illegal activity. Police action is pending. Pay immediately to avoid arrest.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-DIGITAL-ARREST-PAY')).toBe(true);
  });

  it('correlates Remote Access App + KYC Threat', () => {
    const res = analyzeMessage(
      'Your wallet account will be blocked today. Install AnyDesk immediately and share the 9-digit code with KYC support.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-REMOTE-APP-SUPPORT')).toBe(true);
  });

  it('correlates Utility Threat + Urgency + Suspicious Link', () => {
    const res = analyzeMessage(
      'Your electricity bill is not updated and power will be disconnected tonight. Pay immediately at https://bit.ly/power-update-now'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-COURIER-UTILITY-LINK')).toBe(true);
  });

  it('correlates Loan Approval + Release Fee Demand', () => {
    const res = analyzeMessage(
      'Pre-approved loan ₹2,00,000 approved today! Pay ₹1,999 processing fee immediately to confirm disbursal.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-LOAN-RELEASE-FEE')).toBe(true);
  });

  it('correlates Refund / Reversal Claim + Payment Authorization', () => {
    const res = analyzeMessage(
      'Sir galti se paise bhej diye ₹2,500 aapke number par. Pay ₹2,000 to confirm refund immediately.'
    );
    expect(res.crossSignals.some((cs) => cs.id === 'XSIG-REFUND-PAYMENT-AUTH')).toBe(true);
  });
});
