import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { Language, TrustBoundaries } from '../types/analysis';

interface SafetyActionsProps {
  trustBoundaries: TrustBoundaries;
  language: Language;
}

const RESOURCE_COPY: Record<
  Language,
  {
    helplineTitle: string;
    helplineDesc: string;
    chakshuTitle: string;
    chakshuDesc: string;
    suspectTitle: string;
    suspectDesc: string;
    suspectLink: string;
  }
> = {
  en: {
    helplineTitle: 'Helpline 1930 & I4C Portal',
    helplineDesc:
      'Report financial cyber fraud immediately if money was debited or UPI/bank fraud occurred.',
    chakshuTitle: 'Sanchar Saathi / Chakshu (DoT)',
    chakshuDesc:
      'Report suspected fraud calls, SMS, and WhatsApp messages before losing money.',
    suspectTitle: 'Report Suspect (I4C)',
    suspectDesc:
      'Submit suspicious phone numbers, URLs, UPI IDs, or handles to the national suspect repository.',
    suspectLink: 'Report Suspect Webform',
  },
  hi: {
    helplineTitle: 'हेल्पलाइन 1930 और I4C पोर्टल',
    helplineDesc:
      'अगर पैसे कट चुके हैं या बैंक/UPI ठगी हुई है, तो तुरंत वित्तीय साइबर धोखाधड़ी की रिपोर्ट करें।',
    chakshuTitle: 'संचार साथी / चक्षु (DoT)',
    chakshuDesc:
      'पैसे कटने से पहले संदिग्ध फ्रॉड कॉल, SMS और व्हाट्सएप मैसेज की रिपोर्ट करें।',
    suspectTitle: 'संदिग्ध रिपोर्ट करें (I4C)',
    suspectDesc:
      'ठगी से जुड़े संदिग्ध मोबाइल नंबर, वेबसाइट लिंक, UPI ID या अकाउंट पोर्टल पर दर्ज करें।',
    suspectLink: 'संदिग्ध रिपोर्ट वेबफॉर्म',
  },
  hinglish: {
    helplineTitle: 'Helpline 1930 & I4C Portal',
    helplineDesc:
      'Agar paise cut gaye hain ya UPI/bank fraud hua hai, toh turant financial cyber fraud report karein.',
    chakshuTitle: 'Sanchar Saathi / Chakshu (DoT)',
    chakshuDesc:
      'Paise katne se pehle suspicious fraud calls, SMS aur WhatsApp messages report karein.',
    suspectTitle: 'Report Suspect (I4C)',
    suspectDesc:
      'Suspicious phone numbers, URLs, UPI IDs ya handles ko national suspect database par report karein.',
    suspectLink: 'Report Suspect Webform',
  },
};

export function SafetyActions({ trustBoundaries, language }: SafetyActionsProps) {
  const t = UI_STRINGS[language].analyzer;
  const rc = RESOURCE_COPY[language];

  return (
    <div className="space-y-5">
      {/* Trust Boundaries 3-column grid */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-display font-bold text-slate-900 mb-4">{t.trustHeading}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>{t.detectedCol}</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-4">
              {trustBoundaries.whatWasDetected.map((item, idx) => (
                <li key={idx}>{item[language]}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2.5">
              <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
              <span>{t.unverifiedCol}</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-4">
              {trustBoundaries.whatCannotBeVerified.map((item, idx) => (
                <li key={idx}>{item[language]}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-950 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <span>{t.actionsCol}</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800 list-disc pl-4">
              {trustBoundaries.whatUserShouldDo.map((item, idx) => (
                <li key={idx}>{item[language]}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Official Indian Cyber Safety Resources */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-2.5 mb-3">
          <PhoneCall className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="text-base font-display font-bold text-slate-900">
              {t.resourcesHeading}
            </h3>
            <p className="text-xs sm:text-sm text-red-800 font-medium mt-1">
              {t.lostMoneyPriority}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white transition-all p-4">
            <div className="font-semibold text-slate-900">{rc.helplineTitle}</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rc.helplineDesc}</p>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white transition-all p-4">
            <div className="font-semibold text-slate-900">{rc.chakshuTitle}</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rc.chakshuDesc}</p>
            <a
              href="https://sancharsaathi.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              <span>sancharsaathi.gov.in</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white transition-all p-4">
            <div className="font-semibold text-slate-900">{rc.suspectTitle}</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rc.suspectDesc}</p>
            <a
              href="https://cybercrime.gov.in/Webform/cyber_suspect.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              <span>{rc.suspectLink}</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
