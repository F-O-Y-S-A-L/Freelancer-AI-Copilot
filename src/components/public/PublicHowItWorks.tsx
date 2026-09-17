import React from 'react';
import {
  UploadCloud,
  Cpu,
  UserCheck,
  Calculator,
  PenTool,
  Send,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const PublicHowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload Inquiry',
      desc: 'Paste text directly or drop screenshots from Fiverr, Upwork, or email. Multimodal OCR extracts the dialogue automatically.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'Analyze',
      desc: 'The AI model assesses scope complexity, compares requirements to your skills, and flags missing technical constraints.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Understand Client',
      desc: 'View structured "Client Wants" and clarification prompts so you know exactly what they need before committing.',
      icon: UserCheck,
    },
    {
      num: '04',
      title: 'Estimate',
      desc: 'Review grounded price brackets and delivery milestone windows calculated from your personal Knowledge Base rates.',
      icon: Calculator,
    },
    {
      num: '05',
      title: 'Generate Reply',
      desc: 'Select your preferred tone (Professional, Friendly, Direct, Persuasive) to produce a proposal that addresses every question.',
      icon: PenTool,
    },
    {
      num: '06',
      title: 'Send',
      desc: 'Refine any line with one-click edits, copy directly to your clipboard, or mark as sent to trigger follow-up tracking.',
      icon: Send,
    },
  ];

  return (
    <section id="how-it-works-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Linear 6-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            How Freelancer AI Copilot Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            From raw, confusing client screenshots to polished, profitable proposals in under two minutes.
          </p>
        </div>

        {/* Workflow Steps Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative hover:border-violet-400 hover:shadow-md transition-all group"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-violet-100/70 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 group-hover:text-violet-200 transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>

                {/* Micro Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-violet-700">
                  <span>Step {idx + 1} of 6</span>
                  {idx < 5 && <ArrowRight className="w-3 h-3 ml-1 text-slate-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
