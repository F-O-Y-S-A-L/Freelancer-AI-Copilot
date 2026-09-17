import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PublicNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentPath, onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'About', path: '/about' },
    { label: 'FAQ', path: '/faq' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header
      id="public-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
          : 'bg-white/80 backdrop-blur-xs border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo & Name */}
        <button
          type="button"
          id="nav-logo-btn"
          onClick={() => handleLinkClick('/')}
          className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shadow-violet-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Freelancer <span className="text-violet-600">AI Copilot</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight hidden sm:block">
              Client proposal &amp; estimate intelligence
            </span>
          </div>
        </button>

        {/* Center: Desktop Navigation Links */}
        <nav id="desktop-nav-links" className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                type="button"
                id={`nav-link-${link.label.toLowerCase()}`}
                onClick={() => handleLinkClick(link.path)}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-violet-700 bg-violet-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <button
              type="button"
              id="nav-btn-dashboard"
              onClick={() => onNavigate('/app/inquiries')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-violet-600/30 flex items-center space-x-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to App</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                id="nav-btn-login"
                onClick={() => onNavigate('/login')}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                id="nav-btn-start-free"
                onClick={() => onNavigate('/signup')}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-violet-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Start Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          {isAuthenticated && (
            <button
              type="button"
              id="nav-mobile-btn-quick-app"
              onClick={() => onNavigate('/app/inquiries')}
              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              App
            </button>
          )}
          <button
            type="button"
            id="nav-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg"
        >
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  type="button"
                  id={`mobile-nav-link-${link.label.toLowerCase()}`}
                  onClick={() => handleLinkClick(link.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'text-violet-700 bg-violet-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {isAuthenticated ? (
              <button
                type="button"
                id="mobile-nav-btn-app"
                onClick={() => handleLinkClick('/app/inquiries')}
                className="w-full py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Workspace</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="mobile-nav-btn-login"
                  onClick={() => handleLinkClick('/login')}
                  className="w-full py-2.5 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  Login
                </button>
                <button
                  type="button"
                  id="mobile-nav-btn-signup"
                  onClick={() => handleLinkClick('/signup')}
                  className="w-full py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

