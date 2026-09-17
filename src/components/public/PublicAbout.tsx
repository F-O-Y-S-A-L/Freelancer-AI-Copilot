import React from 'react';
import { Target, Users, ShieldCheck, Zap, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export const PublicAbout: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Deterministic Grounding',
      desc: 'We reject arbitrary AI hallucinations. All estimates, milestones, and scope assessments are mathematically grounded in your personalized Knowledge Base and project complexity parameters.',
    },
    {
      icon: Users,
      title: 'Human-in-the-Loop Control',
      desc: 'The copilot accelerates your thinking—it never replaces your judgement. You have complete autonomy to inspect, edit, switch tones, or adjust estimates before anything is sent to a client.',
    },
    {
      icon: ShieldCheck,
      title: 'Client Data Confidentiality',
      desc: 'Your client screenshots, pricing strategies, and communication records are isolated in private, encrypted storage and never used to train public generative models.',
    },
    {
      icon: Zap,
      title: 'Platform Agnostic Speed',
      desc: 'Whether you win gigs on Upwork, Fiverr, Contra, or through direct inbound referrals, Freelancer AI Copilot gives you the same rapid competitive advantage.',
    },
  ];

  return (
    <section id="about-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>Our Mission &amp; Philosophy</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Built by Freelancers, for Freelancers
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            In modern freelance marketplaces, speed and clarity determine who wins the deal. Freelancers who
            respond within 15 minutes with structured questions and grounded estimates close 3x more contracts.
          </p>
        </div>

        {/* Story & Context Block */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h3 className="text-base font-bold text-slate-900">
            The Problem With Traditional Client Communication
          </h3>
          <p>
            Freelancers spend up to 25% of their working hours on unpaid administrative overhead: reading vague
            inquiries, guessing at hidden client requirements, wrestling with proposal tone, and agonizing over
            whether a quote is too high or too low.
          </p>
          <p>
            Freelancer AI Copilot was built to transform this friction into a high-speed competitive advantage.
            By pairing multimodal vision OCR with deterministic business rules, we give independent professionals
            an enterprise-grade proposal desk right on their laptop.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-violet-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{val.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
