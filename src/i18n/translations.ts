import { Language, SeverityLevel, VerdictType } from '../types/analysis';

export interface UiStrings {
  nav: {
    analyze: string;
    redTeam: string;
    rulebook: string;
  };
  hero: {
    kicker: string;
    headline: string;
    subtitle: string;
    ctaAnalyze: string;
    ctaLab: string;
    trustItems: [string, string, string, string];
    shieldTitle: string;
    shieldSub: string;
    layers: [string, string, string];
    journeySteps: [string, string, string, string];
  };
  analyzer: {
    inputHeading: string;
    inputHelper: string;
    placeholder: string;
    analyzeBtn: string;
    analyzingBtn: string;
    scanningHeadline: string;
    scanningSub: string;
    clearBtn: string;
    charCount: string;
    privacyNotice: string;
    examplesHeading: string;
    emptyTitle: string;
    emptyDesc: string;
    scoreLabel: string;
    heuristicNote: string;
    categoryLabel: string;
    analyzedIn: string;
    highlightedHeading: string;
    evidenceHeading: string;
    noEvidence: string;
    techDetails: string;
    recommendedNext: string;
    suppressedHeading: string;
    suppressedDesc: string;
    prototypeBadge: string;
    officialBadge: string;
    crossSignalHeading: string;
    crossSignalSub: string;
    urlHeading: string;
    urlSafetyNote: string;
    protocolLabel: string;
    subdomainLabel: string;
    registrableDomainLabel: string;
    pathLabel: string;
    entitiesHeading: string;
    entitiesNote: string;
    trustHeading: string;
    detectedCol: string;
    unverifiedCol: string;
    actionsCol: string;
    resourcesHeading: string;
    lostMoneyPriority: string;
  };
  feedback: {
    heading: string;
    sessionNotice: string;
    question: string;
    scamBtn: string;
    legitBtn: string;
    unsureBtn: string;
    dismissBtn: string;
    unverifiedNote: string;
    consentQuestion: string;
    yesContributeBtn: string;
    noPrivateBtn: string;
    privateConfirmed: string;
    previewTitle: string;
    previewSubtitle: string;
    sanitizedLabel: string;
    generalizedLabel: string;
    copySanitizedBtn: string;
    copiedFeedback: string;
    confirmAddBtn: string;
    cancelBtn: string;
    addedSuccess: string;
    viewRulebookBtn: string;
  };
  severity: Record<SeverityLevel, string>;
  verdict: Record<VerdictType, { title: string; subtitle: string }>;
  redTeam: {
    title: string;
    subtitle: string;
    disclaimer: string;
    runAllBtn: string;
    runScamBtn: string;
    runGenuineBtn: string;
    resetBtn: string;
    runSingleBtn: string;
    searchPlaceholder: string;
    metricsHeading: string;
    expectedCol: string;
    actualCol: string;
    scoreCol: string;
    statusCol: string;
    pass: string;
    fail: string;
    notRun: string;
    running: string;
    traceToggle: string;
    copyJsonBtn: string;
    copiedJson: string;
    failedDiagTitle: string;
    impactLabel: string;
    candidateSuggestionLabel: string;
    openCandidatesBtn: string;
    rawJsonToggle: string;
    triggeredRules: string;
    suppressedRules: string;
    notRunYet: string;
    emptyFilter: string;
    scannerStandby: string;
    scannerRunning: string;
  };
  rulebook: {
    title: string;
    subtitle: string;
    counts: {
      original: string;
      newlyAdded: string;
      candidates: string;
      totalActive: string;
    };
    tabs: {
      original: string;
      newlyAdded: string;
      candidates: string;
    };
    searchPlaceholder: string;
    allCategories: string;
    statusOriginal: string;
    statusNewlyAdded: string;
    whatDetects: string;
    whyMatters: string;
    whyAdded: string;
    scamTypeCovered: string;
    triggerExample: string;
    strengthensContext: string;
    suppressesContext: string;
    scoreWeight: string;
    groupCap: string;
    languagesLabel: string;
    sourceAttribution: string;
    pipelineTitle: string;
    pipelineSteps: [string, string, string, string, string, string, string, string];
    candidateIntroNote: string;
    selectCandidatesLabel: string;
    runSandboxBtn: string;
    beforeLabel: string;
    afterLabel: string;
    improvedLabel: string;
    regressedLabel: string;
    noAutoPromoteNote: string;
    contributedTitle: string;
    contributedSubtitle: string;
    contributedEmptyTitle: string;
    contributedEmptyBody: string;
    contributedEmptyCta: string;
    officialResourcesTitle: string;
  };
  footer: {
    tagline: string;
    privacy: string;
    limitation: string;
    reporting: string;
  };
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    nav: {
      analyze: 'Analyze',
      redTeam: 'Red-Team Lab',
      rulebook: 'Detection Rulebook',
    },
    hero: {
      kicker: 'Universal Scam, Phishing & Fake Offer Intelligence · India',
      headline: 'See the trap before you tap.',
      subtitle:
        'Inspect suspicious SMS, WhatsApp forwards, UPI requests, job offers, courier alerts, and links directly in your browser. Understand exact evidence, cross-signal combinations, and safe next steps in seconds.',
      ctaAnalyze: 'Analyze a Message',
      ctaLab: 'Run Red-Team Lab',
      trustItems: [
        '100% browser-local',
        'Zero message uploads',
        'Deterministic rule engine',
        'Explainable evidence',
      ],
      shieldTitle: 'Local Explainable Engine',
      shieldSub: 'Deterministic · Zero AI API · Zero Network',
      layers: [
        '01. Multilingual Normalizer (EN / HI / Hinglish)',
        '02. Contextual Rules + Negation Guard',
        '03. Cross-Signal + Static PSL URL Anatomy',
      ],
      journeySteps: ['Paste', 'Inspect Evidence', 'Verify Safely', 'Optional Feedback'],
    },
    analyzer: {
      inputHeading: 'Universal Message & URL Analyzer',
      inputHelper:
        'SMS · WhatsApp · Email · Bank alerts · UPI · Job offers · Courier · English / Hindi / Hinglish',
      placeholder:
        'Paste a suspicious SMS, WhatsApp forward, UPI payment request, job offer, or link here...',
      analyzeBtn: 'Analyze Message',
      analyzingBtn: 'Scanning locally...',
      scanningHeadline: 'Running local deterministic scan...',
      scanningSub:
        'Normalizing evasion patterns, checking active contextual rules, static PSL URL anatomy, and false-positive guards.',
      clearBtn: 'Clear',
      charCount: 'characters',
      privacyNotice: 'Analyzed in browser memory only. Nothing is uploaded or stored.',
      examplesHeading: 'Load a sample message to test the live engine',
      emptyTitle: 'Ready to inspect a suspicious message or link',
      emptyDesc:
        'Paste text above or pick any sample message to see highlighted phrases, Cross-Signal Intelligence, static URL breakdown, Trust Boundaries, and verification steps.',
      scoreLabel: 'Heuristic Severity Score',
      heuristicNote:
        'Prototype heuristic severity indicator (0–100), not fraud probability and not an official RBI score.',
      categoryLabel: 'Primary Pattern',
      analyzedIn: 'Analyzed locally in',
      highlightedHeading: 'Original Message & Highlighted Phrases',
      evidenceHeading: 'Detected Evidence Cards',
      noEvidence: 'No suspicious rule indicators matched in this message.',
      techDetails: 'Technical details',
      recommendedNext: 'Recommended action',
      suppressedHeading: 'False-Positive Protection (Suppressed Matches)',
      suppressedDesc:
        'Matched phrases inside protective warnings, negation, or official-app instructions were prevented from raising the score.',
      prototypeBadge: 'Prototype pattern — not directly specified in cited official reference.',
      officialBadge: 'Aligned with cited official advisory',
      crossSignalHeading: 'Cross-Signal Intelligence',
      crossSignalSub:
        'Correlates independent indicators into recognized multi-step scam patterns without double-counting.',
      urlHeading: 'Static URL Deception Visualizer',
      urlSafetyNote:
        'Static-string parsing only. CyberSuraksha never opens, fetches, follows redirects, or resolves submitted links.',
      protocolLabel: 'Protocol',
      subdomainLabel: 'Subdomain',
      registrableDomainLabel: 'Registrable Domain',
      pathLabel: 'Path & Query',
      entitiesHeading: 'Extracted Entities',
      entitiesNote:
        'Phone numbers, UPI IDs, amounts, and email addresses alone never increase the risk score.',
      trustHeading: 'Trust Boundaries',
      detectedCol: 'What CyberSuraksha Detected',
      unverifiedCol: 'What Cannot Be Verified',
      actionsCol: 'What You Should Do',
      resourcesHeading: 'Official Indian Cyber Safety Verification Resources',
      lostMoneyPriority:
        'If money has already been debited, contact your bank immediately and call National Cyber Helpline 1930.',
    },
    feedback: {
      heading: 'Optional Session Feedback',
      sessionNotice: 'Unverified feedback · Browser memory only · Cleared on page reload',
      question: 'Do you know if this message was actually a scam?',
      scamBtn: 'It was a Scam',
      legitBtn: 'It was Legit',
      unsureBtn: "I'm Unsure",
      dismissBtn: 'Dismiss',
      unverifiedNote:
        'Note: User feedback is unverified and does not alter active detection rules automatically.',
      consentQuestion:
        "Would you like to contribute an anonymized pattern to help improve CyberSuraksha's detection rules?",
      yesContributeBtn: 'Yes, contribute pattern',
      noPrivateBtn: 'No, keep my feedback private',
      privateConfirmed:
        'Feedback kept private in this view only. Nothing was added to the Rulebook or candidate patterns.',
      previewTitle: 'Sanitized Pattern Preview (Original Message Not Retained)',
      previewSubtitle:
        'Personal identifiers, phone numbers, UPI IDs, names, amounts, and unique URL paths have been removed locally. Review before confirming:',
      sanitizedLabel: 'Sanitized pattern',
      generalizedLabel: 'Generalized pattern tokens',
      copySanitizedBtn: 'Copy Sanitized',
      copiedFeedback: 'Copied!',
      confirmAddBtn: 'Confirm & Add Pattern',
      cancelBtn: 'Cancel',
      addedSuccess:
        'Anonymized pattern added to User-Contributed Patterns for this session only.',
      viewRulebookBtn: 'View in Detection Rulebook',
    },
    severity: {
      low: 'Low Indicators',
      caution: 'Caution',
      high: 'High Risk',
      critical: 'Critical',
    },
    verdict: {
      suspicious: {
        title: 'Suspicious indicators detected',
        subtitle:
          'Multiple risk signals were found. Verify independently via official channels before tapping or paying.',
      },
      no_strong_indicators: {
        title: 'No strong indicators detected',
        subtitle:
          'Our local rules did not find strong scam signals, though absence of signals never guarantees safety.',
      },
      insufficient_evidence: {
        title: 'Insufficient evidence',
        subtitle:
          'The message is too short or lacks context to evaluate scam patterns reliably.',
      },
    },
    redTeam: {
      title: 'Red-Team Validation Lab',
      subtitle:
        'Challenge the live production detection engine. Inspect what it catches, where real detection gaps exist, and how accurately it separates scams from genuine messages.',
      disclaimer:
        'Performance on bundled prototype test set — not real-world detection accuracy.',
      runAllBtn: 'Run All Tests',
      runScamBtn: 'Run Scam Tests',
      runGenuineBtn: 'Run Genuine Tests',
      resetBtn: 'Reset Tests',
      runSingleBtn: 'Run Test',
      searchPlaceholder: 'Search test cases by title, text, or tag...',
      metricsHeading: 'Confusion Matrix & Performance Metrics',
      expectedCol: 'Expected',
      actualCol: 'Actual',
      scoreCol: 'Score',
      statusCol: 'Status',
      pass: 'PASS',
      fail: 'FAIL',
      notRun: 'NOT RUN',
      running: 'SCANNING',
      traceToggle: 'Rule Trace',
      copyJsonBtn: 'Copy JSON',
      copiedJson: 'Copied!',
      failedDiagTitle: 'Failure Diagnostic (Real Engine Gap)',
      impactLabel: 'Potential real-world impact',
      candidateSuggestionLabel: 'Linked candidate improvement',
      openCandidatesBtn: 'Inspect Candidate Rules',
      rawJsonToggle: 'Technical JSON',
      triggeredRules: 'Triggered Rules',
      suppressedRules: 'Suppressed Rules',
      notRunYet:
        'Click "Run All Tests", "Run Scam Tests", "Run Genuine Tests", or any individual test to execute the live production analyzer.',
      emptyFilter: 'No test cases match the selected filter and search query.',
      scannerStandby: 'Scanner Ready · Live Production Execution',
      scannerRunning: 'Scanning bundled test vectors...',
    },
    rulebook: {
      title: 'Detection Rulebook & Gap Transparency',
      subtitle:
        'Inspect Original Rules, Newly Added production rules, non-active Candidate Rules, and explicitly consented User-Contributed Patterns.',
      counts: {
        original: 'Original Rules',
        newlyAdded: 'Newly Added Active Rules',
        candidates: 'Candidate Rules (Inactive)',
        totalActive: 'Total Active Rules',
      },
      tabs: {
        original: 'Original Rules',
        newlyAdded: 'Newly Added Rules',
        candidates: 'Candidate Rules',
      },
      searchPlaceholder: 'Search rules by ID, keyword, category, or explanation...',
      allCategories: 'All Categories',
      statusOriginal: 'Original · Active',
      statusNewlyAdded: 'Newly Added · Active',
      whatDetects: 'What it detects',
      whyMatters: 'Recommended safeguard & action',
      whyAdded: 'Why it was added',
      scamTypeCovered: 'Scam type covered',
      triggerExample: 'Example message / pattern',
      strengthensContext: 'Strengthening context',
      suppressesContext: 'Context & false-positive safeguards',
      scoreWeight: 'Score contribution',
      groupCap: 'Group cap',
      languagesLabel: 'Languages',
      sourceAttribution: 'Official advisory reference',
      pipelineTitle: 'Rule Improvement Pipeline',
      pipelineSteps: [
        'User Feedback',
        'Consent',
        'Sanitized Pattern',
        'Test Case',
        'Candidate Rule',
        'Validation',
        'Approval',
        'Active Rule',
      ],
      candidateIntroNote:
        'Candidate rules are proposed patterns not yet active in the production analyzer. They never alter live risk scores until reviewed, validated, and explicitly promoted.',
      selectCandidatesLabel: 'Select candidate rules to test in sandbox',
      runSandboxBtn: 'Run Sandbox Validation',
      beforeLabel: 'Production Baseline (Active Rules)',
      afterLabel: 'With Selected Candidates (Sandbox Only)',
      improvedLabel: 'Newly Caught / Fixed',
      regressedLabel: 'Regressions',
      noAutoPromoteNote:
        'Sandbox preview only — candidate rules do not affect production Analyzer scores.',
      contributedTitle: 'User-Contributed Patterns',
      contributedSubtitle:
        'Session-only anonymized patterns added strictly after explicit user consent and preview confirmation. Cleared automatically on reload.',
      contributedEmptyTitle: 'No patterns contributed in this session yet',
      contributedEmptyBody:
        'Patterns only appear here after a user inspects a message in the Analyzer, chooses optional feedback, explicitly consents to contribute an anonymized pattern, and confirms the sanitized preview.',
      contributedEmptyCta: 'Go to Analyzer',
      officialResourcesTitle: 'Official Advisory & Reporting References (India)',
    },
    footer: {
      tagline: 'CyberSuraksha · See the trap before you tap.',
      privacy: '100% browser-local analysis · In-memory session only · Zero uploads or storage.',
      limitation:
        'Prototype heuristic tool — cannot verify sender identity or live website reputation.',
      reporting: 'Report financial fraud: Call 1930 or visit cybercrime.gov.in',
    },
  },
  hi: {
    nav: {
      analyze: 'जाँच करें',
      redTeam: 'रेड-टीम लैब',
      rulebook: 'नियम पुस्तिका',
    },
    hero: {
      kicker: 'ठगी, फ़िशिंग और नकली ऑफर पहचान मंच · भारत',
      headline: 'क्लिक करने से पहले जाल को पहचानें।',
      subtitle:
        'किसी भी संदिग्ध SMS, व्हाट्सएप फॉरवर्ड, UPI रिक्वेस्ट, नौकरी ऑफर, कूरियर संदेश या लिंक को सीधे अपने ब्राउज़र में जाँचें। कुछ ही सेकंड में सबूत, संयुक्त संकेत और सुरक्षित कदम समझें।',
      ctaAnalyze: 'मैसेज जाँचें',
      ctaLab: 'रेड-टीम लैब चलाएं',
      trustItems: [
        '100% ब्राउज़र-लोकल',
        'कोई डेटा अपलोड नहीं',
        'स्पष्ट नियम-आधारित इंजन',
        'स्पष्ट सबूत और कारण',
      ],
      shieldTitle: 'स्थानीय स्पष्ट इंजन',
      shieldSub: 'बिना AI API · बिना नेटवर्क अनुरोध',
      layers: [
        '01. बहुभाषी नॉर्मलाइज़र (EN / हिंदी / Hinglish)',
        '02. संदर्भ-आधारित नियम + गलत अलार्म सुरक्षा',
        '03. क्रॉस-सिग्नल + स्टैटिक URL डोमेन जाँच',
      ],
      journeySteps: ['पेस्ट करें', 'सबूत देखें', 'सुरक्षित जाँच', 'वैकल्पिक प्रतिक्रिया'],
    },
    analyzer: {
      inputHeading: 'यूनिवर्सल मैसेज और लिंक जाँच',
      inputHelper:
        'SMS · व्हाट्सएप · ईमेल · बैंक अलर्ट · UPI · जॉब ऑफर · कूरियर · English / हिंदी / Hinglish',
      placeholder:
        'यहाँ कोई संदिग्ध SMS, व्हाट्सएप फॉरवर्ड, UPI पेमेंट रिक्वेस्ट, जॉब ऑफर या लिंक पेस्ट करें...',
      analyzeBtn: 'मैसेज जाँचें',
      analyzingBtn: 'जाँच हो रही है...',
      scanningHeadline: 'स्थानीय नियम-आधारित स्कैन चल रहा है...',
      scanningSub:
        'शब्दों की बनावट, सक्रिय संदर्भ नियम, स्टैटिक URL भागों और गलत-अलार्म सुरक्षा की जाँच हो रही है।',
      clearBtn: 'साफ करें',
      charCount: 'अक्षर',
      privacyNotice: 'केवल ब्राउज़र मेमोरी में जाँच। कोई अपलोड या स्टोरेज नहीं।',
      examplesHeading: 'लाइव इंजन आज़माने के लिए उदाहरण चुनें',
      emptyTitle: 'मैसेज या लिंक जाँचने के लिए तैयार',
      emptyDesc:
        'ऊपर टेक्स्ट पेस्ट करें या नीचे दिए उदाहरण चुनें—हम संदिग्ध शब्द, क्रॉस-सिग्नल इंटेलिजेंस, लिंक का विश्लेषण और भरोसे की सीमाएं दिखाएंगे।',
      scoreLabel: 'अनुमानित जोखिम स्कोर',
      heuristicNote:
        'यह प्रोटोटाइप नियम-आधारित स्कोर (0–100) है—ठगी की पक्की संभावना या RBI का आधिकारिक स्कोर नहीं।',
      categoryLabel: 'मुख्य पैटर्न',
      analyzedIn: 'ब्राउज़र में जाँच समय:',
      highlightedHeading: 'मूल मैसेज और संदिग्ध हिस्से',
      evidenceHeading: 'मिले हुए सबूत कार्ड',
      noEvidence: 'इस मैसेज में ठगी के कोई नियम-आधारित संकेत नहीं मिले।',
      techDetails: 'तकनीकी विवरण',
      recommendedNext: 'सुझाया गया कदम',
      suppressedHeading: 'गलत अलार्म से सुरक्षा (रोके गए नियम)',
      suppressedDesc:
        'यह शब्द सुरक्षा सलाह, मनाही या आधिकारिक ऐप के संदर्भ में मिले थे, इसलिए इनका स्कोर नहीं जोड़ा गया।',
      prototypeBadge:
        'Prototype pattern — आधिकारिक संदर्भ में सीधे निर्दिष्ट नहीं (प्रोटोटाइप पैटर्न)।',
      officialBadge: 'आधिकारिक सलाह पर आधारित',
      crossSignalHeading: 'क्रॉस-सिग्नल इंटेलिजेंस',
      crossSignalSub:
        'एक साथ मिलने वाले अलग-अलग संकेतों को जोड़कर ठगी का पैटर्न पहचानता है (बिना दोहरा स्कोर जोड़े)।',
      urlHeading: 'स्टैटिक लिंक (URL) विश्लेषण',
      urlSafetyNote:
        'केवल टेक्स्ट की बनावट की जाँच। CyberSuraksha किसी भी लिंक को खोलता या लोड नहीं करता।',
      protocolLabel: 'प्रोटोकॉल',
      subdomainLabel: 'सबडोमेन',
      registrableDomainLabel: 'असली डोमेन',
      pathLabel: 'पाथ और क्वेरी',
      entitiesHeading: 'निकाले गए विवरण (Entities)',
      entitiesNote: 'केवल फोन नंबर, UPI ID, रकम या ईमेल होने से जोखिम स्कोर नहीं बढ़ता।',
      trustHeading: 'विश्वसनीयता की सीमाएं',
      detectedCol: 'CyberSuraksha ने क्या पाया',
      unverifiedCol: 'क्या सत्यापित नहीं हो सकता',
      actionsCol: 'आपको क्या करना चाहिए',
      resourcesHeading: 'भारत के आधिकारिक साइबर सुरक्षा संसाधन',
      lostMoneyPriority:
        'अगर पैसे कट चुके हैं, तो तुरंत अपने बैंक से संपर्क करें और 1930 हेल्पलाइन पर कॉल करें।',
    },
    feedback: {
      heading: 'वैकल्पिक सत्र प्रतिक्रिया',
      sessionNotice: 'असत्यापित प्रतिक्रिया · केवल इस सत्र की मेमोरी में · रीलोड पर हट जाएगी',
      question: 'क्या आप जानते हैं कि यह संदेश वास्तव में ठगी (scam) था?',
      scamBtn: 'यह ठगी (Scam) था',
      legitBtn: 'यह सही (Legit) था',
      unsureBtn: 'पक्का पता नहीं',
      dismissBtn: 'हटाएं',
      unverifiedNote:
        'ध्यान दें: उपयोगकर्ता प्रतिक्रिया असत्यापित होती है और सक्रिय नियमों को अपने-आप नहीं बदलती।',
      consentQuestion:
        'क्या आप CyberSuraksha के नियमों को बेहतर बनाने के लिए एक गुमनाम (anonymized) पैटर्न साझा करना चाहेंगे?',
      yesContributeBtn: 'हाँ, पैटर्न योगदान करें',
      noPrivateBtn: 'नहीं, मेरी प्रतिक्रिया निजी रखें',
      privateConfirmed:
        'आपकी प्रतिक्रिया केवल यहीं निजी रखी गई है। नियम पुस्तिका या प्रस्तावित नियमों में कुछ भी नहीं जोड़ा गया।',
      previewTitle: 'सफाई किया गया पैटर्न प्रीव्यू (मूल संदेश सुरक्षित नहीं रखा जाएगा)',
      previewSubtitle:
        'नाम, फोन नंबर, UPI ID, खाता संख्या, रकम और अनोखे लिंक भाग हटा दिए गए हैं। जोड़ने से पहले जाँचें:',
      sanitizedLabel: 'सफाई किया गया पैटर्न',
      generalizedLabel: 'सामान्य पैटर्न शब्द',
      copySanitizedBtn: 'साफ पैटर्न कॉपी करें',
      copiedFeedback: 'कॉपी हो गया!',
      confirmAddBtn: 'पुष्टि करें और जोड़ें',
      cancelBtn: 'रद्द करें',
      addedSuccess: 'गुमनाम पैटर्न केवल इस सत्र के लिए User-Contributed Patterns में जोड़ा गया।',
      viewRulebookBtn: 'नियम पुस्तिका में देखें',
    },
    severity: {
      low: 'कम संकेत',
      caution: 'सावधानी',
      high: 'अधिक जोखिम',
      critical: 'गंभीर चेतावनी',
    },
    verdict: {
      suspicious: {
        title: 'संदिग्ध संकेत मिले हैं',
        subtitle:
          'मैसेज में जोखिम के कई संकेत हैं। किसी भी लिंक पर क्लिक करने या पैसे भेजने से पहले आधिकारिक जगह से जाँच करें।',
      },
      no_strong_indicators: {
        title: 'कोई मजबूत संकेत नहीं मिला',
        subtitle:
          'नियमों में कोई बड़ा संकेत नहीं मिला, लेकिन इसका मतलब यह नहीं कि मैसेज पूरी तरह सुरक्षित है।',
      },
      insufficient_evidence: {
        title: 'पर्याप्त जानकारी नहीं',
        subtitle: 'मैसेज बहुत छोटा है या जाँच के लिए पर्याप्त संदर्भ मौजूद नहीं है।',
      },
    },
    redTeam: {
      title: 'रेड-टीम वैलिडेशन लैब',
      subtitle:
        'लाइव सक्रिय नियम इंजन को चुनौती दें। परखें कि यह क्या पकड़ता है, कहाँ असली कमियां हैं, और असली व नकली संदेशों में कितना सही अंतर करता है।',
      disclaimer:
        'यह बंडल किए गए प्रोटोटाइप टेस्ट सेट का परिणाम है — वास्तविक दुनिया की सटीकता का दावा नहीं।',
      runAllBtn: 'सभी टेस्ट चलाएं',
      runScamBtn: 'ठगी टेस्ट चलाएं',
      runGenuineBtn: 'सही संदेश टेस्ट चलाएं',
      resetBtn: 'रीसेट करें',
      runSingleBtn: 'टेस्ट चलाएं',
      searchPlaceholder: 'नाम, संदेश या टैग से खोजें...',
      metricsHeading: 'कन्फ्यूज़न मैट्रिक्स और प्रदर्शन माप',
      expectedCol: 'अपेक्षित',
      actualCol: 'वास्तविक',
      scoreCol: 'स्कोर',
      statusCol: 'स्थिति',
      pass: 'PASS',
      fail: 'FAIL',
      notRun: 'नहीं चलाया',
      running: 'स्कैन हो रहा है',
      traceToggle: 'रूल ट्रेस',
      copyJsonBtn: 'JSON कॉपी करें',
      copiedJson: 'कॉपी हो गया!',
      failedDiagTitle: 'असफल टेस्ट विवरण (वास्तविक कमी)',
      impactLabel: 'संभावित वास्तविक नुकसान',
      candidateSuggestionLabel: 'जुड़ा हुआ प्रस्तावित सुधार',
      openCandidatesBtn: 'Candidate Rules देखें',
      rawJsonToggle: 'तकनीकी JSON',
      triggeredRules: 'लागू हुए नियम',
      suppressedRules: 'रोके गए नियम',
      notRunYet: 'लाइव परिणाम देखने के लिए ऊपर कोई रन बटन दबाएं।',
      emptyFilter: 'चुने गए फ़िल्टर या खोज से कोई टेस्ट केस नहीं मिला।',
      scannerStandby: 'स्कैनर तैयार · लाइव नियम जाँच',
      scannerRunning: 'बंडल किए गए टेस्ट केस जाँचे जा रहे हैं...',
    },
    rulebook: {
      title: 'पहचान नियम पुस्तिका और अंतराल पारदर्शिता',
      subtitle:
        'मूल नियमों (Original), नए जोड़े गए सक्रिय नियमों (Newly Added), प्रस्तावित नियमों (Candidate) और सहमति से मिले पैटर्न को देखें।',
      counts: {
        original: 'मूल नियम (Original)',
        newlyAdded: 'नए जोड़े गए सक्रिय नियम',
        candidates: 'प्रस्तावित नियम (निष्क्रिय)',
        totalActive: 'कुल सक्रिय नियम',
      },
      tabs: {
        original: 'मूल नियम (Original Rules)',
        newlyAdded: 'नए जोड़े गए नियम',
        candidates: 'प्रस्तावित नियम (Candidate)',
      },
      searchPlaceholder: 'ID, शब्द, श्रेणी या विवरण से नियम खोजें...',
      allCategories: 'सभी श्रेणियाँ',
      statusOriginal: 'मूल नियम · सक्रिय',
      statusNewlyAdded: 'नया जोड़ा गया · सक्रिय',
      whatDetects: 'यह क्या पकड़ता है',
      whyMatters: 'सुझाया गया बचाव और कदम',
      whyAdded: 'क्यों जोड़ा गया',
      scamTypeCovered: 'किस ठगी को पकड़ता है',
      triggerExample: 'उदाहरण संदेश / पैटर्न',
      strengthensContext: 'मजबूत करने वाला संदर्भ',
      suppressesContext: 'संदर्भ और गलत-अलार्म सुरक्षा',
      scoreWeight: 'स्कोर योगदान',
      groupCap: 'समूह सीमा (Cap)',
      languagesLabel: 'भाषाएं',
      sourceAttribution: 'आधिकारिक स्रोत संदर्भ',
      pipelineTitle: 'नियम सुधार प्रक्रिया (Pipeline)',
      pipelineSteps: [
        'User Feedback',
        'Consent',
        'Sanitized Pattern',
        'Test Case',
        'Candidate Rule',
        'Validation',
        'Approval',
        'Active Rule',
      ],
      candidateIntroNote:
        'प्रस्तावित नियम अभी सक्रिय इंजन में लागू नहीं हैं। मानवीय समीक्षा और परीक्षण से पहले यह उत्पादन स्कोर नहीं बदलते।',
      selectCandidatesLabel: 'सैंडबॉक्स में जाँचने के लिए प्रस्तावित नियम चुनें',
      runSandboxBtn: 'सैंडबॉक्स सत्यापन चलाएं',
      beforeLabel: 'वर्तमान सक्रिय इंजन',
      afterLabel: 'चयनित प्रस्तावित नियमों के साथ (केवल सैंडबॉक्स)',
      improvedLabel: 'नए पकड़े गए / सुधरे',
      regressedLabel: 'बिगड़े टेस्ट (Regressions)',
      noAutoPromoteNote:
        'केवल सैंडबॉक्स प्रीव्यू — प्रस्तावित नियम उत्पादन Analyzer स्कोर नहीं बदलते।',
      contributedTitle: 'User-Contributed Patterns',
      contributedSubtitle:
        'केवल स्पष्ट सहमति और प्रीव्यू पुष्टि के बाद इसी सत्र में जोड़े गए गुमनाम पैटर्न। पेज रीलोड पर हट जाते हैं।',
      contributedEmptyTitle: 'इस सत्र में अभी कोई पैटर्न योगदान नहीं हुआ है',
      contributedEmptyBody:
        'पैटर्न तभी दिखते हैं जब उपयोगकर्ता Analyzer में संदेश जाँचे, वैकल्पिक प्रतिक्रिया दे, और गुमनाम पैटर्न जोड़ने की स्पष्ट सहमति और पुष्टि करे।',
      contributedEmptyCta: 'Analyzer पर जाएं',
      officialResourcesTitle: 'आधिकारिक स्रोत एवं रिपोर्टिंग पोर्टल (भारत)',
    },
    footer: {
      tagline: 'CyberSuraksha · क्लिक करने से पहले जाल को पहचानें।',
      privacy: '100% ब्राउज़र में जाँच · केवल सत्र मेमोरी · कोई अपलोड या स्टोरेज नहीं।',
      limitation: 'प्रोटोटाइप टूल — भेजने वाले की पहचान या लाइव वेबसाइट सत्यापित नहीं करता।',
      reporting: 'वित्तीय ठगी की रिपोर्ट: 1930 पर कॉल करें या cybercrime.gov.in देखें',
    },
  },
  hinglish: {
    nav: {
      analyze: 'Analyze',
      redTeam: 'Red-Team Lab',
      rulebook: 'Detection Rulebook',
    },
    hero: {
      kicker: 'Universal Scam, Phishing & Fake Offer Intelligence · India',
      headline: 'See the trap before you tap.',
      subtitle:
        'Suspicious SMS, WhatsApp forwards, UPI requests, job offers, courier alerts aur links ko seedhe apne browser mein check karein. Seconds mein exact evidence, cross-signals aur safe steps samjhein.',
      ctaAnalyze: 'Analyze a Message',
      ctaLab: 'Run Red-Team Lab',
      trustItems: [
        '100% browser-local',
        'Zero message uploads',
        'Deterministic rule engine',
        'Explainable evidence',
      ],
      shieldTitle: 'Local Explainable Engine',
      shieldSub: 'Deterministic · Zero AI API · Zero Network',
      layers: [
        '01. Multilingual Normalizer (EN / HI / Hinglish)',
        '02. Contextual Rules + Negation Guard',
        '03. Cross-Signal + Static PSL URL Anatomy',
      ],
      journeySteps: ['Paste', 'Inspect Evidence', 'Verify Safely', 'Optional Feedback'],
    },
    analyzer: {
      inputHeading: 'Universal Message & URL Analyzer',
      inputHelper:
        'SMS · WhatsApp · Email · Bank alerts · UPI · Job offers · Courier · English / Hindi / Hinglish',
      placeholder:
        'Yahan koi suspicious SMS, WhatsApp forward, UPI payment request, job offer ya link paste karein...',
      analyzeBtn: 'Analyze Message',
      analyzingBtn: 'Scanning locally...',
      scanningHeadline: 'Local deterministic scan chal raha hai...',
      scanningSub:
        'Evasion patterns normalize karke active contextual rules, static URL anatomy aur false-positive guards check ho rahe hain.',
      clearBtn: 'Clear',
      charCount: 'characters',
      privacyNotice: 'Analysis sirf browser memory mein hota hai. Kuch upload ya save nahi hota.',
      examplesHeading: 'Live engine test karne ke liye sample select karein',
      emptyTitle: 'Suspicious message ya link inspect karne ke liye ready',
      emptyDesc:
        'Upar text paste karein ya koi sample choose karein—hum highlighted phrases, Cross-Signal Intelligence, URL anatomy aur Trust Boundaries dikhayenge.',
      scoreLabel: 'Heuristic Severity Score',
      heuristicNote:
        'Prototype heuristic severity indicator (0–100), fraud probability ya official RBI score nahi.',
      categoryLabel: 'Primary Pattern',
      analyzedIn: 'Locally analyzed in',
      highlightedHeading: 'Original Message & Highlighted Phrases',
      evidenceHeading: 'Detected Evidence Cards',
      noEvidence: 'Is message mein koi strong scam rule indicator match nahi hua.',
      techDetails: 'Technical details',
      recommendedNext: 'Recommended action',
      suppressedHeading: 'False-Positive Protection (Suppressed Matches)',
      suppressedDesc:
        'Yeh phrases safety warnings, negation ya official-app context mein the, isliye score nahi badhaya gaya.',
      prototypeBadge: 'Prototype pattern — cited official advisory mein direct specified nahi.',
      officialBadge: 'Aligned with cited official advisory',
      crossSignalHeading: 'Cross-Signal Intelligence',
      crossSignalSub:
        'Independent risk signals ko jodne wala multi-step scam pattern detector.',
      urlHeading: 'Static URL Deception Visualizer',
      urlSafetyNote:
        'Sirf static-string parsing. CyberSuraksha kabhi links open ya fetch nahi karta.',
      protocolLabel: 'Protocol',
      subdomainLabel: 'Subdomain',
      registrableDomainLabel: 'Registrable Domain',
      pathLabel: 'Path & Query',
      entitiesHeading: 'Extracted Entities',
      entitiesNote:
        'Sirf phone numbers, UPI IDs, amounts ya emails hone se risk score nahi badhta.',
      trustHeading: 'Trust Boundaries',
      detectedCol: 'CyberSuraksha ne kya detect kiya',
      unverifiedCol: 'Kya verify nahi ho sakta',
      actionsCol: 'Aapko kya karna chahiye',
      resourcesHeading: 'Official Indian Cyber Safety Verification Resources',
      lostMoneyPriority:
        'Agar paise cut chuke hain, turant bank ko call karein aur National Cyber Helpline 1930 par report karein.',
    },
    feedback: {
      heading: 'Optional Session Feedback',
      sessionNotice: 'Unverified feedback · Browser memory only · Reload par clear ho jayega',
      question: 'Kya aapko pata hai ki yeh message actually scam tha?',
      scamBtn: 'It was a Scam',
      legitBtn: 'It was Legit',
      unsureBtn: "I'm Unsure",
      dismissBtn: 'Dismiss',
      unverifiedNote:
        'Note: User feedback unverified hota hai aur active rules ko automatically change nahi karta.',
      consentQuestion:
        'Kya aap CyberSuraksha ke detection rules improve karne ke liye anonymized pattern contribute karna chahenge?',
      yesContributeBtn: 'Yes, contribute pattern',
      noPrivateBtn: 'No, keep my feedback private',
      privateConfirmed:
        'Aapka feedback private rakha gaya hai. Rulebook ya candidates mein kuch add nahi hua.',
      previewTitle: 'Sanitized Pattern Preview (Original Message Save Nahi Hoga)',
      previewSubtitle:
        'Names, phone numbers, UPI IDs, accounts, amounts aur unique links locally remove kar diye gaye hain. Confirm karne se pehle check karein:',
      sanitizedLabel: 'Sanitized pattern',
      generalizedLabel: 'Generalized pattern tokens',
      copySanitizedBtn: 'Copy Sanitized',
      copiedFeedback: 'Copied!',
      confirmAddBtn: 'Confirm & Add Pattern',
      cancelBtn: 'Cancel',
      addedSuccess:
        'Anonymized pattern is session ke User-Contributed Patterns mein add kar diya gaya.',
      viewRulebookBtn: 'Detection Rulebook mein dekhein',
    },
    severity: {
      low: 'Low Indicators',
      caution: 'Caution',
      high: 'High Risk',
      critical: 'Critical',
    },
    verdict: {
      suspicious: {
        title: 'Suspicious indicators detected',
        subtitle:
          'Multiple risk signals mile hain. Click ya pay karne se pehle official channel se verify karein.',
      },
      no_strong_indicators: {
        title: 'No strong indicators detected',
        subtitle:
          'Local rules mein strong scam signals nahi mile, par iska matlab safe hona nahi hota.',
      },
      insufficient_evidence: {
        title: 'Insufficient evidence',
        subtitle: 'Message bahut chhota hai ya reliable evaluation ke liye context kam hai.',
      },
    },
    redTeam: {
      title: 'Red-Team Validation Lab',
      subtitle:
        'Live production detection engine ko challenge karein. Dekhein engine kya pakadta hai, kahan real gaps hain, aur genuine vs scam ko kaise alag karta hai.',
      disclaimer:
        'Performance on bundled prototype test set — not real-world detection accuracy.',
      runAllBtn: 'Run All Tests',
      runScamBtn: 'Run Scam Tests',
      runGenuineBtn: 'Run Genuine Tests',
      resetBtn: 'Reset Tests',
      runSingleBtn: 'Run Test',
      searchPlaceholder: 'Title, message ya tag se search karein...',
      metricsHeading: 'Confusion Matrix & Performance Metrics',
      expectedCol: 'Expected',
      actualCol: 'Actual',
      scoreCol: 'Score',
      statusCol: 'Status',
      pass: 'PASS',
      fail: 'FAIL',
      notRun: 'NOT RUN',
      running: 'SCANNING',
      traceToggle: 'Rule Trace',
      copyJsonBtn: 'Copy JSON',
      copiedJson: 'Copied!',
      failedDiagTitle: 'Failure Diagnostic (Real Engine Gap)',
      impactLabel: 'Potential impact',
      candidateSuggestionLabel: 'Linked candidate improvement',
      openCandidatesBtn: 'Inspect Candidate Rules',
      rawJsonToggle: 'Technical JSON',
      triggeredRules: 'Triggered Rules',
      suppressedRules: 'Suppressed Rules',
      notRunYet: 'Live results dekhne ke liye upar kisi bhi Run button par click karein.',
      emptyFilter: 'Selected filter ya search se koi test case match nahi hua.',
      scannerStandby: 'Scanner Ready · Live Production Execution',
      scannerRunning: 'Bundled test vectors scan ho rahe hain...',
    },
    rulebook: {
      title: 'Detection Rulebook & Gap Transparency',
      subtitle:
        'Original Rules, Newly Added production rules, inactive Candidate Rules aur consented User-Contributed Patterns dekhein.',
      counts: {
        original: 'Original Rules',
        newlyAdded: 'Newly Added Active Rules',
        candidates: 'Candidate Rules (Inactive)',
        totalActive: 'Total Active Rules',
      },
      tabs: {
        original: 'Original Rules',
        newlyAdded: 'Newly Added Rules',
        candidates: 'Candidate Rules',
      },
      searchPlaceholder: 'ID, keyword, category ya explanation se search karein...',
      allCategories: 'All Categories',
      statusOriginal: 'Original · Active',
      statusNewlyAdded: 'Newly Added · Active',
      whatDetects: 'Yeh kya detect karta hai',
      whyMatters: 'Recommended safeguard & action',
      whyAdded: 'Yeh kyun add kiya gaya',
      scamTypeCovered: 'Scam type covered',
      triggerExample: 'Example message / pattern',
      strengthensContext: 'Strengthening context',
      suppressesContext: 'Context & false-positive safeguards',
      scoreWeight: 'Score contribution',
      groupCap: 'Group cap',
      languagesLabel: 'Languages',
      sourceAttribution: 'Official advisory reference',
      pipelineTitle: 'Rule Improvement Pipeline',
      pipelineSteps: [
        'User Feedback',
        'Consent',
        'Sanitized Pattern',
        'Test Case',
        'Candidate Rule',
        'Validation',
        'Approval',
        'Active Rule',
      ],
      candidateIntroNote:
        'Candidate rules proposed patterns hain jo abhi production analyzer mein active nahi hain aur live score nahi badalte.',
      selectCandidatesLabel: 'Sandbox mein test karne ke liye candidate rules chunein',
      runSandboxBtn: 'Run Sandbox Validation',
      beforeLabel: 'Production Baseline (Active Rules)',
      afterLabel: 'With Selected Candidates (Sandbox Only)',
      improvedLabel: 'Newly Caught / Fixed',
      regressedLabel: 'Regressions',
      noAutoPromoteNote:
        'Sirf sandbox preview hai — candidate rules production Analyzer scores par asar nahi dalte.',
      contributedTitle: 'User-Contributed Patterns',
      contributedSubtitle:
        'Explicit user consent aur preview confirm ke baad is session mein add hue anonymized patterns. Reload par clear ho jate hain.',
      contributedEmptyTitle: 'Is session mein abhi tak koi pattern contribute nahi hua',
      contributedEmptyBody:
        'Patterns tabhi dikhte hain jab user Analyzer mein feedback de, anonymized pattern contribute karne ka explicit consent de, aur sanitized preview confirm kare.',
      contributedEmptyCta: 'Go to Analyzer',
      officialResourcesTitle: 'Official Advisory & Reporting References (India)',
    },
    footer: {
      tagline: 'CyberSuraksha · See the trap before you tap.',
      privacy: '100% browser-local analysis · In-memory session only · Zero uploads or storage.',
      limitation:
        'Prototype heuristic tool — sender identity ya live site reputation verify nahi karta.',
      reporting: 'Financial fraud report: 1930 par call karein ya cybercrime.gov.in dekhein',
    },
  },
};
