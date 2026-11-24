export interface CharSpan {
  origStart: number;
  origEnd: number;
}

export interface NormalizedTextResult {
  original: string;
  normalized: string;
  canonical: string;
  /** Maps each index in `canonical` back to [origStart, origEnd] in `original` */
  canonicalMap: CharSpan[];
}

const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u00AD]/;

const LEET_CHAR_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 't',
  '@': 'a',
  '$': 's',
};

const KNOWN_LEET_TARGETS = new Set([
  'otp',
  'pin',
  'kyc',
  'cvv',
  'upi',
  'bank',
  'free',
  'cash',
  'prize',
  'claim',
  'login',
  'verify',
  'paytm',
  'phonepe',
  'paypal',
  'amazon',
  'blocked',
  'urgent',
  'reward',
  'lottery',
  'refund',
  'cashback',
  'password',
  'anydesk',
]);

/**
 * Token-scoped leetspeak normalization:
 * Never globally replaces @, 0, 1, $, 3 across amounts, emails, or URLs.
 * Only converts a single alphanumeric token when it mixes letters+leet symbols
 * and its decoded form matches a known security/scam vocabulary word.
 */
function normalizeLeetToken(token: string): string {
  if (!/[a-z]/i.test(token) || !/[0134578@$]/.test(token)) {
    return token;
  }
  const decoded = token
    .toLowerCase()
    .split('')
    .map((ch) => LEET_CHAR_MAP[ch] ?? ch)
    .join('');
  if (KNOWN_LEET_TARGETS.has(decoded)) {
    return decoded;
  }
  return token.toLowerCase();
}

/**
 * Normalizes text for deterministic rule evaluation while preserving
 * exact index mappings back to the original input string.
 */
export function normalizeMessage(input: string): NormalizedTextResult {
  const original = typeof input === 'string' ? input : '';
  if (!original) {
    return {
      original: '',
      normalized: '',
      canonical: '',
      canonicalMap: [],
    };
  }

  // Step 1: Build character-by-character normalized stream tracking original indices
  const normChars: string[] = [];
  const normSpans: CharSpan[] = [];

  for (let i = 0; i < original.length; ) {
    const codePoint = original.codePointAt(i)!;
    const charLen = codePoint > 0xffff ? 2 : 1;
    const rawChar = original.slice(i, i + charLen);

    if (ZERO_WIDTH_RE.test(rawChar)) {
      i += charLen;
      continue;
    }

    const nfkc = rawChar.normalize('NFKC').toLowerCase();

    if (/\s/.test(nfkc)) {
      // Collapse consecutive whitespace into single space
      if (normChars.length > 0 && normChars[normChars.length - 1] !== ' ') {
        normChars.push(' ');
        normSpans.push({ origStart: i, origEnd: i + charLen });
      } else if (normChars.length > 0 && normChars[normChars.length - 1] === ' ') {
        normSpans[normSpans.length - 1].origEnd = i + charLen;
      }
      i += charLen;
      continue;
    }

    // Collapse repeated exclamation/question marks (e.g. "!!!" -> "!")
    if ((nfkc === '!' || nfkc === '?') && normChars[normChars.length - 1] === nfkc) {
      normSpans[normSpans.length - 1].origEnd = i + charLen;
      i += charLen;
      continue;
    }

    for (const ch of nfkc) {
      normChars.push(ch);
      normSpans.push({ origStart: i, origEnd: i + charLen });
    }

    i += charLen;
  }

  // Trim trailing space
  if (normChars.length > 0 && normChars[normChars.length - 1] === ' ') {
    normChars.pop();
    normSpans.pop();
  }

  const normalized = normChars.join('');

  // Step 2: Token-scoped leetspeak normalization & spaced/dotted obfuscation collapse
  // First apply token-scoped leet decoding on space-separated tokens that aren't URLs/emails/currency
  const preTokens = normalized.split(' ');
  const transformedChars: string[] = [];
  const transformedSpans: CharSpan[] = [];
  let cursor = 0;

  for (let tIdx = 0; tIdx < preTokens.length; tIdx++) {
    const tok = preTokens[tIdx];
    const tokStart = cursor;
    const tokEnd = tokStart + tok.length;

    const looksLikeUrlOrEmailOrCurrency =
      tok.includes('://') ||
      tok.includes('www.') ||
      tok.includes('₹') ||
      /^\d[\d,.]*$/.test(tok) ||
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(tok);

    const decoded = looksLikeUrlOrEmailOrCurrency ? tok : normalizeLeetToken(tok);

    if (decoded === tok) {
      for (let k = 0; k < tok.length; k++) {
        transformedChars.push(tok[k]);
        transformedSpans.push(normSpans[tokStart + k]);
      }
    } else {
      const spanStart = normSpans[tokStart].origStart;
      const spanEnd = normSpans[tokEnd - 1].origEnd;
      for (let k = 0; k < decoded.length; k++) {
        transformedChars.push(decoded[k]);
        transformedSpans.push({ origStart: spanStart, origEnd: spanEnd });
      }
    }

    if (tIdx < preTokens.length - 1) {
      const spaceIdx = tokEnd;
      transformedChars.push(' ');
      transformedSpans.push(normSpans[spaceIdx] ?? { origStart: 0, origEnd: 0 });
    }
    cursor = tokEnd + 1;
  }

  // Step 3: Collapse dotted/hyphenated single letters (e.g., "o.t.p." -> "otp", "k.y.c" -> "kyc")
  // and spaced single letters (e.g., "f r e e" -> "free", "o t p" -> "otp")
  let canonicalStr = transformedChars.join('');
  let canonicalMap = [...transformedSpans];

  // Collapse dotted single-letter sequences like o.t.p. or p-i-n
  const dottedRe = /\b([a-z])(?:[.\-_]([a-z])){2,5}\.?(?=\b|\s|$)/g;
  canonicalStr = applyMappedReplacement(canonicalStr, canonicalMap, dottedRe, (m) =>
    m.replace(/[.\-_]/g, '')
  );

  // Collapse spaced single-letter sequences of length >= 3 (e.g. "f r e e", "o t p")
  const spacedRe = /\b([a-z])(?:\s+([a-z])){2,7}\b/g;
  canonicalStr = applyMappedReplacement(canonicalStr, canonicalMap, spacedRe, (m) =>
    m.replace(/\s+/g, '')
  );

  return {
    original,
    normalized,
    canonical: canonicalStr,
    canonicalMap,
  };
}

