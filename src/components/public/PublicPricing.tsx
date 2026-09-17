import React from 'react';
import { APP_PLANS } from '../../shared/planConfig';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PublicPricingProps {
  onSelectPlan: (planId: string) => void;
}

export const PublicPricing: React.FC<PublicPricingProps> = ({ onSelectPlan }) => {
  return (
    <section id="pricing-section" className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent, Predictable Plans</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Simple Plans That Scale With Your Gigs
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Start for free to test with your real inquiries, then upgrade whenever your project volume expands.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {APP_PLANS.map((plan) => {
            const isPopular = !!plan.popular;
            return (
              <div
                key={plan.id}
                id={`public-plan-${plan.id}`}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                  isPopular
                    ? 'bg-white border-2 border-violet-600 shadow-xl shadow-violet-600/10 md:-translate-y-2'
                    : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Popular / Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                    Most Popular
                  </div>
                )}
                {!isPopular && plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-slate-950 tracking-tight">
                      {plan.priceFormatted}
                    </span>
                    {plan.priceFormatted !== '$0' && plan.priceFormatted !== 'Custom' && (
                      <span className="text-xs text-slate-500 font-semibold">/mo</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {plan.billingPeriod}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 text-xs">
                    <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                      Included in {plan.name}:
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-2.5 text-slate-600">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    id={`btn-select-plan-${plan.id}`}
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      isPopular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/25'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>
                      {plan.id === 'free'
                        ? 'Get Started Free'
                        : plan.id === 'pro'
                        ? 'Start Pro Trial'
                        : 'Contact for Custom'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Note */}
        <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All plans include secure cloud encryption, session privacy, and zero data selling.</span>
        </div>
      </div>
    </section>
  );
};
