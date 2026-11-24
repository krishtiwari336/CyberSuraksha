import { useState } from 'react';
import { Eye, GlobeLock } from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { Language, UrlAnalysisResult } from '../types/analysis';

interface UrlVisualizerProps {
  urls: UrlAnalysisResult[];
  language: Language;
}

export function UrlVisualizer({ urls, language }: UrlVisualizerProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  if (urls.length === 0) return null;

  const t = UI_STRINGS[language].analyzer;
  const safeIdx = Math.min(selectedIdx, urls.length - 1);
  const current = urls[safeIdx];

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <GlobeLock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="text-base font-display font-bold text-slate-900">{t.urlHeading}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{t.urlSafetyNote}</p>
          </div>
        </div>

        {urls.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Detected URLs">
            {urls.map((u, idx) => (
              <button
                key={u.raw + idx}
                type="button"
                role="tab"
                aria-selected={idx === safeIdx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md border cursor-pointer transition-colors ${
                  idx === safeIdx
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                URL {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Domain Boundary Visual Bar */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-1 font-mono text-sm">
          <span className="px-2 py-1 rounded bg-slate-200/80 text-slate-700">
            {current.protocol.toLowerCase().startsWith('http')
              ? `${current.protocol.toLowerCase()}://`
              : ''}
          </span>

          {current.subdomain && (
            <>
              <span
                className={`px-2 py-1 rounded border ${
                  current.impersonatedBrand
                    ? 'bg-amber-100 text-amber-950 border-amber-400 font-semibold'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {current.subdomain}
              </span>
              <span className="text-slate-400">.</span>
            </>
          )}

          <span className="px-2.5 py-1 rounded bg-teal-900 text-white font-semibold border border-teal-950">
            {current.registrableDomain ?? current.hostname}
          </span>

          {current.path && current.path !== '/' && (
            <span className="px-2 py-1 rounded bg-slate-200/70 text-slate-700">
              {current.path}
              {current.query}
            </span>
          )}
        </div>

        {/* 4-column structured breakdown */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-md border border-slate-200 bg-white p-2.5">
            <span className="text-slate-500 block">{t.protocolLabel}</span>
            <span className="mt-0.5 font-mono font-semibold text-slate-900 block">
              {current.protocol}
            </span>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-2.5">
            <span className="text-slate-500 block">{t.subdomainLabel}</span>
            <span
              className={`mt-0.5 font-mono font-semibold block break-all ${
                current.impersonatedBrand ? 'text-amber-800' : 'text-slate-900'
              }`}
            >
              {current.subdomain ?? '—'}
            </span>
          </div>

          <div className="rounded-md border border-teal-300 bg-teal-50/70 p-2.5">
            <span className="text-teal-800 font-medium block">
              {t.registrableDomainLabel}
            </span>
            <span className="mt-0.5 font-mono font-bold text-teal-950 block break-all">
              {current.registrableDomain ?? current.hostname}
            </span>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-2.5">
            <span className="text-slate-500 block">{t.pathLabel}</span>
            <span className="mt-0.5 font-mono font-semibold text-slate-900 block break-all">
              {current.path}
              {current.query}
            </span>
          </div>
        </div>
      </div>

      {/* Plain-language URL explanation */}
      <div className="mt-3 flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
        <Eye className="w-4 h-4 text-slate-500 shrink-0 mt-1" aria-hidden="true" />
        <p>{current.deceptionExplanation[language]}</p>
      </div>

      {/* URL Signals List */}
      {current.signals.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          {current.signals.map((sig, i) => (
            <li key={`${sig.type}-${i}`} className="flex items-baseline justify-between gap-2">
              <span>
                <strong className="text-slate-800">{sig.label[language]}:</strong>{' '}
                {sig.detail[language]}
              </span>
              <span className="font-mono tabular-nums text-slate-500 shrink-0">
                {sig.weight > 0 ? `+${sig.weight}` : 'info'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
