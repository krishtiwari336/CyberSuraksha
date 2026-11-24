import { ReactNode } from 'react';
import {
  AtSign,
  Building2,
  CreditCard,
  IndianRupee,
  KeyRound,
  Landmark,
  Link2,
  Mail,
  Phone,
  Smartphone,
  Tags,
} from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { ExtractedEntities, Language } from '../types/analysis';

interface EntityPanelProps {
  entities: ExtractedEntities;
  language: Language;
}

const GROUP_META: Record<
  string,
  { labels: Record<Language, string>; icon: ReactNode }
> = {
  phones: {
    labels: { en: 'Phone Numbers', hi: 'फ़ोन नंबर', hinglish: 'Phone Numbers' },
    icon: <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  urls: {
    labels: { en: 'URLs', hi: 'लिंक (URLs)', hinglish: 'URLs / Links' },
    icon: <Link2 className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  upi: {
    labels: { en: 'UPI IDs', hi: 'UPI आईडी', hinglish: 'UPI IDs' },
    icon: <AtSign className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  emails: {
    labels: { en: 'Emails', hi: 'ईमेल', hinglish: 'Emails' },
    icon: <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  amounts: {
    labels: { en: 'Amounts', hi: 'रकम', hinglish: 'Amounts' },
    icon: <IndianRupee className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  paymentTerms: {
    labels: { en: 'Payment Terms', hi: 'पेमेंट शब्द', hinglish: 'Payment Terms' },
    icon: <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  credentials: {
    labels: { en: 'Credentials', hi: 'गुप्त शब्द', hinglish: 'Credential Terms' },
    icon: <KeyRound className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  remoteAccess: {
    labels: { en: 'Remote Access Apps', hi: 'रिमोट एक्सेस ऐप', hinglish: 'Remote Access' },
    icon: <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  appInstall: {
    labels: { en: 'App / APK', hi: 'ऐप / APK', hinglish: 'App / APK' },
    icon: <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  banks: {
    labels: { en: 'Banks', hi: 'बैंक के नाम', hinglish: 'Banks' },
    icon: <Landmark className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
  brands: {
    labels: { en: 'Brands', hi: 'ब्रांड के नाम', hinglish: 'Brands' },
    icon: <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
  },
};

export function EntityPanel({ entities, language }: EntityPanelProps) {
  const t = UI_STRINGS[language].analyzer;

  const groups: Array<{ key: string; items: string[] }> = [
    { key: 'phones', items: entities.phoneNumbers },
    { key: 'urls', items: entities.urls },
    { key: 'upi', items: entities.upiIds },
    { key: 'emails', items: entities.emailAddresses },
    { key: 'amounts', items: entities.currencyAmounts },
    { key: 'paymentTerms', items: entities.paymentTerms },
    { key: 'credentials', items: entities.credentialTerms },
    { key: 'remoteAccess', items: entities.remoteAccessRequests },
    { key: 'appInstall', items: entities.appInstallRequests },
    { key: 'banks', items: entities.bankNames },
    { key: 'brands', items: entities.brandNames },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-2.5 mb-3">
        <Tags className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-base font-display font-bold text-slate-900">
            {t.entitiesHeading}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.entitiesNote}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((group) => {
          const meta = GROUP_META[group.key];
          return (
            <div
              key={group.key}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                {meta.icon}
                <span>{meta.labels[language]}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, idx) => (
                  <span
                    key={`${group.key}-${idx}`}
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 break-all"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
