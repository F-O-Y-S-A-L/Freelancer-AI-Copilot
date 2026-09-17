import React from 'react';
import { Sparkles } from 'lucide-react';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer id="public-footer" className="bg-slate-950 text-slate-400 py-12 sm:py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Freelancer <span className="text-violet-400">AI Copilot</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The deterministic client proposal and estimation workspace built to help independent freelancers
              and agencies understand briefs, price accurately, and close contracts faster.
            </p>
          </div>

          {/* Product Navigation */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/features')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Features &amp; Capabilities
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/pricing')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition cursor-pointer"
                >
                  About &amp; Mission
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-white transition cursor-pointer"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Account & Platform */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Account</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/signup')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Start Free Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/app/inquiries')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Freelancer Workspace
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Freelancer AI Copilot. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 font-medium">Deterministic Proposal Intelligence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
