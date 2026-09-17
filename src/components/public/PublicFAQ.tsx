import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

export const PublicFAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Which freelance platforms are supported by Freelancer AI Copilot?',
      a: 'Freelancer AI Copilot works seamlessly with Upwork, Fiverr, Freelancer.com, Guru, Contra, and direct client communications via email, Slack, or LinkedIn. You can either paste message text directly or drop raw screenshots of client chats.',
    },
    {
      q: 'How does the screenshot OCR feature work?',
      a: 'Our multimodal vision processing engine analyzes the visual structure of your uploaded screenshots, separating client messages from system notices, timestamps, and interface elements. It extracts the client brief with high accuracy without needing manual transcription.',
    },
    {
      q: 'How does the Knowledge Base ensure replies sound authentic to me?',
      a: 'In your Knowledge Base, you configure your core technical skills, baseline hourly rate, minimum project fee, preferred work schedule, and tone preferences. When generating proposals, the AI strictly grounds its calculations and phrasing in these parameters.',
    },
    {
      q: 'Does Freelancer AI Copilot send messages directly to my clients automatically?',
      a: 'No. Freelancer AI Copilot operates with human-in-the-loop safety. Every AI-generated proposal draft is displayed in your workspace for you to review, modify, customize with tone switches, and manually copy or confirm before sending.',
    },
    {
      q: 'How are the price and delivery estimates calculated?',
      a: 'The analysis engine evaluates the scope complexity of the client request (e.g. number of components, external API integrations, authentication requirements) and applies your Knowledge Base rate formulas with protective milestone buffers to prevent underbidding.',
    },
    {
      q: 'Is my client communication and conversation data private and secure?',
      a: 'Yes. All client communications and extracted text are encrypted in transit and at rest. Your data belongs exclusively to you and is never used to train public models or shared with third-party marketplaces.',
    },
    {
      q: 'What happens when I reach my monthly AI reply credits limit?',
      a: 'You can continue using all stored inquiries, templates, and your Knowledge Base. If you need more AI reply credits or additional storage, you can easily upgrade to the Pro plan or request a Custom tier from your billing dashboard.',
    },
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Everything you need to know about the product, workflows, and platform compatibility.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                id={`faq-item-${idx}`}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  id={`faq-toggle-${idx}`}
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-violet-100 text-violet-700 rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
