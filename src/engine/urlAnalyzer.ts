import { parse as parseDomain } from 'tldts';
import brandsData from '../data/brands.json';
import { UrlAnalysisResult, UrlSignal } from '../types/analysis';

const SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'rb.gy',
  'is.gd',
  'cutt.ly',
  'shorturl.at',
  'ow.ly',
  'tiny.cc',
  'buff.ly',
  'bit.do',
  's.id',
  'rebrand.ly',
  'short.io',
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'site',
  'online',
  'buzz',
  'work',
  'club',
  'vip',
]);

const SUSPICIOUS_PATH_RE =
  /\/(?:login|signin|verify|kyc|update|secure|confirm|claim|reward|refund|bank|password|otp|apk|download)\b|\.apk(?:\?|$)/i;

// Matches http/https/hxxp URLs, www. domains, and bracket-obfuscated URLs like paypal[.]com/login
const URL_EXTRACT_RE =
  /\b(?:(?:https?|hxxps?):\/\/|www\.)[^\s<>"'`]+|\b[a-z0-9-]+(?:\[\.\]|\(\.\)|\.[a-z0-9-]+)+\.(?:com|in|org|net|co\.in|gov\.in|org\.in|xyz|top|ly|io|example|info|biz|site|online)(?:\/[^\s<>"'`]*)?/gi;

interface BrandEntry {
  name: string;
  aliases: string[];
  officialDomains: string[];
}

const BRANDS: BrandEntry[] = brandsData as BrandEntry[];

function cleanTrailingPunctuation(raw: string): string {
  return raw.replace(/[),.;!?'"\]]+$/, '');
}

function deobfuscateUrlString(raw: string): { normalized: string; wasObfuscated: boolean } {
  let out = raw;
  let wasObfuscated = false;

  if (/^hxxps?:\/\//i.test(out)) {
    out = out.replace(/^hxxp/i, 'http');
    wasObfuscated = true;
  }
  if (/\[\.\]|\(\.\)/i.test(out)) {
    out = out.replace(/\[\.\]|\(\.\)/g, '.');
    wasObfuscated = true;
  }
  if (!/^[a-z]+:\/\//i.test(out)) {
    out = `https://${out}`;
  }
  return { normalized: out, wasObfuscated };
}

function detectIpHostname(hostname: string): boolean {
  if (!hostname) return false;
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^\[?[0-9a-f:]+\]?$/i;
  return ipv4.test(hostname) || (hostname.includes(':') && ipv6.test(hostname));
}

function findImpersonatedBrand(
  subdomain: string | null,
  registrableDomain: string | null,
  hostname: string
): { brand: BrandEntry | null; inSubdomain: boolean; inLookalikeDomain: boolean } {
  const lowerSub = (subdomain ?? '').toLowerCase();
  const lowerReg = (registrableDomain ?? hostname).toLowerCase();

  for (const brand of BRANDS) {
    const isOfficial = brand.officialDomains.some(
      (official) => lowerReg === official || lowerReg.endsWith(`.${official}`)
    );
    if (isOfficial) {
      continue;
    }

    // Check if brand's official domain or brand name appears inside the subdomain
    const brandInSub =
      brand.officialDomains.some((dom) => lowerSub.includes(dom)) ||
      brand.aliases.some((alias) => {
        const cleanAlias = alias.replace(/\s+/g, '');
        return cleanAlias.length >= 3 && lowerSub.includes(cleanAlias);
      });

    if (brandInSub) {
      return { brand, inSubdomain: true, inLookalikeDomain: false };
    }

    // Check if brand name appears in registrable domain (lookalike e.g. sbi-kyc-update.xyz)
    const brandInReg = brand.aliases.some((alias) => {
      const cleanAlias = alias.replace(/\s+/g, '');
      return cleanAlias.length >= 3 && lowerReg.includes(cleanAlias);
    });

    if (brandInReg) {
      return { brand, inSubdomain: false, inLookalikeDomain: true };
    }
  }

  return { brand: null, inSubdomain: false, inLookalikeDomain: false };
}

/**
 * Pure static-string URL analyzer.
 * NEVER opens, fetches, follows redirects, or performs DNS lookups.
 */
export function analyzeUrlsInText(text: string): UrlAnalysisResult[] {
  if (!text) return [];

  const results: UrlAnalysisResult[] = [];
  const seenNormalized = new Set<string>();

  URL_EXTRACT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_EXTRACT_RE.exec(text)) !== null) {
    const rawTrimmed = cleanTrailingPunctuation(match[0]);
    if (!rawTrimmed || rawTrimmed.length < 4) continue;

    // Skip email addresses or UPI IDs like user@gmail.com / user@okicici
    const charBefore = match.index > 0 ? text[match.index - 1] : '';
    if (charBefore === '@') continue;

    const { normalized, wasObfuscated } = deobfuscateUrlString(rawTrimmed);
    if (seenNormalized.has(normalized)) continue;
    seenNormalized.add(normalized);

    const start = match.index;
    const end = match.index + rawTrimmed.length;

    let protocol = 'unknown';
    let hostname = '';
    let path = '/';
    let query = '';
    let hasAtTrick = false;

    try {
      const hasExplicitProtocol = /^(?:https?|hxxps?):\/\//i.test(rawTrimmed);
      protocol = hasExplicitProtocol
        ? normalized.split('://')[0].toUpperCase()
        : 'NONE (implicit)';

      // Detect @ trick inside authority section
      const afterProto = normalized.replace(/^[a-z]+:\/\//i, '');
      const authority = afterProto.split('/')[0];
      if (authority.includes('@')) {
        hasAtTrick = true;
      }

      const parsedUrl = new URL(normalized);
      hostname = parsedUrl.hostname.toLowerCase();
      path = parsedUrl.pathname || '/';
      query = parsedUrl.search || '';
    } catch {
      // Malformed URL fallback
      const stripped = normalized.replace(/^[a-z]+:\/\//i, '');
      hostname = stripped.split('/')[0].toLowerCase();
      const slashIdx = stripped.indexOf('/');
      path = slashIdx >= 0 ? stripped.slice(slashIdx) : '/';
    }

    const parsed = parseDomain(hostname, { allowPrivateDomains: true });
    const isIpAddress = detectIpHostname(hostname);
    const registrableDomain = isIpAddress ? hostname : parsed.domain || hostname || null;
    const publicSuffix = parsed.publicSuffix || null;
    const subdomain = isIpAddress ? null : parsed.subdomain || null;
    const isPunycode = hostname.split('.').some((label) => label.startsWith('xn--'));
    const isShortener = registrableDomain ? SHORTENER_DOMAINS.has(registrableDomain) : false;

    const signals: UrlSignal[] = [];

    // Brand impersonation check
    const brandCheck = findImpersonatedBrand(subdomain, registrableDomain, hostname);
    if (brandCheck.brand && brandCheck.inSubdomain) {
      signals.push({
        type: 'brand_in_subdomain',
        weight: 15,
        label: {
          en: 'Brand name placed in subdomain',
          hi: 'सबडोमेन में ब्रांड का नाम',
          hinglish: 'Subdomain mein brand name',
        },
        detail: {
          en: `Appears to use ${brandCheck.brand.name} in the subdomain while the real registrable domain is ${registrableDomain}.`,
          hi: `सबडोमेन में ${brandCheck.brand.name} दिखाया गया है जबकि असली डोमेन ${registrableDomain} है।`,
          hinglish: `Subdomain mein ${brandCheck.brand.name} dikhaya gaya hai jabki real domain ${registrableDomain} hai.`,
        },
      });
    } else if (brandCheck.brand && brandCheck.inLookalikeDomain) {
      signals.push({
        type: 'lookalike_domain',
        weight: 15,
        label: {
          en: 'Brand lookalike domain',
          hi: 'नकली मिलता-जुलता डोमेन',
          hinglish: 'Brand lookalike domain',
        },
        detail: {
          en: `Domain ${registrableDomain} contains "${brandCheck.brand.name}" but does not match its official domain (${brandCheck.brand.officialDomains.join(', ')}).`,
          hi: `डोमेन ${registrableDomain} में "${brandCheck.brand.name}" लिखा है, लेकिन यह आधिकारिक डोमेन (${brandCheck.brand.officialDomains.join(', ')}) नहीं है।`,
          hinglish: `Domain ${registrableDomain} mein "${brandCheck.brand.name}" hai, par yeh official domain (${brandCheck.brand.officialDomains.join(', ')}) nahi hai.`,
        },
      });
    }

    if (hasAtTrick) {
      signals.push({
        type: 'at_trick',
        weight: 12,
        label: {
          en: '@ userinfo redirect trick',
          hi: '@ चिह्न का भ्रामक उपयोग',
          hinglish: '@ trick in URL',
        },
        detail: {
          en: `Contains '@' before the real destination host (${hostname}), a classic trick to disguise the target site.`,
          hi: `असली वेबसाइट (${hostname}) से पहले '@' का उपयोग किया गया है, जो उपयोगकर्ता को भ्रमित कर सकता है।`,
          hinglish: `Real host (${hostname}) se pehle '@' ka use hua hai jo target site chhupane ke liye hota hai.`,
        },
      });
    }

    if (isIpAddress) {
      signals.push({
        type: 'ip_hostname',
        weight: 12,
        label: {
          en: 'Raw IP address hostname',
          hi: 'डोमेन की जगह IP पता',
          hinglish: 'Raw IP address URL',
        },
        detail: {
          en: 'Uses a numeric IP address instead of a named organization domain.',
          hi: 'असली वेबसाइट नाम के बजाय सीधे संख्या वाले IP पते का उपयोग किया गया है।',
          hinglish: 'Named domain ki jagah raw numeric IP address use kiya gaya hai.',
        },
      });
    }

    if (isPunycode) {
      signals.push({
        type: 'punycode',
        weight: 12,
        label: {
          en: 'Punycode (IDN homograph risk)',
          hi: 'Punycode (मिलते-जुलते अक्षरों वाला डोमेन)',
          hinglish: 'Punycode (xn--) domain',
        },
        detail: {
          en: 'Hostname contains xn-- encoded international characters that can visually mimic trusted brands.',
          hi: 'इस डोमेन में xn-- कोड है जो असली अक्षरों जैसा दिखने वाले नकली अक्षर बना सकता है।',
          hinglish: 'Hostname mein xn-- encoding hai jo trusted brand jaisa dikhne wala lookalike bana sakta hai.',
        },
      });
    }

    if (isShortener) {
      signals.push({
        type: 'shortener',
        weight: 5,
        label: {
          en: 'Shortened URL (hidden destination)',
          hi: 'छोटा किया गया लिंक (असली पता छुपा है)',
          hinglish: 'Shortened URL (hidden destination)',
        },
        detail: {
          en: 'Shortened links hide the real destination website; they are not automatically malicious, but should be treated cautiously.',
          hi: 'छोटे लिंक असली वेबसाइट का पता छुपाते हैं; यह अपने आप में ठगी का सबूत नहीं है, पर सावधानी जरूरी है।',
          hinglish: 'Shortened links real destination chhupate hain; yeh automatically malicious nahi hote par savdhani zaroori hai.',
        },
      });
    }

    if (subdomain && subdomain.split('.').length >= 3) {
      signals.push({
        type: 'excessive_subdomains',
        weight: 8,
        label: {
          en: 'Excessive subdomain nesting',
          hi: 'बहुत अधिक सबडोमेन स्तर',
          hinglish: 'Excessive subdomains',
        },
        detail: {
          en: `Hostname has deep subdomain nesting (${subdomain}), often used to push the true domain out of view on mobile screens.`,
          hi: `इस लिंक में कई सबडोमेन (${subdomain}) हैं, जिससे मोबाइल स्क्रीन पर असली डोमेन छुप सकता है।`,
          hinglish: `Deep subdomains (${subdomain}) mobile screen par real domain ko hide kar sakte hain.`,
        },
      });
    }

    if (SUSPICIOUS_PATH_RE.test(`${path}${query}`)) {
      signals.push({
        type: 'suspicious_path',
        weight: 5,
        label: {
          en: 'Sensitive action path',
          hi: 'लॉगिन / KYC / APK वाला पाथ',
          hinglish: 'Suspicious action path',
        },
        detail: {
          en: `Path (${path}) references login, verification, KYC, reward claim, or APK download.`,
          hi: `लिंक का पाथ (${path}) लॉगिन, वेरिफिकेशन, KYC, इनाम या APK डाउनलोड की ओर इशारा करता है।`,
          hinglish: `URL path (${path}) login, verification, KYC, claim ya APK download se juda hai.`,
        },
      });
    }

    if (/%[0-9a-f]{2}/i.test(rawTrimmed)) {
      signals.push({
        type: 'encoded_obfuscation',
        weight: 3,
        label: {
          en: 'Percent-encoded URL characters',
          hi: 'लिंक में एनकोडेड अक्षर',
          hinglish: 'Encoded URL characters',
        },
        detail: {
          en: 'URL contains percent-encoded characters.',
          hi: 'लिंक में % चिह्न वाले एनकोडेड अक्षर मौजूद हैं।',
          hinglish: 'URL mein percent-encoded characters hain.',
        },
      });
    }

    if (wasObfuscated) {
      signals.push({
        type: 'obfuscated_notation',
        weight: 5,
        label: {
          en: 'Obfuscated URL notation',
          hi: 'बदलकर लिखा गया लिंक (hxxp / [.])',
          hinglish: 'Obfuscated URL format',
        },
        detail: {
          en: 'Uses altered notation such as hxxp or [.] to avoid automatic link detection.',
          hi: 'स्वचालित पहचान से बचने के लिए लिंक को hxxp या [.] के साथ लिखा गया है।',
          hinglish: 'Automatic detection se bachne ke liye hxxp ya [.] format use hua hai.',
        },
      });
    }

    // Suspicious TLD alone does NOT establish fraud (weight 0 informational)
    if (publicSuffix && SUSPICIOUS_TLDS.has(publicSuffix.toLowerCase())) {
      signals.push({
        type: 'suspicious_tld',
        weight: 0,
        label: {
          en: `Uncommon TLD (.${publicSuffix})`,
          hi: `कम प्रचलित डोमेन एक्सटेंशन (.${publicSuffix})`,
          hinglish: `Uncommon TLD (.${publicSuffix})`,
        },
        detail: {
          en: `Uses .${publicSuffix}, which is inexpensive and sometimes abused, though a TLD alone never establishes fraud.`,
          hi: `.${publicSuffix} एक्सटेंशन का उपयोग हुआ है; केवल एक्सटेंशन देखकर ठगी तय नहीं की जा सकती।`,
          hinglish: `.${publicSuffix} TLD use hua hai; sirf TLD ke basis par fraud decide nahi kiya ja sakta.`,
        },
      });
    }

    // HTTP / HTTPS informational notes (never lower risk for HTTPS, never establish fraud for HTTP alone)
    if (protocol === 'HTTP') {
      signals.push({
        type: 'http_only',
        weight: 0,
        label: {
          en: 'Unencrypted HTTP protocol',
          hi: 'बिना एन्क्रिप्शन वाला HTTP लिंक',
          hinglish: 'HTTP (unencrypted)',
        },
        detail: {
          en: 'Uses HTTP without encryption. HTTP alone does not establish fraud, though sensitive credentials should never be entered over HTTP.',
          hi: 'यह HTTP लिंक है। केवल HTTP होना ठगी साबित नहीं करता, लेकिन इस पर कोई गुप्त जानकारी नहीं डालनी चाहिए।',
          hinglish: 'Yeh HTTP link hai. Akela HTTP fraud prove nahi karta, par is par sensitive details na daalein.',
        },
      });
    } else if (protocol === 'HTTPS') {
      signals.push({
        type: 'https_present',
        weight: 0,
        label: {
          en: 'HTTPS transport (not proof of legitimacy)',
          hi: 'HTTPS मौजूद (सुरक्षा की गारंटी नहीं)',
          hinglish: 'HTTPS (legitimacy prove nahi karta)',
        },
        detail: {
          en: 'HTTPS only encrypts traffic in transit—fraudulent websites also commonly use HTTPS certificates.',
          hi: 'HTTPS केवल डेटा ट्रांसफर को एन्क्रिप्ट करता है—नकली वेबसाइटों पर भी HTTPS हो सकता है।',
          hinglish: 'HTTPS sirf connection encrypt karta hai—fake websites par bhi HTTPS certificate hota hai.',
        },
      });
    }

    const totalUrlWeight = Math.min(
      25,
      signals.reduce((acc, s) => acc + s.weight, 0)
    );

    let deceptionExplanation = {
      en: `Registrable domain is "${registrableDomain ?? hostname}". CyberSuraksha has not visited or verified whether this site is live or malicious.`,
      hi: `इस लिंक का मुख्य डोमेन "${registrableDomain ?? hostname}" है। CyberSuraksha ने इसे खोला या सत्यापित नहीं किया है।`,
      hinglish: `Iska registrable domain "${registrableDomain ?? hostname}" hai. CyberSuraksha ne is site ko open ya verify nahi kiya hai.`,
    };

    if (brandCheck.brand && brandCheck.inSubdomain) {
      const subDisplay = subdomain ?? brandCheck.brand.name;
      deceptionExplanation = {
        en: `${subDisplay} appears in the subdomain, but the registrable domain is ${registrableDomain}. This may be misleading. The URL has not been verified as malicious.`,
        hi: `सबडोमेन में "${subDisplay}" लिखा दिखता है, लेकिन असली डोमेन "${registrableDomain}" है। यह भ्रमित करने वाला हो सकता है। इस URL के हानिकारक होने की पुष्टि नहीं की गई है।`,
        hinglish: `Subdomain mein "${subDisplay}" dikhta hai, par asli registrable domain "${registrableDomain}" hai. Yeh misleading ho sakta hai. URL ko malicious verify nahi kiya gaya hai.`,
      };
    } else if (brandCheck.brand && brandCheck.inLookalikeDomain) {
      deceptionExplanation = {
        en: `The domain "${registrableDomain}" mentions ${brandCheck.brand.name}, whereas official domains are ${brandCheck.brand.officialDomains.join(', ')}. The URL has not been visited or verified as malicious.`,
        hi: `डोमेन "${registrableDomain}" में ${brandCheck.brand.name} का नाम है, जबकि आधिकारिक डोमेन ${brandCheck.brand.officialDomains.join(', ')} है। लिंक को खोला नहीं गया है।`,
        hinglish: `Domain "${registrableDomain}" mein ${brandCheck.brand.name} ka naam hai, jabki official domain ${brandCheck.brand.officialDomains.join(', ')} hai. URL ko open nahi kiya gaya hai.`,
      };
    }

    results.push({
      raw: rawTrimmed,
      normalizedUrl: normalized,
      start,
      end,
      protocol,
      hostname,
      subdomain,
      registrableDomain,
      publicSuffix,
      path,
      query,
      isShortener,
      isIpAddress,
      isPunycode,
      hasAtTrick,
      impersonatedBrand: brandCheck.brand?.name ?? null,
      officialBrandDomain: brandCheck.brand?.officialDomains[0] ?? null,
      signals,
      totalUrlWeight,
      deceptionExplanation,
    });
  }

  return results;
}
