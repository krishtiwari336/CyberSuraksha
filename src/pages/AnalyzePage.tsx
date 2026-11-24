import { useEffect, useRef, useState } from 'react';
import { Radar, Shield } from 'lucide-react';
import { CrossSignalPanel } from '../components/CrossSignalPanel';
import { EntityPanel } from '../components/EntityPanel';
import { EvidenceCard } from '../components/EvidenceCard';
import { HeroSection } from '../components/HeroSection';
import { MessageInput } from '../components/MessageInput';
import { RiskMeter } from '../components/RiskMeter';
import { SafetyActions } from '../components/SafetyActions';
import { UrlVisualizer } from '../components/UrlVisualizer';
import { UserFeedbackPanel } from '../components/UserFeedbackPanel';
import { VerdictBadge } from '../components/VerdictBadge';
import { analyzeMessage } from '../engine/classifier';
import { UI_STRINGS } from '../i18n/translations';
import { AnalysisResult, Language, UserContributedPattern } from '../types/analysis';

interface AnalyzePageProps {
  language: Language;
  nextContributionNumber: number;
  onContributePattern: (record: UserContributedPattern) => void;
  onOpenLab: () => void;
  onOpenRulebook: () => void;
}

export function AnalyzePage({
  language,
  nextContributionNumber,
  onContributePattern,
  onOpenLab,
  onOpenRulebook,
}: AnalyzePageProps) {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const t = UI_STRINGS[language];

  useEffect(() => {
    return () => {
      if (scanTimerRef.current !== null) {
        window.clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  const handleAnalyze = (textOverride?: string) => {
    const target = typeof textOverride === 'string' ? textOverride : inputText;
    if (!target.trim()) return;

    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    const analysis = analyzeMessage(target);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setIsScanning(false);
      setResult(analysis);
      return;
    }

    setIsScanning(true);
    scanTimerRef.current = window.setTimeout(() => {
      setIsScanning(false);
      setResult(analysis);
      scanTimerRef.current = null;
    }, 300);
  };

  const handleClear = () => {
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setIsScanning(false);
    setInputText('');
    setResult(null);
  };

  const handleFocusAnalyzer = () => {
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-7">
      {/* Product Hero with Official Logo */}
      <HeroSection
        language={language}
        onFocusAnalyzer={handleFocusAnalyzer}
        onOpenLab={onOpenLab}
      />

      {/* Universal Input Card */}
      <MessageInput
        value={inputText}
        onChange={setInputText}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        language={language}
        textareaRef={textareaRef}
      />

      {/* Lightweight Local Scanning Beam Transition, Empty State, or Live Results */}
      {isScanning ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-teal-400/50 bg-slate-950 text-white p-6 overflow-hidden shadow-lg shadow-teal-950/15 cs-fade-up"
        >
          <div className="flex items-center gap-3">
            <Radar className="w-6 h-6 text-teal-300 cs-radar-sweep shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-sm sm:text-base font-display font-bold text-white">
                {t.analyzer.scanningHeadline}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{t.analyzer.scanningSub}</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-teal-500 via-cyan-300 to-teal-500 cs-beam-x" />
          </div>
        </section>
      ) : !result ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-teal-700" aria-hidden="true" />
          </div>
          <h3 className="text-base font-display font-bold text-slate-800">
            {t.analyzer.emptyTitle}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {t.analyzer.emptyDesc}
          </p>
        </section>
      ) : (
        <div key={result.originalText} className="space-y-6 cs-fade-up" aria-live="polite">
          {/* Risk Verdict & Visual Severity Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <RiskMeter result={result} language={language} />
            <VerdictBadge result={result} language={language} />
          </div>

          {/* Highlighted Suspicious Phrases & Evidence Cards */}
          <EvidenceCard result={result} language={language} />

          {/* Cross-Signal Intelligence Visualization */}
          <CrossSignalPanel crossSignals={result.crossSignals} language={language} />

          {/* Static URL Deception Visualizer */}
          <UrlVisualizer urls={result.urlAnalyses} language={language} />

          {/* Extracted Entities */}
          <EntityPanel entities={result.entities} language={language} />

          {/* Trust Boundaries & Official Indian Cyber Safety Verification Resources */}
          <SafetyActions trustBoundaries={result.trustBoundaries} language={language} />

          {/* Optional, Dismissible Session Feedback & Explicit Consent Sanitization Flow */}
          <UserFeedbackPanel
            key={result.originalText}
            analysis={result}
            language={language}
            nextContributionNumber={nextContributionNumber}
            onContributePattern={onContributePattern}
            onViewRulebook={onOpenRulebook}
          />
        </div>
      )}
    </div>
  );
}
