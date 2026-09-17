import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Clock,
  Layers,
  Bot,
  MessageSquare,
  FileSearch,
  UploadCloud,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

interface PublicHeroProps {
  onStartFree: () => void;
  onSeeHowItWorks: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ onStartFree, onSeeHowItWorks }) => {
  return (
    <section id="hero-section" className="pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Text Block */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200/80 text-violet-700 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
            <span>Deterministic Proposal &amp; Estimate Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
            Turn Unclear Client Inquiries Into{' '}
            <span className="text-violet-700">Winning Proposals</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Understand what clients actually need, estimate realistic delivery timelines and budgets, and
            craft tailored replies in seconds without guesswork or underbidding.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              id="hero-btn-start-free"
              onClick={onStartFree}
              className="w-full sm:w-auto px-7 py-3.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-bold rounded-xl transition shadow-md shadow-violet-600/25 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="hero-btn-how-it-works"
              onClick={onSeeHowItWorks}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-sm font-bold rounded-xl border border-slate-200 shadow-2xs transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>See How It Works</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free 20 monthly credits</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>No credit card required</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fiverr &amp; Upwork screenshots supported</span>
            </span>
          </div>
        </div>

        {/* Realistic Product Preview UI Showcase */}
        <div className="mt-14 relative max-w-6xl mx-auto">
          {/* Subtle Outer Frame Decorator */}
          <div className="absolute -inset-1.5 bg-gradient-to-b from-violet-200/50 to-slate-200/40 rounded-3xl blur-xs -z-10" />

          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            {/* Mock Application Top Navigation Bar */}
            <div className="h-11 bg-slate-900 text-slate-200 px-4 flex items-center justify-between text-xs border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  freelancer-copilot.app/inquiries
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                  LIVE WORKSPACE
                </span>
              </div>
            </div>

            {/* 3-Pane Realistic Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 text-xs">
              {/* Left Column: Inquiries List (3 cols) */}
              <div className="lg:col-span-3 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Recent Inquiries
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-bold text-[10px]">
                    3 Active
                  </span>
                </div>

                {/* Inquiry Card 1 (Active) */}
                <div className="p-3 bg-white border border-violet-300 rounded-xl shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Marcus Vance</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Upwork
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    "Need full stack React developer to integrate Stripe subscriptions and fix dashboard bugs..."
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                    <span>Est: $650 - $900</span>
                    <span className="text-violet-600 font-bold">Analyzed</span>
                  </div>
                </div>

                {/* Inquiry Card 2 */}
                <div className="p-3 bg-white/60 border border-slate-200/80 rounded-xl space-y-1.5 opacity-85">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">Elena Rostova</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#b61dd8]/10 text-[#b61dd8] text-[10px] font-bold">
                      Fiverr
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    "Can you build an automated API webhook sync for our Shopify store inventory?"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                    <span>Est: $350 - $500</span>
                    <span className="text-slate-400">Ready</span>
                  </div>
                </div>

                {/* Inquiry Card 3 */}
                <div className="p-3 bg-white/60 border border-slate-200/80 rounded-xl space-y-1.5 opacity-85 hidden sm:block">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">Direct Inquiry</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Email
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    "Looking for hourly consultation on cloud database migration..."
                  </p>
                </div>
              </div>

              {/* Center Column: Conversation & Reply Generator (5 cols) */}
              <div className="lg:col-span-5 p-4 flex flex-col justify-between bg-white space-y-4">
                {/* Client Message Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-[10px]">
                        MV
                      </div>
                      <span className="font-bold text-slate-900 text-xs">Marcus Vance</span>
                      <span className="text-[10px] text-slate-400">14 min ago</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Screenshot OCR Parsed
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed text-[11px]">
                    "Hi there! We have an existing React and Node.js web app. We need someone to implement Stripe
                    Customer Portal for upgrades and downgrades, plus fix a session bug where users are logged out
                    unexpectedly. Can you deliver by next Friday? What would be your price?"
                  </div>
                </div>

                {/* AI Draft Response with Tone Selector */}
                <div className="p-3.5 bg-violet-50/50 border border-violet-200/90 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-violet-700 font-bold text-[11px]">
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Generated Proposal Reply</span>
                    </div>
                    {/* Tone Pills */}
                    <div className="flex items-center space-x-1">
                      <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white font-bold text-[10px]">
                        Professional
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 text-[10px]">
                        Friendly
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 text-[10px] hidden sm:inline">
                        Persuasive
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-violet-200/60 text-slate-800 text-[11px] leading-relaxed">
                    "Hi Marcus! I can definitely resolve the unexpected session expiration and configure Stripe's
                    Customer Portal for clean upgrades and downgrades. Based on your tech stack (React/Node), I can
                    deliver this in 4–5 business days for $750. Before we start, are your user sessions managed via
                    JWT cookies or Redis?"
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">Grounded with your Knowledge Base rate rules</span>
                    <button
                      type="button"
                      className="px-3 py-1 bg-violet-600 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Analysis Pane (4 cols) */}
              <div className="lg:col-span-4 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span>Inquiry Analysis</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    96% Match
                  </span>
                </div>

                {/* Client Wants */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                    Client Wants
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-start space-x-1.5 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Stripe Customer Portal self-serve subscription tier changes</span>
                    </div>
                    <div className="flex items-start space-x-1.5 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Debug silent session token invalidation bug</span>
                    </div>
                  </div>
                </div>

                {/* Clarification Suggestions */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                    Clarification Suggestions
                  </span>
                  <div className="p-2 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 leading-snug">
                    Ask whether webhook handlers already exist for Stripe invoices or if webhook signing needs to be
                    set up from scratch.
                  </div>
                </div>

                {/* Pricing & Delivery Estimates */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-semibold">
                      <DollarSign className="w-3 h-3 text-violet-600" />
                      <span>Price Estimate</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">$650 - $850</div>
                    <div className="text-[9px] text-slate-500 font-medium">Standard Complexity</div>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-violet-600" />
                      <span>Delivery Time</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">4 - 5 Days</div>
                    <div className="text-[9px] text-slate-500 font-medium">Safe milestone buffer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
