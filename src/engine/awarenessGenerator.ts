import templatesData from '../data/awarenessTemplates.json';
import {
  AnalysisResult,
  AwarenessAudience,
  AwarenessResult,
  ScamCategoryId,
} from '../types/analysis';

interface LocalizedPair {
  hi: string;
  en: string;
}

interface AudienceTemplates {
  family: LocalizedPair;
  friends: LocalizedPair;
  detailed: LocalizedPair;
}

interface AwarenessTemplatesFile {
  categories: Record<string, AudienceTemplates>;
  neutralFallback: AudienceTemplates;
}

const TEMPLATES: AwarenessTemplatesFile = templatesData as AwarenessTemplatesFile;

const CATEGORY_ADDONS: Partial<Record<ScamCategoryId, LocalizedPair>> = {
  otp_scam: {
    hi: 'किसी को भी OTP न बताएं।',
    en: 'Never share OTPs with anyone.',
  },
  upi_pin_scam: {
    hi: 'पैसे लेने के लिए कभी UPI PIN न डालें।',
    en: 'Never enter your UPI PIN to receive money.',
  },
  remote_access_app: {
    hi: 'अनजान कहने पर AnyDesk/APK ऐप इंस्टॉल न करें।',
    en: 'Never install remote-access or unknown APK apps.',
  },
  phishing_link: {
    hi: 'अनजान लिंक पर क्लिक न करें—खुद official वेबसाइट खोलें।',
    en: 'Do not tap unverified links—open the official site yourself.',
  },
};

/**
 * Generates deterministic, standalone, privacy-preserving awareness alerts
 * based strictly on detected categories and signals.
 * Never includes the user's pasted input automatically.
 */
export function generateAwarenessMessage(
  analysis: AnalysisResult | null,
  audience: AwarenessAudience
): AwarenessResult {
  if (!analysis || analysis.verdict !== 'suspicious' || analysis.score < 20) {
    const neutral = TEMPLATES.neutralFallback[audience] ?? TEMPLATES.neutralFallback.family;
    return {
      categoryUsed: 'no_strong_indicators',
      isNeutralFallback: true,
      hindiMessage: neutral.hi,
      englishMessage: neutral.en,
      combinedMessage: `${neutral.hi}\n\n${neutral.en}`,
    };
  }

  const primaryCat =
    analysis.primaryCategory === 'no_strong_indicators'
      ? 'generic_mixed'
      : analysis.primaryCategory;

  const catTemplates =
    TEMPLATES.categories[primaryCat] ?? TEMPLATES.categories.generic_mixed;
  const basePair = catTemplates[audience] ?? catTemplates.family;

  let hi = basePair.hi;
  let en = basePair.en;

  // Concisely append at most one complementary high-risk signal if a second distinct category was also strongly triggered
  const secondaryCategories = Array.from(
    new Set(
      analysis.triggeredRules
        .map((r) => r.category)
        .filter((c) => c !== primaryCat && c !== 'generic_mixed' && c !== 'no_strong_indicators')
    )
  );

  if (secondaryCategories.length > 0 && audience !== 'friends') {
    const addon = CATEGORY_ADDONS[secondaryCategories[0]];
    if (addon && !hi.includes(addon.hi) && !en.includes(addon.en)) {
      hi = `${hi} ${addon.hi}`;
      en = `${en} ${addon.en}`;
    }
  }

  // If URL deception was found alongside another primary category (e.g. fake_kyc_bank), mention link caution concisely if not already covered
  if (
    primaryCat !== 'phishing_link' &&
    analysis.urlAnalyses.some((u) => u.totalUrlWeight >= 10) &&
    !hi.includes('लिंक') &&
    !en.toLowerCase().includes('link')
  ) {
    const linkAddon = CATEGORY_ADDONS.phishing_link!;
    hi = `${hi} ${linkAddon.hi}`;
    en = `${en} ${linkAddon.en}`;
  }

  return {
    categoryUsed: primaryCat,
    isNeutralFallback: false,
    hindiMessage: hi,
    englishMessage: en,
    combinedMessage: `${hi}\n\n${en}`,
  };
}
