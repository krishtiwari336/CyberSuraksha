import { RefObject } from 'react';
import { Lock, Search, Trash2 } from 'lucide-react';
import { UI_STRINGS } from '../i18n/translations';
import { Language } from '../types/analysis';

export interface SampleMessage {
  id: string;
  label: { en: string; hi: string; hinglish: string };
  text: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: 'kyc',
    label: {
      en: 'Fake Bank KYC',
      hi: 'नकली बैंक KYC',
      hinglish: 'Fake Bank KYC',
    },
    text: 'Dear customer, your bank account will be blocked today. Complete KYC immediately and share your OTP.',
  },
  {
    id: 'job',
    label: {
      en: 'Job Scam',
      hi: 'नौकरी फीस ठगी',
      hinglish: 'Job Scam',
    },
    text: 'Work from home internship. Earn ₹30,000 monthly. Pay ₹799 registration fee to confirm your slot.',
  },
  {
    id: 'lottery',
    label: {
      en: 'Lottery Scam',
      hi: 'लॉटरी ठगी',
      hinglish: 'Lottery Scam',
    },
    text: 'Congratulations! You won ₹50,000. Pay ₹499 processing fee to claim your reward.',
  },
  {
    id: 'arrest',
    label: {
      en: 'Digital Arrest',
      hi: 'डिजिटल अरेस्ट',
      hinglish: 'Digital Arrest',
    },
    text: 'Your Aadhaar is linked to illegal activity. Police action is pending. Pay immediately to avoid arrest.',
  },
  {
    id: 'upi',
    label: {
      en: 'UPI Scam',
      hi: 'UPI PIN ठगी',
      hinglish: 'UPI Scam',
    },
    text: 'To receive ₹5,000 cashback, scan this QR and enter your UPI PIN.',
  },
  {
    id: 'whatsapp-hijack',
    label: {
      en: 'WhatsApp Code Hijack',
      hi: 'WhatsApp कोड ठगी',
      hinglish: 'WhatsApp Code Hijack',
    },
    text: 'Hey, I accidentally sent my 6-digit WhatsApp verification code to your number, please forward it back urgently.',
  },
  {
    id: 'genuine-awareness',
    label: {
      en: 'Genuine Awareness',
      hi: 'सही बैंक सलाह',
      hinglish: 'Genuine Awareness',
    },
    text: 'Never share your OTP or UPI PIN with anyone. Your bank will never ask you to disclose it.',
  },
  {
    id: 'genuine-courier',
    label: {
      en: 'Genuine Courier',
      hi: 'सही कूरियर सूचना',
      hinglish: 'Genuine Courier',
    },
    text: 'Your parcel is scheduled for delivery tomorrow. Please check the official courier application for updates.',
  },
  {
    id: 'url-deception',
    label: {
      en: 'URL Deception',
      hi: 'नकली लिंक जाँच',
      hinglish: 'URL Deception',
    },
    text: 'https://paypal.com.security-check.example/login',
  },
];

interface MessageInputProps {
  value: string;
  onChange: (next: string) => void;
  onAnalyze: (textOverride?: string) => void;
  onClear: () => void;
  language: Language;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function MessageInput({
  value,
  onChange,
  onAnalyze,
  onClear,
  language,
  textareaRef,
}: MessageInputProps) {
  const t = UI_STRINGS[language].analyzer;

  return (
    <section
      id="message-analyzer"
      className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
            {t.inputHeading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{t.inputHelper}</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-500">
          {value.length} {t.charCount}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={20000}
        aria-label={t.inputHeading}
        placeholder={t.placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-3 focus:ring-cyan-500/20 transition-all duration-150 resize-y"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onAnalyze()}
            disabled={value.trim().length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white text-sm font-semibold shadow-sm shadow-teal-600/25 hover:from-teal-500 hover:via-cyan-500 hover:to-teal-600 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>{t.analyzeBtn}</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={value.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200/80 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>{t.clearBtn}</span>
          </button>
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
          <span>{t.privacyNotice}</span>
        </p>
      </div>

      {/* Selectable sample messages */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-2.5">{t.examplesHeading}</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_MESSAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                onChange(sample.text);
                onAnalyze(sample.text);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:border-teal-300 hover:text-teal-900 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              {sample.label[language]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
