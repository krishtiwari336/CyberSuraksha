import {
  ContextAssessment,
  CrossSignalMatch,
  LocalizedText,
  TriggeredRule,
  TrustBoundaries,
  UrlAnalysisResult,
  VerdictType,
} from '../types/analysis';

export function buildTrustBoundaries(
  verdict: VerdictType,
  triggeredRules: TriggeredRule[],
  crossSignals: CrossSignalMatch[],
  urlAnalyses: UrlAnalysisResult[],
  contextAssessment: ContextAssessment
): TrustBoundaries {
  const whatWasDetected: LocalizedText[] = [];

  for (const rule of triggeredRules) {
    whatWasDetected.push(rule.name);
  }

  for (const cs of crossSignals) {
    whatWasDetected.push({
      en: `Cross-signal pattern: ${cs.name.en}`,
      hi: `संयुक्त संकेत पैटर्न: ${cs.name.hi}`,
      hinglish: `Cross-signal pattern: ${cs.name.hinglish}`,
    });
  }

  for (const u of urlAnalyses) {
    for (const sig of u.signals) {
      if (sig.weight > 0) {
        whatWasDetected.push({
          en: `URL indicator (${u.registrableDomain ?? u.hostname}): ${sig.label.en}`,
          hi: `लिंक संकेत (${u.registrableDomain ?? u.hostname}): ${sig.label.hi}`,
          hinglish: `URL signal (${u.registrableDomain ?? u.hostname}): ${sig.label.hinglish}`,
        });
      }
    }
  }

  if (whatWasDetected.length === 0) {
    if (contextAssessment.hasAwarenessContext) {
      whatWasDetected.push({
        en: 'Protective safety-warning or benign notification phrasing detected; credential/fee rules were suppressed.',
        hi: 'सुरक्षा सलाह या सामान्य सूचना वाला संदर्भ मिला; इसलिए चेतावनी नियमों को रोका गया।',
        hinglish: 'Protective awareness warning ya normal notification context mila; false-positive rules suppress kiye gaye.',
      });
    } else if (verdict === 'insufficient_evidence') {
      whatWasDetected.push({
        en: 'Input is too short or lacks enough context to detect specific scam patterns.',
        hi: 'संदेश बहुत छोटा है या इसमें पर्याप्त संदर्भ नहीं है।',
        hinglish: 'Message bahut chhota hai ya clear context missing hai.',
      });
    } else {
      whatWasDetected.push({
        en: 'No strong rule-based scam indicators matched in the submitted text.',
        hi: 'दिए गए टेक्स्ट में ठगी के कोई मजबूत नियम-आधारित संकेत नहीं मिले।',
        hinglish: 'Submitted text mein koi strong rule-based scam indicators nahi mile.',
      });
    }
  }

  const whatCannotBeVerified: LocalizedText[] = [
    {
      en: 'Real-world identity of the sender or caller',
      hi: 'संदेश भेजने वाले या कॉल करने वाले की वास्तविक पहचान',
      hinglish: 'Sender ya caller ki real-world identity',
    },
    {
      en: 'Whether a linked website is live, safe, or malicious (URLs are never opened or fetched)',
      hi: 'लिंक की गई वेबसाइट सक्रिय या सुरक्षित है या नहीं (CyberSuraksha कोई लिंक नहीं खोलता)',
      hinglish: 'Linked website live ya malicious hai ya nahi (URLs kabhi open ya fetch nahi kiye jate)',
    },
    {
      en: 'Final destination behind shortened URLs or redirects',
      hi: 'छोटे किए गए लिंक (shortened URLs) के पीछे का असली पता',
      hinglish: 'Shortened URLs ya redirects ke peeche ka real destination',
    },
    {
      en: 'Whether an organization genuinely issued a job, parcel, or account notice',
      hi: 'किसी कंपनी, बैंक या कूरियर ने सच में यह नोटिस भेजा है या नहीं',
      hinglish: 'Kisi company, bank ya courier ne sach mein yeh offer ya notice bheja hai ya nahi',
    },
    {
      en: 'Whether a listed phone number or UPI ID belongs to the claimed organization',
      hi: 'दिया गया मोबाइल नंबर या UPI ID उस संस्था का है या नहीं',
      hinglish: 'Diya gaya phone number ya UPI ID claimed organization ka hai ya nahi',
    },
  ];

  const whatUserShouldDo: LocalizedText[] = [];
  const seenActions = new Set<string>();

  for (const cs of crossSignals) {
    if (!seenActions.has(cs.recommendedAction.en)) {
      seenActions.add(cs.recommendedAction.en);
      whatUserShouldDo.push(cs.recommendedAction);
    }
  }

  for (const rule of triggeredRules) {
    if (!seenActions.has(rule.recommendedAction.en)) {
      seenActions.add(rule.recommendedAction.en);
      whatUserShouldDo.push(rule.recommendedAction);
    }
  }

  if (whatUserShouldDo.length === 0) {
    whatUserShouldDo.push(
      {
        en: 'Independently verify any unexpected request using the official app, website, or customer-care number printed on your bank card.',
        hi: 'किसी भी अनपेक्षित संदेश की पुष्टि आधिकारिक ऐप, वेबसाइट या बैंक कार्ड पर दिए नंबर से खुद करें।',
        hinglish: 'Kisi bhi unexpected message ko official app, website ya bank card par diye number se khud verify karein.',
      },
      {
        en: 'Never share OTPs, UPI PINs, ATM PINs, CVVs, or passwords—even when no strong indicators appear here.',
        hi: 'कोई मजबूत संकेत न मिलने पर भी अपना OTP, UPI PIN, ATM PIN, CVV या पासवर्ड कभी किसी से साझा न करें।',
        hinglish: 'Chahe yahan strong indicators na milein, phir bhi apna OTP, UPI PIN, CVV ya password kabhi share na karein.',
      }
    );
  }

  return {
    whatWasDetected,
    whatCannotBeVerified,
    whatUserShouldDo: whatUserShouldDo.slice(0, 5),
  };
}
