import { useEffect, useState } from 'react';
import logoImg from './assets/cybersuraksha-logo.png';
import { Header, PageTab } from './components/Header';
import { buildDraftCandidateFromContribution } from './engine/sanitizer';
import { UI_STRINGS } from './i18n/translations';
import { AnalyzePage } from './pages/AnalyzePage';
import { RedTeamPage } from './pages/RedTeamPage';
import { RulebookPage, RulebookSubTab } from './pages/RulebookPage';
import {
  CandidateRule,
  Language,
  TestCase,
  UserContributedPattern,
} from './types/analysis';

const VALID_TABS: PageTab[] = ['analyze', 'redteam', 'rulebook'];

function readTabFromHash(): PageTab {
  if (typeof window === 'undefined') return 'analyze';
  const raw = window.location.hash.replace(/^#/, '') as PageTab;
  return VALID_TABS.includes(raw) ? raw : 'analyze';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>(() => readTabFromHash());
  const [rulebookTab, setRulebookTab] = useState<RulebookSubTab>('original');
  const [language, setLanguage] = useState<Language>('en');

  // Strictly session-only in-memory state (zero localStorage/sessionStorage/backend)
  const [contributedPatterns, setContributedPatterns] = useState<UserContributedPattern[]>([]);
  const [sessionCandidates, setSessionCandidates] = useState<CandidateRule[]>([]);
  const [sessionTestCases, setSessionTestCases] = useState<TestCase[]>([]);
  const [validatedCandidateIds, setValidatedCandidateIds] = useState<Record<string, boolean>>({});

  const footerCopy = UI_STRINGS[language].footer;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      setActiveTab(readTabFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectTab = (tab: PageTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetHash = `#${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContributePattern = (record: UserContributedPattern) => {
    setContributedPatterns((prev) => [record, ...prev]);
  };

  const handleCreateCandidateFromContribution = (contribId: string) => {
    const target = contributedPatterns.find((c) => c.id === contribId);
    if (!target || target.candidateImprovementId) return;

    const draftCandidate = buildDraftCandidateFromContribution(target);
    setSessionCandidates((prev) => [...prev, draftCandidate]);
    setContributedPatterns((prev) =>
      prev.map((c) =>
        c.id === contribId
          ? {
              ...c,
              candidateImprovementId: draftCandidate.id,
              currentStatus: 'candidate',
            }
          : c
      )
    );
  };

  const handleAddSessionTestCase = (contribId: string) => {
    const target = contributedPatterns.find((c) => c.id === contribId);
    if (!target || target.addedAsSessionTestCase) return;

    const tcId = `TC-USR-${String(sessionTestCases.length + 1).padStart(2, '0')}`;
    const expectedSuspicious = target.feedbackType === 'scam';
    const newCase: TestCase = {
      id: tcId,
      title: `Session Contributed Pattern (${target.id})`,
      description: `Anonymized user-contributed pattern (${target.coverageStatus})`,
      input: target.sanitizedPattern,
      expectedSuspicious,
      expectedVerdict: expectedSuspicious ? 'suspicious' : 'no_strong_indicators',
      expectedCategory:
        expectedSuspicious && target.analyzerCategory !== 'no_strong_indicators'
          ? target.analyzerCategory
          : expectedSuspicious
          ? 'generic_mixed'
          : 'no_strong_indicators',
      minExpectedScore: expectedSuspicious ? 40 : 0,
      maxExpectedScore: expectedSuspicious ? 100 : 39,
      tags: ['session-contributed'],
      isBaseline: false,
    };

    setSessionTestCases((prev) => [...prev, newCase]);
    setContributedPatterns((prev) =>
      prev.map((c) =>
        c.id === contribId
          ? {
              ...c,
              addedAsSessionTestCase: true,
              sessionTestCaseId: tcId,
            }
          : c
      )
    );
  };

  const handleMarkCandidatesValidated = (candidateIds: string[]) => {
    setValidatedCandidateIds((prev) => {
      const next = { ...prev };
      for (const id of candidateIds) {
        next[id] = true;
      }
      return next;
    });

    setContributedPatterns((prev) =>
      prev.map((c) =>
        c.candidateImprovementId && candidateIds.includes(c.candidateImprovementId)
          ? { ...c, currentStatus: 'under_validation' }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        language={language}
        onChangeLanguage={setLanguage}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'analyze' && (
          <AnalyzePage
            language={language}
            nextContributionNumber={contributedPatterns.length + 1}
            onContributePattern={handleContributePattern}
            onOpenLab={() => handleSelectTab('redteam')}
            onOpenRulebook={() => {
              setRulebookTab('newly_added');
              handleSelectTab('rulebook');
            }}
          />
        )}
        {activeTab === 'redteam' && (
          <RedTeamPage
            language={language}
            sessionTestCases={sessionTestCases}
            onOpenCandidates={() => {
              setRulebookTab('candidates');
              handleSelectTab('rulebook');
            }}
          />
        )}
        {activeTab === 'rulebook' && (
          <RulebookPage
            language={language}
            activeSubTab={rulebookTab}
            onChangeSubTab={setRulebookTab}
            contributedPatterns={contributedPatterns}
            sessionCandidates={sessionCandidates}
            sessionTestCases={sessionTestCases}
            validatedCandidateIds={validatedCandidateIds}
            onCreateCandidateFromContribution={handleCreateCandidateFromContribution}
            onAddSessionTestCase={handleAddSessionTestCase}
            onMarkCandidatesValidated={handleMarkCandidatesValidated}
            onGoToAnalyzer={() => handleSelectTab('analyze')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-sm">
              <img
                src={logoImg}
                alt="CyberSuraksha official logo"
                className="h-8 w-8 object-contain rounded-full shrink-0"
              />
              <span>{footerCopy.tagline}</span>
            </div>
            <p className="text-slate-600">{footerCopy.privacy}</p>
          </div>

          <div className="md:border-l md:border-slate-200 md:pl-4 flex items-center">
            <p className="leading-relaxed">{footerCopy.limitation}</p>
          </div>

          <div className="md:border-l md:border-slate-200 md:pl-4 flex flex-col justify-center md:items-end gap-1">
            <p className="font-semibold text-red-700">{footerCopy.reporting}</p>
            <p className="text-[11px] text-slate-500">
              Official portals: cybercrime.gov.in · sancharsaathi.gov.in
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
