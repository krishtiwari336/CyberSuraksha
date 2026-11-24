import logoImg from '../assets/cybersuraksha-logo.png';
import { UI_STRINGS } from '../i18n/translations';
import { Language } from '../types/analysis';

export type PageTab = 'analyze' | 'redteam' | 'rulebook';

interface HeaderProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

export function Header({
  activeTab,
  onSelectTab,
  language,
  onChangeLanguage,
}: HeaderProps) {
  const t = UI_STRINGS[language];

  const navItems: Array<{ id: PageTab; label: string }> = [
    { id: 'analyze', label: t.nav.analyze },
    { id: 'redteam', label: t.nav.redTeam },
    { id: 'rulebook', label: t.nav.rulebook },
  ];

  const langOptions: Array<{ id: Language; label: string }> = [
    { id: 'en', label: 'EN' },
    { id: 'hi', label: 'हिंदी' },
    { id: 'hinglish', label: 'Hinglish' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Official User-Provided Logo + Single-line Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('analyze')}
          className="flex items-center gap-2.5 text-slate-900 font-display font-bold text-lg tracking-tight whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 rounded-lg pr-1 transition-opacity hover:opacity-90"
        >
          <img
            src={logoImg}
            alt="CyberSuraksha official logo"
            className="h-9 w-9 object-contain rounded-full shrink-0"
          />
          <span>CyberSuraksha</span>
        </button>

        {/* Zone 2: Clean single-line typography navigation (3 core tabs) */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-2 whitespace-nowrap shrink-0 border-b-2 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 rounded-t ${
                  isActive
                    ? 'border-teal-600 text-teal-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Selector control */}
        <div
          role="group"
          aria-label="Interface language"
          className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0"
        >
          {langOptions.map((opt) => {
            const active = language === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeLanguage(opt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile navigation row */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden border-t border-slate-200 bg-slate-50 px-3 py-1.5 flex items-center gap-2 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
