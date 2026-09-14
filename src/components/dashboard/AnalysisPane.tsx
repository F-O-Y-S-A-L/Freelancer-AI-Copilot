import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  DollarSign,
  Clock,
  Layers,
  Bot,
  Brain,
  Tag,
  ListChecks,
  Loader2,
  AlertCircle,
  Info,
  ShieldCheck,
  Check,
  RefreshCw,
  FileText,
  Languages,
} from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext';
import { IInquiryAnalysis } from '../../shared/types';

const ANALYSIS_STAGES = [
  'Reading Fiverr screenshot / message text & extracting client scope...',
  'Matching required skills against Knowledge Base...',
  'Applying deterministic pricing parameters & project minimums...',
  'Finalizing capability assessment and Fiverr proposal reply draft...',
];

export const AnalysisPane: React.FC = () => {
  const {
    activeInquiry,
    isAnalyzing,
    analysisError,
    analyzeInquiryAction,
    translateAnalysisAction,
  } = useInquiry();
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setCurrentStageIdx(0);
      interval = setInterval(() => {
        setCurrentStageIdx((prev) => (prev < ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setCurrentStageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    setTranslationError(null);
    setLanguage('en');
  }, [activeInquiry?.id, (activeInquiry as any)?._id]);

  if (!activeInquiry) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <Brain className="w-6 h-6 text-violet-600" />
        </div>
        <h3 className="text-xs font-bold text-slate-800">Message Analysis Copilot</h3>
        <p className="text-[11px] text-slate-500 max-w-xs mt-1">
          Select an inquiry from the list to view requirement extraction & pricing structure.
        </p>
      </div>
    );
  }

  const analysis: IInquiryAnalysis | undefined = activeInquiry.analysisResult;
  const hasAnalysis = Boolean(analysis && (analysis.capability || analysis.clientWants?.length));

  // Determine active display analysis based on selected language
  const displayAnalysis: IInquiryAnalysis | undefined =
    language === 'bn' && analysis?.translations?.bn
      ? analysis.translations.bn
      : analysis;

  const handleLanguageSwitch = async (targetLang: 'en' | 'bn') => {
    if (targetLang === language) return;
    setTranslationError(null);

    if (targetLang === 'en') {
      setLanguage('en');
      return;
    }

    // Switching to Bengali (বাংলা)
    if (!analysis) return;

    if (analysis.translations?.bn) {
      setLanguage('bn');
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateAnalysisAction('bn');
      if (translated) {
        setLanguage('bn');
      } else {
        setTranslationError('বাংলা অনুবাদ লোড করা সম্ভব হয়নি। মূল ইংরেজি সংস্করণ প্রদর্শিত হচ্ছে।');
      }
    } catch (err: any) {
      console.error('[TRANSLATION ERROR] Failed to switch to Bengali:', err);
      setTranslationError('বাংলা অনুবাদ লোড করা সম্ভব হয়নি। মূল ইংরেজি সংস্করণ প্রদর্শিত হচ্ছে।');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden border-l border-slate-200/90 relative">
      {/* Header with Purple Top Border Indicator */}
      <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-2xs border-t-2 border-t-violet-600">
        <div className="flex items-center space-x-2">
          <span className="text-base">📊</span>
          <div>
            <h3 className="text-base font-bold text-violet-600 tracking-tight">Message Analysis</h3>
          </div>
        </div>
        
        <div className="flex flex-col-reverse items-center gap-3">
          {/* English ↔ বাংলা Compact Language Toggle */}
          {hasAnalysis && (
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-semibold">
              <button
                type="button"
                id="btn-lang-en"
                onClick={() => handleLanguageSwitch('en')}
                disabled={isTranslating}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                English
              </button>
              <span className="text-slate-300 select-none px-0.5">|</span>
              <button
                type="button"
                id="btn-lang-bn"
                onClick={() => handleLanguageSwitch('bn')}
                disabled={isTranslating}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  language === 'bn'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isTranslating ? <Loader2 className="w-3 h-3 animate-spin text-violet-600" /> : null}
                <span>বাংলা</span>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              analyzeInquiryAction();
            }}
            disabled={isAnalyzing}
            aria-label="Analyze Inquiry using AI and Knowledge Base"
            className=" px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">{hasAnalysis ? 'Analyze Again' : 'Analyze Inquiry'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Analysis Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs bg-slate-50/50">
        {/* Translation Error Banner */}
        {translationError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{translationError}</span>
            </div>
            <button
              onClick={() => setTranslationError(null)}
              className="text-amber-700 hover:text-amber-900 text-[11px] font-bold ml-2 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Banner */}
        {analysisError && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>AI analysis unavailable</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed pl-6">
              Please try again when the AI service is available.
            </p>
          </div>
        )}

        {/* Staged Analysis Loader */}
        {isAnalyzing && (
          <div className="p-4 bg-white border border-violet-200 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center space-x-2 text-violet-700 font-bold text-xs">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-violet-600" />
              <span>AI Analysis in Progress (1 Credit)</span>
            </div>
            
            <div className="space-y-1.5 pl-6">
              {ANALYSIS_STAGES.map((stage, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-[11px]">
                  {idx < currentStageIdx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : idx === currentStageIdx ? (
                    <div className="w-2 h-2 rounded-full bg-violet-600 animate-ping shrink-0 ml-0.5 mr-1" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-0.5 mr-1" />
                  )}
                  <span className={idx === currentStageIdx ? 'text-violet-900 font-bold' : idx < currentStageIdx ? 'text-slate-400 line-through' : 'text-slate-400'}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 1: Client Wants & Scope Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 text-sm">
              {language === 'bn' ? 'ক্লায়েন্টের চাহিদা :' : 'Client wants :'}
            </span>
            {displayAnalysis?.capability === 'supported' ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {language === 'bn' ? 'সম্পূর্ণ সমর্থিত' : 'Fully Supported'}
              </span>
            ) : displayAnalysis?.capability === 'partially_supported' ? (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {language === 'bn' ? 'আংশিক সমর্থিত' : 'Partially Supported'}
              </span>
            ) : displayAnalysis?.capability === 'not_supported' ? (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" />
                {language === 'bn' ? 'আওতার বাইরে' : 'Out of Scope'}
              </span>
            ) : null}
          </div>

          {displayAnalysis?.clientWants && displayAnalysis.clientWants.length > 0 ? (
            <ul className="space-y-1.5 text-slate-700 text-[11px]">
              {displayAnalysis.clientWants.map((want, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span className="leading-relaxed font-medium">{want}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-[11px] italic">
              {language === 'bn' ? 'এখনও কোনো প্রয়োজনীয়তা বিশ্লেষণ করা হয়নি।' : 'No client requirements extracted yet.'}
            </p>
          )}

          {/* Skill Badges Matrix */}
          {((displayAnalysis?.matchedSkills && displayAnalysis.matchedSkills.length > 0) || (displayAnalysis?.missingSkills && displayAnalysis.missingSkills.length > 0)) && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'bn' ? 'প্রয়োজনীয় স্কিল মিলকরণ' : 'Skill Alignment'}
              </div>
              <div className="flex flex-wrap gap-1">
                {displayAnalysis?.matchedSkills?.map((sk, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {sk}
                  </span>
                ))}
                {displayAnalysis?.missingSkills?.map((sk, i) => (
                  <span key={i} className="bg-rose-50 text-rose-800 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Information to Clarify Card */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center space-x-1 text-amber-900 font-bold text-sm">
            <span>❓</span>
            <span>{language === 'bn' ? 'যে বিষয়গুলো স্পষ্ট করা প্রয়োজন' : 'Information to Clarify'}</span>
          </div>

          {displayAnalysis?.questionsToClarify && displayAnalysis.questionsToClarify.length > 0 ? (
            <ul className="space-y-1.5 text-slate-800 text-[11px] font-medium pl-1">
              {displayAnalysis.questionsToClarify.map((q, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-[11px] italic pl-1">
              {language === 'bn' ? 'কোনো স্পষ্টীকরণের প্রয়োজন নেই।' : 'No clarification needed.'}
            </p>
          )}
        </div>

        {/* SECTION 3: Quick Pricing Estimate Card */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 font-bold text-sm">
            <div className="flex items-center space-x-1">
              <span>💰</span>
              <span>{language === 'bn' ? 'আনুমানিক মূল্য ও কাজের বিবরণ' : 'Quick Pricing Estimate'}</span>
            </div>
          </div>

          {/* Dotted Itemized Rows */}
          {displayAnalysis?.pricingEstimate ? (
            <div className="space-y-1.5 text-[11px] font-mono text-slate-800">
              {displayAnalysis.pricingEstimate.breakdown && displayAnalysis.pricingEstimate.breakdown.length > 0 && (
                <div className="space-y-1">
                  {displayAnalysis.pricingEstimate.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5 border-b border-emerald-200/40">
                      <span className="font-sans font-medium text-slate-700">{b.item}</span>
                      <span className="font-bold text-slate-900">${b.price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-xs font-bold font-sans text-emerald-950 border-t border-emerald-300/60">
                <span>{language === 'bn' ? 'সর্বমোট প্রাক্কলন:' : 'Total Estimate:'}</span>
                <span className="text-emerald-800 font-mono text-sm font-extrabold">
                  {displayAnalysis.pricingEstimate.minPrice
                    ? displayAnalysis.pricingEstimate.maxPrice && displayAnalysis.pricingEstimate.maxPrice !== displayAnalysis.pricingEstimate.minPrice
                      ? `$${displayAnalysis.pricingEstimate.minPrice} - $${displayAnalysis.pricingEstimate.maxPrice}`
                      : `$${displayAnalysis.pricingEstimate.minPrice}`
                    : (language === 'bn' ? 'মূল্য অনুপলব্ধ' : 'Pricing unavailable')}
                </span>
              </div>

              {displayAnalysis.pricingEstimate.deliveryDays ? (
                <div className="text-[10px] text-emerald-700 font-sans flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>
                    {language === 'bn'
                      ? `সম্ভাব্য ডেলিভারি: ${displayAnalysis.pricingEstimate.deliveryDays} দিন`
                      : `Est. Delivery: ${displayAnalysis.pricingEstimate.deliveryDays} Days`}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-slate-500 text-[11px] italic">
              {language === 'bn' ? 'মূল্য অনুপলব্ধ' : 'Pricing unavailable'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};



