import React, { useState } from 'react';
import { InquiryListPane } from './InquiryListPane';
import { ConversationPane } from './ConversationPane';
import { AnalysisPane } from './AnalysisPane';
import { NewInquiryModal } from './NewInquiryModal';
import { Inbox, MessageSquare, Sparkles } from 'lucide-react';

export const InquiryWorkspace: React.FC = () => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'conversation' | 'analysis'>('list');

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Mobile/Tablet Pane Navigation Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-2 flex items-center justify-around shrink-0 text-xs font-semibold">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition ${
            mobileTab === 'list'
              ? 'bg-violet-100/80 text-violet-700 border border-violet-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inquiries</span>
        </button>

        <button
          onClick={() => setMobileTab('conversation')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition ${
            mobileTab === 'conversation'
              ? 'bg-violet-100/80 text-violet-700 border border-violet-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversation</span>
        </button>

        <button
          onClick={() => setMobileTab('analysis')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition ${
            mobileTab === 'analysis'
              ? 'bg-violet-100/80 text-violet-700 border border-violet-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Analysis</span>
        </button>
      </div>

      {/* Main 3-Pane Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Inquiry List Pane (Width: ~320px on desktop) */}
        <div
          className={`w-full lg:w-[310px] xl:w-[350px] shrink-0 h-full ${
            mobileTab === 'list' ? 'block' : 'hidden lg:block'
          }`}
        >
          <InquiryListPane onOpenNewModal={() => setIsNewModalOpen(true)} />
        </div>

        {/* Pane 2: Conversation Pane (Flex-1 on desktop) */}
        <div
          className={`w-full lg:flex-1 h-full min-w-[320px] ${
            mobileTab === 'conversation' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ConversationPane />
        </div>

        {/* Pane 3: Analysis Pane (Width: ~380px on desktop) */}
        <div
          className={`w-full lg:w-[350px] xl:w-[410px] shrink-0 h-full ${
            mobileTab === 'analysis' ? 'block' : 'hidden lg:block'
          }`}
        >
          <AnalysisPane />
        </div>
      </div>

      {/* Modal for creating new inquiries */}
      <NewInquiryModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
    </div>
  );
};
