import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface PublicCTAProps {
  onStartFree: () => void;
}

export const PublicCTA: React.FC<PublicCTAProps> = ({ onStartFree }) => {
  return (
    <section id="final-cta-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-violet-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-200 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started in 30 Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to Win More Freelance Clients with Less Stress?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-violet-100/90 leading-relaxed">
              Stop second-guessing your quotes and wasting hours drafting proposals. Experience the power of
              deterministic client intelligence today.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="cta-btn-start-free"
                onClick={onStartFree}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-violet-950 text-sm font-extrabold rounded-xl transition shadow-xl shadow-black/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-violet-200/80 font-medium">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>20 free reply credits</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant workspace access</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
