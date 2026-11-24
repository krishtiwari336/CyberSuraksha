import brandsData from '../data/brands.json';
import { ExtractedEntities, UrlAnalysisResult } from '../types/analysis';

interface BrandEntry {
  name: string;
  aliases: string[];
  officialDomains: string[];
}

const BRANDS: BrandEntry[] = brandsData as BrandEntry[];

const KNOWN_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'rediffmail.com',
  'live.com',
]);

const BANK_KEYWORDS = new Set([
  'SBI',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'PNB',
  'Bank of Baroda',
  'Canara Bank',
  'RBI',
]);

const PHONE_RE = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b1930\b|\b1800[\s-]?\d{3}[\s-]?\d{4}\b/g;
const HANDLE_RE = /\b[a-z0-9._-]{2,}@[a-z0-9.-]{2,}\b/gi;
const CURRENCY_RE = /(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d{1,2})?|\b\d[\d,]*(?:\.\d{1,2})?\s*(?:rupees|rs\.?|inr)\b/gi;
const PAYMENT_TERM_RE = /\b(?:upi|qr(?:\s+code)?|registration\s+fee|processing\s+fee|security\s+deposit|neft|imps|rtgs|collect\s+request|transfer|pay\s+now)\b/gi;
const CREDENTIAL_TERM_RE = /\b(?:otp|one\s+time\s+password|upi\s+pin|atm\s+pin|mpin|tpin|pin|cvv|cvc|password|netbanking)\b/gi;
const APP_INSTALL_RE = /\b[a-z0-9_-]+\.apk\b|\b(?:download\s+(?:the\s+)?app|install\s+(?:this\s+)?app|unknown\s+sources)\b/gi;
const REMOTE_ACCESS_RE = /\b(?:anydesk|teamviewer|quicksupport|rustdesk|airdroid|screen\s*share|remote\s*access)\b/gi;

function uniqueMatches(text: string, regex: RegExp): string[] {
  const found = new Set<string>();
  regex.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const val = m[0].trim();
    if (val) found.add(val);
  }
  return Array.from(found);
}

/**
 * Extracts entities from text for transparency.
 * Entities alone NEVER add risk score.
 */
export function extractEntities(
  originalText: string,
  urlAnalyses: UrlAnalysisResult[]
): ExtractedEntities {
  const phoneNumbers = uniqueMatches(originalText, PHONE_RE);
  const currencyAmounts = uniqueMatches(originalText, CURRENCY_RE);
  const paymentTerms = uniqueMatches(originalText, PAYMENT_TERM_RE);
  const credentialTerms = uniqueMatches(originalText, CREDENTIAL_TERM_RE);
  const appInstallRequests = uniqueMatches(originalText, APP_INSTALL_RE);
  const remoteAccessRequests = uniqueMatches(originalText, REMOTE_ACCESS_RE);

  const upiIds: string[] = [];
  const emailAddresses: string[] = [];
  const handles = uniqueMatches(originalText, HANDLE_RE);

  for (const handle of handles) {
    const domainPart = handle.split('@')[1]?.toLowerCase() ?? '';
    if (KNOWN_EMAIL_DOMAINS.has(domainPart) || domainPart.includes('.')) {
      emailAddresses.push(handle);
    } else {
      upiIds.push(handle);
    }
  }

  const lower = originalText.toLowerCase();
  const bankNames: string[] = [];
  const brandNames: string[] = [];

  for (const brand of BRANDS) {
    const matched = brand.aliases.some((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
    });
    if (matched) {
      if (BANK_KEYWORDS.has(brand.name)) {
        bankNames.push(brand.name);
      } else {
        brandNames.push(brand.name);
      }
    }
  }

  return {
    phoneNumbers,
    urls: urlAnalyses.map((u) => u.raw),
    upiIds,
    emailAddresses,
    currencyAmounts,
    paymentTerms,
    credentialTerms,
    appInstallRequests,
    remoteAccessRequests,
    bankNames,
    brandNames,
  };
}
