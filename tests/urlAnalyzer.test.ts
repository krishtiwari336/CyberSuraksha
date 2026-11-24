import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '../src/engine/classifier';
import { analyzeUrlsInText } from '../src/engine/urlAnalyzer';

describe('Static URL Analyzer', () => {
  it('correctly parses deceptive subdomain brand spoof using PSL (tldts)', () => {
    const urls = analyzeUrlsInText('https://paypal.com.security-check.example/login');
    expect(urls).toHaveLength(1);
    const u = urls[0];
    expect(u.protocol).toBe('HTTPS');
    expect(u.subdomain).toBe('paypal.com');
    expect(u.registrableDomain).toBe('security-check.example');
    expect(u.path).toBe('/login');
    expect(u.impersonatedBrand).toBe('PayPal');
    expect(u.signals.some((s) => s.type === 'brand_in_subdomain')).toBe(true);
    expect(u.deceptionExplanation.en).toContain('security-check.example');
    expect(u.deceptionExplanation.en).toContain('not been verified as malicious');
  });

  it('detects punycode, IP-based URLs, @ tricks, and shorteners', () => {
    const ipUrls = analyzeUrlsInText('Visit http://192.168.1.50/verify');
    expect(ipUrls[0].isIpAddress).toBe(true);
    expect(ipUrls[0].signals.some((s) => s.type === 'ip_hostname')).toBe(true);

    const punyUrls = analyzeUrlsInText('https://xn--sbi-90a.com/login');
    expect(punyUrls[0].isPunycode).toBe(true);
    expect(punyUrls[0].signals.some((s) => s.type === 'punycode')).toBe(true);

    const atUrls = analyzeUrlsInText('https://sbi.co.in@evil-domain.example/kyc');
    expect(atUrls[0].hasAtTrick).toBe(true);
    expect(atUrls[0].signals.some((s) => s.type === 'at_trick')).toBe(true);

    const shortUrls = analyzeUrlsInText('Check https://bit.ly/demo-link');
    expect(shortUrls[0].isShortener).toBe(true);
    expect(shortUrls[0].signals.some((s) => s.type === 'shortener')).toBe(true);
  });

  it('ensures HTTP alone, suspicious TLD alone, or shortener alone do not establish fraud', () => {
    const httpRes = analyzeMessage('Check our event schedule at http://community-event.org/info');
    expect(httpRes.verdict).toBe('no_strong_indicators');
    expect(httpRes.score).toBe(0);

    const tldRes = analyzeMessage('Portfolio published at https://rohan-designs.xyz');
    expect(tldRes.verdict).toBe('no_strong_indicators');
    expect(tldRes.score).toBe(0);

    const shortRes = analyzeMessage('Notes shared at https://bit.ly/class-notes');
    expect(shortRes.verdict).toBe('no_strong_indicators');
    expect(shortRes.score).toBeLessThan(20);
  });

  it('does not treat HTTPS as lowering risk on deceptive URLs', () => {
    const res = analyzeMessage('https://paypal.com.security-check.example/login');
    expect(res.score).toBeGreaterThanOrEqual(20);
    expect(res.verdict).toBe('suspicious');
  });

  it('handles multiple URLs in one message cleanly', () => {
    const urls = analyzeUrlsInText(
      'Link 1: https://hdfc-kyc.verify-now.top/auth and Link 2: https://tinyurl.com/abc12'
    );
    expect(urls).toHaveLength(2);
    expect(urls[0].impersonatedBrand).toBe('HDFC Bank');
    expect(urls[1].isShortener).toBe(true);
  });
});
