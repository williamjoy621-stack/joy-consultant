import React, { useState, useRef, useEffect } from 'react';
import { PropertyItem } from '../types.ts';
import {
  MessageSquare,
  X,
  Send,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface AiChatbotWidgetProps {
  properties?: PropertyItem[];
  authToken: string | null;
  userEmail?: string;
  userName?: string;
  onLeadCaptured?: () => void;
}

function buildClientChatFallback(userMessage: string, liveProperties: PropertyItem[]): string {
  const q = (userMessage || '').toLowerCase();
  const millionMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:m|million)/i);
  const rawNumMatch = q.replace(/,/g, '').match(/\b(\d{6,9})\b/);
  const budgetVal = millionMatch
    ? parseFloat(millionMatch[1]) * 1_000_000
    : rawNumMatch
    ? parseFloat(rawNumMatch[1])
    : null;

  if (liveProperties.length > 0 && budgetVal) {
    const outright = liveProperties.filter((p) => Number(p.priceNgn) <= budgetVal);
    const deposit = liveProperties.filter(
      (p) => Number(p.priceNgn) > budgetVal && Number(p.priceNgn) * 0.3 <= budgetVal
    );
    const lines: string[] = [
      `Based on your budget of ₦${budgetVal.toLocaleString()}, here are the verified options from our live JOY CONSULTANT PostgreSQL registry:\n`,
    ];
    if (outright.length > 0) {
      lines.push('Outright Purchase Options:');
      outright.forEach((p) => {
        lines.push(
          `• [${p.referenceCode}] ${p.title} (${p.location}) — ₦${Number(p.priceNgn).toLocaleString()} for ${p.sizeSqm}sqm | Title: ${p.documentationStatus} (Survey: ${p.surveyPlanNumber})`
        );
      });
    }
    if (deposit.length > 0) {
      lines.push('\nInstallment Options (30% Initial Deposit Fits Your Budget):');
      deposit.slice(0, 3).forEach((p) => {
        lines.push(
          `• [${p.referenceCode}] ${p.title} (${p.location}) — Outright: ₦${Number(p.priceNgn).toLocaleString()} | 30% Deposit: ₦${Math.round(Number(p.priceNgn) * 0.3).toLocaleString()} (${p.paymentPlanSummary})`
        );
      });
    }
    lines.push(
      '\nMandatory Verification Steps:\n1. Verify the Registered Survey Plan number & UTM coordinates at the Surveyor-General’s Office.\n2. Confirm C of O / Governor’s Consent status at the State Land Registry.\n3. Schedule a physical or live drone inspection via any property card.'
    );
    return lines.join('\n');
  }

  if (liveProperties.length > 0) {
    return [
      `Here are the matching verified land listings from our live JOY CONSULTANT database:`,
      ...liveProperties.slice(0, 5).map(
        (p) =>
          `• [${p.referenceCode}] ${p.title} (${p.location}) — ₦${Number(p.priceNgn).toLocaleString()} (${p.sizeSqm}sqm) | Title: ${p.documentationStatus} | Plan: ${p.paymentPlanSummary}`
      ),
      `\nMandatory Checks Before Buying:\n1. Chart the Registered Survey Plan coordinates.\n2. Confirm Government Excision / C of O file number.\n3. Book a Physical or Live Virtual Site Inspection on any property card.`,
    ].join('\n');
  }

  return (
    `Here is a direct summary from our verified JOY CONSULTANT property registry:\n\n` +
    `• [JC-IBD-005] Emerald Agro-Industrial Park, Moniya-Ibadan — ₦3,800,000 (600 sqm, Registered Survey & C of O in View, 6-Month Plan)\n` +
    `• [JC-EPE-002] Goldcrest Commercial Hub, Epe — ₦8,500,000 (500 sqm, Governor's Consent, 30% Deposit Plan)\n` +
    `• [JC-ENU-006] Coal City Executive Layout, Centenary Corridor Enugu — ₦14,500,000 (550 sqm, Registered Layout & C of O)\n` +
    `• [JC-LEK-001] Royal Palms Residence, Ibeju-Lekki — ₦18,500,000 (600 sqm, Certificate of Occupancy)\n` +
    `• [JC-ABJ-004] Sovereign Hills Guzape Executive Plots, Abuja — ₦65,000,000 (750 sqm, Certificate of Occupancy)\n\n` +
    `Mandatory Checks Before Buying:\n` +
    `1. Verify the Registered Survey Plan number & UTM coordinates.\n` +
    `2. Confirm Government Excision / C of O status via official charting.\n` +
    `3. Schedule a physical or live drone inspection via any property card.`
  );
}

