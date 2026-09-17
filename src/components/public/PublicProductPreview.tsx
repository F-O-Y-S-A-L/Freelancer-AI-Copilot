import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Bot,
  SlidersHorizontal,
  CheckCircle2,
  DollarSign,
  Clock,
  HelpCircle,
  Library,
  Copy,
  Check,
  Send,
  RefreshCw,
  Eye,
} from 'lucide-react';

export const PublicProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'analysis' | 'composer' | 'knowledge'>('workspace');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'direct' | 'persuasive'>('professional');
  const [copied, setCopied] = useState(false);

  const toneResponses: Record<string, string> = {
    professional:
      'Dear Alexander, thank you for reaching out. Based on your specifications, I can integrate Stripe Customer Portal and resolve the session authentication timeout within 4–5 business days for $750. Before beginning, could you confirm whether your session tokens are stored in HTTP-only cookies or Redis memory cache? I look forward to working together.',
    friendly:
      'Hi Alexander! Thanks so much for reaching out. This sounds like a great project—I have extensive experience with React, Node.js, and Stripe integrations. I can knock out both the customer portal and the logout bug in about 4–5 days for $750. Quick question: are your session cookies configured with SameSite attributes or managed in Redis? Let me know!',
    direct:
      'Hi Alexander. Deliverables: 1) Stripe Customer Portal setup for tier changes. 2) Debug and fix session token expiration bug. Timeline: 4–5 business days. Fixed price: $750. Prerequisite: Please confirm if session storage is JWT cookie or Redis cache so we can begin immediately.',
    persuasive:
      'Hi Alexander, I specialize in production SaaS reliability and payment workflows. I recently completed a similar Stripe Customer Portal upgrade for a high-traffic React application. I can guarantee a seamless subscriber experience and permanently fix the logout issue in 4–5 days for $750. Let’s connect today to finalize the session storage details and get started.',
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="product-preview-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Product Showcase</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Realistic Product Experience
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Explore the exact interface and workflows you will use every day inside Freelancer AI Copilot.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mt-10 flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 space-x-1 overflow-x-auto max-w-full">
            <button
              type="button"
              id="preview-tab-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'workspace'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inquiry Workspace
            </button>
            <button
              type="button"
              id="preview-tab-analysis"
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Client Wants &amp; Estimates
            </button>
            <button
              type="button"
              id="preview-tab-composer"
              onClick={() => setActiveTab('composer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'composer'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reply Composer &amp; Tone
            </button>
            <button
              type="button"
              id="preview-tab-knowledge"
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'knowledge'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Knowledge Base Rules
            </button>
          </div>
        </div>

        {/* Dynamic Preview Container */}
        <div className="mt-8 max-w-5xl mx-auto bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-200/40">
          {/* View 1: Inquiry Workspace */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="font-bold text-slate-800 text-sm">
                    Inquiry Workspace &bull; Active Conversation
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  OCR Vision Extracted
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Inquiry Card Info */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Inquiry Details
                  </div>
                  <div className="font-bold text-slate-900 text-sm">Alexander Wright</div>
                  <div className="text-slate-500 text-[11px]">Platform: Upwork &bull; Enterprise Client</div>
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Status:</span>
                      <span className="text-violet-600 font-bold">Ready to Quote</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Budget Hint:</span>
                      <span className="font-bold text-slate-800">$500 - $1,000</span>
                    </div>
                  </div>
                </div>

                {/* Scope Snapshot */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Extracted Scope
                  </div>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    <li className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Stripe Billing Portal self-serve upgrade/downgrade</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Resolve JWT session expiration logout bug</span>
                    </li>
                  </ul>
                </div>

                {/* Grounded Estimates */}
                <div className="p-4 bg-violet-50/60 rounded-xl border border-violet-200 space-y-2">
                  <div className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                    Calculated Estimates
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">$750</div>
                  <div className="text-[11px] text-slate-600">Timeline: 4–5 business days</div>
                  <div className="text-[10px] text-violet-700 font-medium">
                    Aligned with Knowledge Base minimum project fee ($500)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Client Wants & Analysis */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-slate-800 text-sm">
                    Inquiry Deep Analysis Breakdown
                  </span>
                </div>
                <span className="text-xs text-slate-500">Confidence: 96% Match</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Client Wants */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Client Core Deliverables ("Client Wants")</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 leading-snug">
                      <strong>1. Self-Serve Subscription Billing:</strong> Client wants their SaaS users to manage
                      their own credit cards, view invoices, and change plans without manual customer support.
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 leading-snug">
                      <strong>2. Authentication Session Stability:</strong> Fix random logout glitches that occur
                      when users refresh pages or keep tabs idle for more than 15 minutes.
                    </div>
                  </div>
                </div>

                {/* Clarifications */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Recommended Clarifications to Ask</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-amber-950 leading-snug">
                      <strong>Session Storage Mechanism:</strong> "Are authentication tokens persisted in HTTP-only
                      cookies, localStorage, or synced via a Redis session store?"
                    </div>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-amber-950 leading-snug">
                      <strong>Stripe Webhook Infrastructure:</strong> "Do you already have an existing Stripe webhook
                      endpoint configured for subscription change events?"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View 3: Reply Composer & Tone Switcher */}
          {activeTab === 'composer' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-slate-800 text-sm">
                    Reply Composer &amp; Dynamic Tone Switcher
                  </span>
                </div>

                {/* Interactive Tone Switcher */}
                <div className="flex items-center space-x-1 p-1 bg-slate-200/80 rounded-xl">
                  {(['professional', 'friendly', 'direct', 'persuasive'] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      id={`tone-pill-${tone}`}
                      onClick={() => setSelectedTone(tone)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        selectedTone === tone
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Draft Output */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-lg border border-slate-200/70">
                  {toneResponses[selectedTone]}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Tone: <strong className="text-slate-800 capitalize">{selectedTone}</strong> &bull; Length: 52
                    words &bull; Ready to paste
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      id="btn-copy-preview-reply"
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View 4: Knowledge Base Rules */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Library className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-slate-800 text-sm">
                    Personalized Knowledge Base Grounding
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[11px] font-bold">
                  Active Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Rate Settings</div>
                  <div className="text-sm font-bold text-slate-900">$85 / hour</div>
                  <div className="text-[11px] text-slate-500">Minimum project fee: $500</div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Core Tech Stack</div>
                  <div className="text-sm font-bold text-slate-900">React, Node, TypeScript</div>
                  <div className="text-[11px] text-slate-500">Stripe, Tailwind, PostgreSQL</div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Availability</div>
                  <div className="text-sm font-bold text-emerald-600">Accepting Projects</div>
                  <div className="text-[11px] text-slate-500">Max turnaround: 7 days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
