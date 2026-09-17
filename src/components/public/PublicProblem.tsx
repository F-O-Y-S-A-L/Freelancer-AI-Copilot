import React from 'react';
import {
  HelpCircle,
  Clock,
  DollarSign,
  MessageSquareX,
  BellRing,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const PublicProblem: React.FC = () => {
  const problems = [
    {
      icon: HelpCircle,
      title: 'Unclear Client Requirements',
      pain: 'Clients send vague, 2-line briefs with missing technical specifications, ambiguous deliverables, and hidden assumptions that lead to scope creep.',
      solution: 'AI Inquiry Analysis extracts explicit deliverables and flags missing requirements before you accept the contract.',
    },
    {
      icon: MessageSquareX,
      title: 'Writing Professional Replies',
      pain: 'Drafting high-converting proposals takes 30–45 minutes per inquiry. Second-guessing your tone costs you speed, and the client hires someone else.',
      solution: 'Generate tailored, structured proposal replies in seconds with customizable tone switching (Professional, Friendly, Direct, Persuasive).',
    },
    {
      icon: DollarSign,
      title: 'Estimating Project Price',
      pain: 'Underbidding out of fear of rejection or arbitrarily guessing project prices leaves thousands of dollars on the table and causes burnout.',
      solution: 'Deterministic price estimation grounded in your personalized Knowledge Base minimums, complexity analysis, and hourly benchmarks.',
    },
    {
      icon: Clock,
      title: 'Estimating Delivery Time',
      pain: 'Overpromising unrealistic delivery deadlines to win bids results in late deliveries, stressed milestones, and damaged 5-star seller ratings.',
      solution: 'Realistic delivery day estimates with protective milestone buffers calculated directly from project task density.',
    },
    {
      icon: BellRing,
      title: 'Managing Follow-ups',
      pain: 'Freelancers lose over 40% of warm leads simply because they forget to follow up when a client goes quiet after the initial conversation.',
      solution: 'Automated follow-up pipeline with smart due-date alerts and polite follow-up reminder templates that keep deals alive.',
    },
  ];

  return (
    <section id="problem-section" className="py-20 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Freelancing Is Hard Enough.{' '}
            <span className="text-violet-700">Client Messaging Shouldn't Be.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Most freelancers waste hours every week deciphering vague inquiries, agonizing over proposal
            wording, and second-guessing estimates instead of doing paid work.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex items-start space-x-2 text-slate-500">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{item.pain}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-700 font-medium bg-violet-50/40 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                  <span>{item.solution}</span>
                </div>
              </div>
            );
          })}

          {/* Impact Summary Card */}
          <div className="bg-gradient-to-br from-violet-900 to-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-200 text-[10px] font-bold uppercase tracking-wider">
                The Outcome
              </span>
              <h3 className="text-lg font-bold text-white mt-4 tracking-tight">
                Respond faster, quote accurately, and protect your margins.
              </h3>
              <p className="mt-2 text-xs text-violet-200/80 leading-relaxed">
                When you respond within minutes with an intelligent breakdown and accurate estimates, clients
                view you as an expert consultant rather than an interchangeable commodity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-violet-800/60 text-xs text-violet-300 flex items-center space-x-2">
              <span className="font-bold">Zero guesswork. Full control.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