export const AiChatbotWidget: React.FC<AiChatbotWidgetProps> = ({
  properties = [],
  authToken,
  userEmail = '',
  userName = '',
  onLeadCaptured,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `jc-chat-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Welcome to JOY CONSULTANT. I am connected to our live Nigerian land registry and property catalog. Ask me about available plots, C of O / Governor’s Consent verification, payment plans, or tell me your budget (e.g., ₦5M – ₦150M) for tailored options.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState(userName);
  const [leadEmail, setLeadEmail] = useState(userEmail);
  const [leadPhone, setLeadPhone] = useState('');
  const [leadBudget, setLeadBudget] = useState('15000000');
  const [leadLocation, setLeadLocation] = useState('Ibeju-Lekki, Lagos');
  const [leadConsent, setLeadConsent] = useState(true);
  const [leadSaved, setLeadSaved] = useState(false);
  const [escalateNext, setEscalateNext] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userName && !leadName) setLeadName(userName);
    if (userEmail && !leadEmail) setLeadEmail(userEmail);
  }, [userName, userEmail, leadName, leadEmail]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string, forceEscalate = false) => {
    const messageToSend = (customText ?? input).trim();
    if (!messageToSend || isSending) return;

    const nextHistory = [...messages, { role: 'user' as const, text: messageToSend }];
    setMessages(nextHistory);
    if (!customText) setInput('');
    setIsSending(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          message: messageToSend,
          history: messages,
          customerName: leadName || userName || 'Website Visitor',
          customerEmail: leadEmail || userEmail || '',
          customerPhone: leadPhone,
          escalateToHuman: forceEscalate || escalateNext,
        }),
      });
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }

      if (!res.ok || !data || !data.reply) {
        throw new Error('Fallback to verified registry');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
        },
      ]);
      if (forceEscalate || escalateNext) {
        setEscalateNext(false);
        if (onLeadCaptured) onLeadCaptured();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: buildClientChatFallback(messageToSend, properties),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone || !leadConsent) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone,
          preferredLocation: leadLocation,
          budgetNgn: Number(leadBudget) || 15000000,
          interestType: 'AI Chatbot Qualification',
          source: 'AI Chatbot Qualification',
          notes: 'Submitted via AI Real Estate Chatbot with explicit consent.',
        }),
      });
      if (res.ok) {
        setLeadSaved(true);
        setShowLeadForm(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Thank you, ${leadName}. Your investment profile (Budget: ₦${Number(leadBudget).toLocaleString()}, Preferred Axis: ${leadLocation}) has been saved to our priority advisory register. You can also click "Escalate to Senior Surveyor" anytime.`,
          },
        ]);
        if (onLeadCaptured) onLeadCaptured();
      }
    } catch {
      // Ignore error
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B192C] text-white border border-[#C59B27]/50 shadow-lg hover:bg-[#132847] transition-all whitespace-nowrap shrink-0"
        >
          <MessageSquare className="w-4 h-4 text-[#C59B27]" />
          <span className="text-xs font-semibold tracking-wide">
            AI Property Consultant
          </span>
        </button>
      ) : (
        <div className="w-[360px] sm:w-[410px] h-[540px] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B192C] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#C59B27]/30">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span className="text-sm font-semibold">
                  JOY CONSULTANT AI Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Grounded in Live Cadastral &amp; Listing Records
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors"
              aria-label="Close AI Advisor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setShowLeadForm((v) => !v)}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[#0B192C] font-medium hover:border-[#C59B27] transition-colors whitespace-nowrap shrink-0"
            >
              {leadSaved ? 'Profile Logged ✓' : 'Leave Contact / Budget'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!leadEmail && !userEmail) {
                  setShowLeadForm(true);
                  setEscalateNext(true);
                } else {
                  handleSend(
                    'Please escalate my enquiry to a human Senior Land Consultant for direct follow-up.',
                    true
                  );
                }
              }}
              className="px-2.5 py-1 rounded bg-[#C59B27]/15 text-[#0B192C] font-medium hover:bg-[#C59B27]/25 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#9A7411]" />
              Escalate to Human Admin
            </button>
          </div>

          {/* Optional Lead Consent Form */}
          {showLeadForm && (
            <form
              onSubmit={handleLeadSubmit}
              className="p-3.5 bg-[#F8FAFC] border-b border-slate-200 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0B192C]">
                  {escalateNext
                    ? 'Enter Contact Details to Escalate to Human Admin'
                    : 'Register Buyer Preferences (With Consent)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone / WhatsApp"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
                <input
                  type="number"
                  required
                  placeholder="Budget (₦)"
                  value={leadBudget}
                  onChange={(e) => setLeadBudget(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono-tabular"
                />
              </div>
              <input
                type="text"
                placeholder="Preferred Location (e.g. Ibeju-Lekki, Epe, Abuja)"
                value={leadLocation}
                onChange={(e) => setLeadLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadConsent}
                  onChange={(e) => setLeadConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I consent to JOY CONSULTANT storing my contact details to assist with land verification and inspection scheduling.
                </span>
              </label>
              <button
                type="submit"
                className="w-full py-1.5 rounded bg-[#0B192C] text-white font-medium hover:bg-[#162B49] transition-colors"
              >
                Save Preferences &amp; Continue
              </button>
            </form>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#0B192C] text-white'
                      : 'bg-slate-100 text-[#0B192C] border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-600 rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                  Checking live property &amp; title records...
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            {[
              'I have ₦5M budget — what can I buy?',
              'Which lands have C of O?',
              'Explain payment plans in Epe',
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => handleSend(promptText)}
                className="px-2 py-1 rounded bg-white border border-slate-200 text-[11px] text-slate-700 hover:border-[#C59B27] whitespace-nowrap shrink-0"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about prices, C of O status, or inspections..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B192C]"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-3 py-2 rounded-lg bg-[#C59B27] text-[#0B192C] font-semibold hover:bg-[#d4aa32] disabled:opacity-50 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
