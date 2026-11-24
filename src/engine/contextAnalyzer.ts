import { ContextAssessment } from '../types/analysis';

export interface TextClause {
  text: string;
  start: number;
  end: number;
  isAwarenessOrNegation: boolean;
  isOfficialChannelAdvice: boolean;
  isNoFeeGuarantee: boolean;
  isBenignNotification: boolean;
}

const AWARENESS_NEGATION_RE =
  /(?:\b(?:never\s+(?:share|disclose|reveal|give|tell|enter|send|click|tap|install|pay)|do\s+not\s+(?:share|disclose|click|tap|install|pay|transfer)|don't\s+(?:share|disclose|click|tap|install|pay)|avoid\s+(?:clicking|installing|sharing|granting)|learn\s+to\s+recognize|how\s+to\s+(?:spot|recognize|avoid)|beware\s+of\s+fake|warning\s+(?:my\s+)?(?:friend|family|everyone|others|you)\s+about|educating\s+(?:people|students|family)\s+about|bank\s+(?:staff\s+)?will\s+never\s+ask|never\s+asks?\s+(?:for|you\s+to)|no\s+pin\s+(?:is\s+)?required\s+to\s+receive|never\s+need\s+to\s+enter)\b|(?:kabhi\s+(?:bhi\s+)?(?:share\s+)?(?:mat|na)\s*(?:karo|karein|batana|bhejna)|mat\s+batana|na\s+batayein|savdhan\s+rahein)|(?:कभी\s+(?:भी\s+)?(?:मत|न)\s*(?:बताना|बताएं|बताइए|भेजें|डालें|शेयर\s*करें)|साझा\s+न\s+करें|बिल्कुल\s+न\s+बताएं|कभी\s+OTP\s+नहीं\s+माँगता|नहीं\s+माँगती))/gi;

const OFFICIAL_CHANNEL_RE =
  /\b(?:official\s+(?:bank|courier|company)\s+(?:application|app|website|portal)|available\s+in\s+the\s+official|visit\s+(?:your\s+)?nearest\s+branch)\b/i;

const NO_FEE_RE =
  /(?:\b(?:no\s+(?:registration|training|processing|joining)?\s*fee|zero\s+(?:registration\s+)?fee|there\s+is\s+no\s+registration\s+fee|without\s+any\s+fee|free\s+of\s+cost)\b|कोई\s+फीस\s+नहीं)/i;

const BENIGN_NOTIFICATION_RE =
  /\b(?:scheduled\s+for\s+delivery|arriving\s+tomorrow|out\s+for\s+delivery|account\s+statement\s+(?:for\s+\w+\s+)?is\s+(?:available|ready)|bank\s+statement\s+is\s+ready|interview\s+is\s+scheduled)\b/i;

const RECEIVE_MONEY_RE =
  /\b(?:receive|cashback|refund|claim\s+reward|paise\s+(?:lene|paane)|पाने\s+के\s+लिए)\b/i;

/**
 * Splits text into sentence/clause spans and evaluates protective context
 * at the clause level so genuine bank warnings aren't falsely flagged while
 * multi-part scams that include decoy warnings still get caught in later clauses.
 */
export function splitIntoClauses(text: string): TextClause[] {
  if (!text) return [];

  const clauses: TextClause[] = [];
  const delimRe = /[.!?\n;।]+/g;
  let lastEnd = 0;
  let m: RegExpExecArray | null;

  while ((m = delimRe.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const raw = text.slice(lastEnd, end);
    if (raw.trim().length > 0) {
      clauses.push(evaluateClause(raw, lastEnd, end));
    }
    lastEnd = end;
  }

  if (lastEnd < text.length) {
    const tail = text.slice(lastEnd);
    if (tail.trim().length > 0) {
      clauses.push(evaluateClause(tail, lastEnd, text.length));
    }
  }

  return clauses;
}

function evaluateClause(text: string, start: number, end: number): TextClause {
  AWARENESS_NEGATION_RE.lastIndex = 0;
  const isAwarenessOrNegation = AWARENESS_NEGATION_RE.test(text);
  const isOfficialChannelAdvice = OFFICIAL_CHANNEL_RE.test(text);
  const isNoFeeGuarantee = NO_FEE_RE.test(text);
  const isBenignNotification = BENIGN_NOTIFICATION_RE.test(text);

  return {
    text,
    start,
    end,
    isAwarenessOrNegation,
    isOfficialChannelAdvice,
    isNoFeeGuarantee,
    isBenignNotification,
  };
}

export function assessMessageContext(text: string): {
  assessment: ContextAssessment;
  clauses: TextClause[];
} {
  const clauses = splitIntoClauses(text);
  const awarenessMatches: string[] = [];

  AWARENESS_NEGATION_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = AWARENESS_NEGATION_RE.exec(text)) !== null) {
    awarenessMatches.push(m[0]);
  }

  const hasNegationWarning = clauses.some((c) => c.isAwarenessOrNegation);
  const hasOfficialChannelReference = clauses.some((c) => c.isOfficialChannelAdvice);
  const hasNoFeeGuarantee = clauses.some((c) => c.isNoFeeGuarantee);
  const hasBenignDeliveryContext = clauses.some((c) => c.isBenignNotification);
  const hasReceiveMoneyContext = RECEIVE_MONEY_RE.test(text);

  const hasAwarenessContext =
    hasNegationWarning || hasOfficialChannelReference || hasNoFeeGuarantee || hasBenignDeliveryContext;

  return {
    assessment: {
      hasAwarenessContext,
      hasNegationWarning,
      hasOfficialChannelReference,
      hasReceiveMoneyContext,
      hasNoFeeGuarantee,
      hasBenignDeliveryContext,
      awarenessMatches,
      clauseCount: clauses.length,
    },
    clauses,
  };
}
