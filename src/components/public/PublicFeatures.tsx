import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  DollarSign,
  Clock,
  Bot,
  SlidersHorizontal,
  BellRing,
  LayoutTemplate,
  Library,
  ArrowRight,
} from 'lucide-react';

interface PublicFeaturesProps {
  onStartFree: () => void;
}

export const PublicFeatures: React.FC<PublicFeaturesProps> = ({ onStartFree }) => {
  const features = [
    {
      id: 'analysis',
      icon: Sparkles,
      title: 'AI Inquiry Analysis',
      desc: 'Multimodal OCR and natural language processing read client messages or full screenshots, breaking down complex inquiries into actionable requirements.',
      tag: 'Core Intelligence',
    },
    {
      id: 'wants',
      icon: CheckCircle2,
      title: 'Client Wants Breakdown',
      desc: 'Distills rambling project messages into explicit deliverables and technical goals so you know exactly what the client expects before you reply.',
      tag: 'Scope Clarity',
    },
    {
      id: 'clarifications',
      icon: HelpCircle,
      title: 'Clarification Suggestions',
      desc: 'Automatically identifies ambiguous terms, missing API credentials, or unspecified design assets, suggesting precise questions to ask upfront.',
      tag: 'Risk Prevention',
    },
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Deterministic Price Estimate',
      desc: 'Calculates justifiable project budget brackets based on task complexity, required skillsets, and your minimum baseline pricing rules.',
      tag: 'Margin Protection',
    },
    {
      id: 'delivery',
      icon: Clock,
      title: 'Delivery Time Estimates',
      desc: 'Generates realistic turnaround times with built-in milestone buffers, protecting your ratings from unrealistic client deadlines.',
      tag: 'On-Time Delivery',
    },
    {
      id: 'replies',
      icon: Bot,
      title: 'AI Reply Generation',
      desc: 'Drafts comprehensive, tailored proposal responses that directly address every requirement and question raised in the client inquiry.',
      tag: 'Conversion Focused',
    },
    {
      id: 'tones',
      icon: SlidersHorizontal,
      title: 'Dynamic Tone Switching',
      desc: 'Switch replies instantly between Professional, Friendly, Direct, and Persuasive to match your personal brand or the client’s communication style.',
      tag: 'Voice Customization',
    },
    {
      id: 'followups',
      icon: BellRing,
      title: 'Automated Follow-ups',
      desc: 'Track inquiry progress from initial reply to deal close. Receive overdue alerts and generate gentle follow-up reminders that revive quiet leads.',
      tag: 'Pipeline Tracker',
    },
    {
      id: 'templates',
      icon: LayoutTemplate,
      title: 'Custom AI Templates',
      desc: 'Create and save reusable prompt directives for specific services (e.g. WordPress, React dashboards, API integrations, Bug fixing).',
      tag: 'Workflow Shortcuts',
    },
    {
      id: 'knowledge',
      icon: Library,
      title: 'Personalized Knowledge Base',
      desc: 'Store your tech stack, standard hourly rates, minimum project thresholds, and past portfolio highlights so all AI suggestions match your real business rules.',
      tag: 'Tailored Rules',
    },
  ];

  return (
    <section id="features-section" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built Specifically For Freelance Sellers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Comprehensive Suite of Copilot Features
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every tool is designed to save you time, eliminate guesswork, and help you win contracts with
            healthy profit margins.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                id={`feature-card-${feat.id}`}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-violet-600">
                  <span>Available in all plans</span>
                </div>
              </div>
            );
          })}

          {/* Callout Card */}
          <div className="bg-violet-600 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                Full Ecosystem
              </span>
              <h3 className="text-lg font-bold text-white mt-4 tracking-tight">
                Ready to experience the workspace firsthand?
              </h3>
              <p className="mt-2 text-xs text-violet-100 leading-relaxed">
                Create a free account in 30 seconds. No credit card required. Includes 20 complimentary reply credits.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={onStartFree}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-violet-900 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>Start Free Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
