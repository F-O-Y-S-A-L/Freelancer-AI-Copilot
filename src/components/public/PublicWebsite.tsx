import React, { useEffect } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicHero } from './PublicHero';
import { PublicProblem } from './PublicProblem';
import { PublicHowItWorks } from './PublicHowItWorks';
import { PublicFeatures } from './PublicFeatures';
import { PublicProductPreview } from './PublicProductPreview';
import { PublicPricing } from './PublicPricing';
import { PublicAbout } from './PublicAbout';
import { PublicFAQ } from './PublicFAQ';
import { PublicCTA } from './PublicCTA';
import { PublicFooter } from './PublicFooter';

interface PublicWebsiteProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ currentPath, onNavigate }) => {
  // Handle auto-scroll based on route when navigating
  useEffect(() => {
    const normalized = currentPath.toLowerCase().replace(/\/+$/, '') || '/';

    if (normalized === '/features') {
      const el = document.getElementById('features-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (normalized === '/pricing') {
      const el = document.getElementById('pricing-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (normalized === '/about') {
      const el = document.getElementById('about-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (normalized === '/faq') {
      const el = document.getElementById('faq-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (normalized === '/' || normalized === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPath]);

  const handleStartFree = () => {
    onNavigate('/signup');
  };

  const handleSeeHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigate('/');
    }
  };

  const handleSelectPlan = (_planId: string) => {
    onNavigate('/signup');
  };

  // If user navigates directly to a sub-route (e.g. /pricing, /about, /features, /faq)
  // we ensure the appropriate order or focus
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-violet-500 selection:text-white flex flex-col">
      {/* Responsive Public Navigation Bar */}
      <PublicNavbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Marketing Content Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <PublicHero onStartFree={handleStartFree} onSeeHowItWorks={handleSeeHowItWorks} />

        {/* 2. Problem Section */}
        <PublicProblem />

        {/* 3. How It Works Workflow */}
        <PublicHowItWorks />

        {/* 4. Core Features Showcase */}
        <PublicFeatures onStartFree={handleStartFree} />

        {/* 5. Realistic Product Preview */}
        <PublicProductPreview />

        {/* 6. Existing Plans & Pricing */}
        <PublicPricing onSelectPlan={handleSelectPlan} />

        {/* 7. About & Philosophy */}
        <PublicAbout />

        {/* 8. Frequently Asked Questions */}
        <PublicFAQ />

        {/* 9. Final Call to Action */}
        <PublicCTA onStartFree={handleStartFree} />
      </main>

      {/* Global Public Footer */}
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
