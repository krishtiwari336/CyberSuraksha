# CyberSuraksha — See the trap before you tap

CyberSuraksha is a privacy-first, explainable scam, phishing, and fake-offer analyzer designed for Indian smartphone users, students, families, and everyday digital payment users.

## Problem Statement

People across India receive fraudulent SMS, WhatsApp forwards, emails, job offers, and payment requests impersonating banks, couriers, employers, utilities, and government agencies. Many users struggle to see *why* a message is suspicious, *which* phrases are dangerous, and *what* steps to take next.

## Key Features

- **Universal Message Analyzer**: Inspects English, Hindi, Hinglish, obfuscated text (`O.T.P.`, `F R E E`), and URLs locally in the browser.
- **Contextual Rule Engine (32 Curated Rules)**: Detects fake KYC, OTP/PIN/CVV theft, UPI PIN/QR receive-money traps, job/internship registration fees, digital arrest threats, remote-access apps, fake courier/utility notices, and investment scams.
- **Cross-Signal Intelligence**: Correlates independent signal groups into recognized multi-step scam patterns without inflating scores via duplicate counting.
- **Negative Context & False-Positive Protection**: Distinguishes genuine bank OTP warnings, no-fee job interviews, and normal courier updates from actual scam requests.
- **Static URL Deception Visualizer**: Uses Public Suffix List-aware parsing (`tldts`) to separate subdomain from registrable domain (e.g., `paypal.com.security-check.example`) without ever opening or fetching submitted URLs.
- **Spread Awareness & Warn My Family**: Generates natural, editable Hindi, English, and bilingual safety alerts tailored to Family, Friends, or Detailed audiences.
- **Red-Team Validation Lab**: Runs 26 curated test cases through the live production engine with real Confusion Matrix metrics (TP, TN, FP, FN, Accuracy, Precision, Recall, F1) and expandable rule traces.
- **Scam Awareness Quiz**: Interactive 10-question quiz including real scam traps and legitimate notifications.
- **Official Source Registry & Reporting Guidance**: Links to RBI, CERT-In, NPCI, I4C (1930 / cybercrime.gov.in), MHA, and DoT (Sanchar Saathi / Chakshu).

## Technology Stack

- React 19 + TypeScript
- Vite + Tailwind CSS
- Lucide Icons
- `tldts` (Public Suffix List domain parser)
- Vitest (automated unit & integration testing)

## Architecture

- `src/engine/` — Pure TypeScript local detection modules (`normalizer.ts`, `urlAnalyzer.ts`, `entityExtractor.ts`, `contextAnalyzer.ts`, `rulesEngine.ts`, `crossSignalEngine.ts`, `scoringEngine.ts`, `advice.ts`, `awarenessGenerator.ts`, `classifier.ts`)
- `src/data/` — Local JSON rule definitions, Cross-Signal combinations, brand dictionary, official source registry, quiz questions, awareness templates, and Red-Team test cases
- `src/components/` & `src/pages/` — Modular UI views (`AnalyzePage`, `RedTeamPage`, `QuizPage`, `SourcesPage`)
- `tests/` — Vitest unit and integration test suites

## Privacy Model

- **100% Client-Side Execution**: All text and URL analysis runs locally in memory in your browser.
- **Zero Storage**: No `localStorage`, no `sessionStorage`, no cookies, no analytics, and no console logging of submitted user text.
- **Zero External Requests**: CyberSuraksha never opens, fetches, follows redirects, runs DNS lookups, or sends submitted messages to any AI or external API.

## Detection Methodology & Limitations

- Scores (`0–100`) are deterministic heuristic severity indicators—**not** fraud probabilities and **not** official RBI scores.
- Absence of suspicious indicators never proves a message is safe; real-world sender identity, domain reputation, and redirect destinations cannot be verified without external intelligence.
- Rules unsupported by a cited RBI/CERT-In/NPCI document are explicitly labeled `Prototype pattern — not directly specified in cited official reference.`

## Testing

Run the automated test suite:

```bash
npm test
```

Run TypeScript type-checking and production build:

```bash
npm run lint
npm run build
```

## Deployment (GitHub + Vercel)

1. Push this repository (`cybersuraksha`) to GitHub (no environment variables or secrets required).
2. In Vercel, click **Add New → Project** and import the `cybersuraksha` repository.
3. Confirm settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**.