function applyMappedReplacement(
  text: string,
  map: CharSpan[],
  regex: RegExp,
  replacer: (match: string) => string
): string {
  const matches: Array<{ start: number; end: number; replacement: string }> = [];
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      replacement: replacer(match[0]),
    });
  }

  if (matches.length === 0) return text;

  const outChars: string[] = [];
  const outMap: CharSpan[] = [];
  let lastIdx = 0;

  for (const m of matches) {
    for (let i = lastIdx; i < m.start; i++) {
      outChars.push(text[i]);
      outMap.push(map[i]);
    }
    const origStart = map[m.start]?.origStart ?? 0;
    const origEnd = map[m.end - 1]?.origEnd ?? origStart;
    for (let k = 0; k < m.replacement.length; k++) {
      outChars.push(m.replacement[k]);
      outMap.push({ origStart, origEnd });
    }
    lastIdx = m.end;
  }

  for (let i = lastIdx; i < text.length; i++) {
    outChars.push(text[i]);
    outMap.push(map[i]);
  }

  map.length = 0;
  map.push(...outMap);
  return outChars.join('');
}

export function mapSpanToOriginal(
  normStart: number,
  normEnd: number,
  canonicalMap: CharSpan[],
  originalLength: number
): { start: number; end: number } {
  if (canonicalMap.length === 0 || normStart >= canonicalMap.length) {
    return { start: 0, end: 0 };
  }
  const safeStart = Math.max(0, normStart);
  const safeEndIdx = Math.min(canonicalMap.length - 1, Math.max(safeStart, normEnd - 1));
  const origStart = canonicalMap[safeStart].origStart;
  const origEnd = Math.min(originalLength, canonicalMap[safeEndIdx].origEnd);
  return { start: origStart, end: Math.max(origStart, origEnd) };
}
