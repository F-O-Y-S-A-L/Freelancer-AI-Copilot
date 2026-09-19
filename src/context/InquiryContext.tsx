import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { IInquiry, IInquiryAnalysis } from '../shared/types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { renderTemplate, buildTemplateContext, validateTemplate } from '../shared/templateRenderer';

interface InquiryContextType {
  inquiries: IInquiry[];
  filteredInquiries: IInquiry[];
  activeInquiry: IInquiry | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: string;
  sort: 'newest' | 'oldest';
  draft: string;
  selectedTone: 'friendly' | 'formal' | 'concise' | 'detailed';
  isSavingDraft: boolean;
  isAnalyzing: boolean;
  isGeneratingReply: boolean;
  analysisError: string | null;
  
  // Actions
  fetchInquiries: () => Promise<void>;
  selectInquiry: (id: string | null) => Promise<void>;
  createNewInquiry: (payload: {
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    subject?: string;
    rawMessage?: string;
    sourceChannel?: string;
    sourceType?: 'screenshot' | 'text';
    screenshotData?: string;
    screenshotMimeType?: string;
    extractedMessageText?: string;
  }) => Promise<IInquiry | null>;
  saveDraft: (draftText: string, tone?: 'friendly' | 'formal' | 'concise' | 'detailed') => Promise<boolean>;
  updateStatus: (status: 'new' | 'analyzed' | 'replied' | 'converted' | 'declined' | 'archived') => Promise<boolean>;
  markAsReadAction: (id?: string) => Promise<boolean>;
  markAsUnreadAction: (id?: string) => Promise<boolean>;
  toggleStarAction: (id?: string, targetStarred?: boolean) => Promise<boolean>;
  deleteInquiry: (id: string) => Promise<boolean>;
  analyzeInquiryAction: (
    id?: string,
    screenshotPayload?: { screenshotData?: string; screenshotMimeType?: string; fileName?: string }
  ) => Promise<boolean>;
  generateReplyAction: (tone?: 'friendly' | 'formal' | 'concise' | 'detailed') => Promise<boolean>;
  translateAnalysisAction: (targetLanguage?: 'en' | 'bn') => Promise<IInquiryAnalysis | null>;
  sendReplyAction: (messageText?: string) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setSort: (sort: 'newest' | 'oldest') => void;
  setDraft: (text: string) => void;
  setSelectedTone: (tone: 'friendly' | 'formal' | 'concise' | 'detailed') => void;
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);

export const InquiryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inquiries, setInquiries] = useState<IInquiry[]>([]);
  const [activeInquiry, setActiveInquiry] = useState<IInquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [draft, setDraft] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<'friendly' | 'formal' | 'concise' | 'detailed'>('friendly');
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { updateCredits, user } = useAuth();

  // Sync draft and tone when activeInquiry changes
  useEffect(() => {
    if (activeInquiry) {
      setDraft(activeInquiry.draft || activeInquiry.analysisResult?.aiSuggestedReply || '');
      setSelectedTone(activeInquiry.selectedTone || 'friendly');
    } else {
      setDraft('');
      setSelectedTone('friendly');
    }
  }, [
    activeInquiry?.id,
    activeInquiry?.draft,
    activeInquiry?.selectedTone,
    activeInquiry?.analysisResult?.aiSuggestedReply,
  ]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.getInquiries();
    if (res.success && res.data) {
      setInquiries(res.data);
      
      // Check if URL has /app/inquiries/:id
      const pathParts = window.location.pathname.split('/');
      const urlInquiryId = pathParts.length >= 4 && pathParts[1] === 'app' && pathParts[2] === 'inquiries' ? pathParts[3] : null;
      
      if (urlInquiryId) {
        const found = res.data.find(
          (i) => (i.id || (i as any)._id) === urlInquiryId
        );
        if (found) {
          setActiveInquiry(found);
        } else if (res.data.length > 0) {
          setActiveInquiry(res.data[0]);
          window.history.replaceState(null, '', `/app/inquiries/${res.data[0].id || (res.data[0] as any)._id}`);
        }
      } else if (res.data.length > 0 && !activeInquiry) {
        setActiveInquiry(res.data[0]);
        window.history.replaceState(null, '', `/app/inquiries/${res.data[0].id || (res.data[0] as any)._id}`);
      }
    } else {
      setError(res.error || 'Failed to fetch inquiries.');
    }
    setLoading(false);
  }, []);

  const selectInquiry = async (id: string | null) => {
    setAnalysisError(null);
    if (!id) {
      setActiveInquiry(null);
      window.history.pushState(null, '', '/app/inquiries');
      return;
    }

    const found = inquiries.find((i) => (i.id || (i as any)._id) === id);
    if (found) {
      setActiveInquiry(found);
      window.history.pushState(null, '', `/app/inquiries/${id}`);
    } else {
      // Fetch specifically from API
      setLoading(true);
      const res = await api.getInquiry(id);
      if (res.success && res.data) {
        setActiveInquiry(res.data);
        window.history.pushState(null, '', `/app/inquiries/${id}`);
      }
      setLoading(false);
    }
  };

  const createNewInquiry = async (payload: {
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    subject?: string;
    rawMessage?: string;
    sourceChannel?: string;
    sourceType?: 'screenshot' | 'text';
    screenshotData?: string;
    screenshotMimeType?: string;
    extractedMessageText?: string;
  }): Promise<IInquiry | null> => {
    setAnalysisError(null);
    const res = await api.createInquiry(payload);
    if (res.success && res.data) {
      const created = res.data;
      const targetId = created.id || (created as any)._id;
      setInquiries((prev) => [created, ...prev]);
      setActiveInquiry(created);
      window.history.pushState(null, '', `/app/inquiries/${targetId}`);
      return created;
    }
    return null;
  };

  const saveDraft = async (
    draftText: string,
    tone?: 'friendly' | 'formal' | 'concise' | 'detailed'
  ): Promise<boolean> => {
    if (!activeInquiry) return false;
    const targetId = activeInquiry.id || (activeInquiry as any)._id;
    setIsSavingDraft(true);

    const updatePayload: Partial<IInquiry> = {
      draft: draftText,
      selectedTone: tone || selectedTone,
    };

    const res = await api.updateInquiry(targetId, updatePayload);
    setIsSavingDraft(false);

    if (res.success && res.data) {
      const updated = res.data;
      setActiveInquiry(updated);
      setInquiries((prev) =>
        prev.map((item) => ((item.id || (item as any)._id) === targetId ? updated : item))
      );
      return true;
    }
    return false;
  };

  const updateStatus = async (
    newStatus: 'new' | 'analyzed' | 'replied' | 'converted' | 'declined' | 'archived'
  ): Promise<boolean> => {
    if (!activeInquiry) return false;
    const targetId = activeInquiry.id || (activeInquiry as any)._id;

    const res = await api.updateInquiry(targetId, {
      status: newStatus,
      ...(newStatus === 'replied' || newStatus === 'converted' ? { read: true } : {}),
    });
    if (res.success && res.data) {
      const updated = res.data;
      setActiveInquiry(updated);
      setInquiries((prev) =>
        prev.map((item) => ((item.id || (item as any)._id) === targetId ? updated : item))
      );
      return true;
    }
    return false;
  };

  const markAsReadAction = useCallback(async (id?: string): Promise<boolean> => {
    const targetId = id || (activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null);
    if (!targetId) return false;

    // Optimistically update local state to read: true
    setActiveInquiry((prev) => {
      if (prev && ((prev.id || (prev as any)._id) === targetId)) {
        return { ...prev, read: true, readAt: new Date().toISOString() };
      }
      return prev;
    });

    setInquiries((prev) =>
      prev.map((item) =>
        (item.id || (item as any)._id) === targetId
          ? { ...item, read: true, readAt: new Date().toISOString() }
          : item
      )
    );

    try {
      const res = await api.markInquiryAsRead(targetId);
      if (res.success && res.data) {
        const updated = res.data;
        setActiveInquiry((prev) => {
          if (prev && ((prev.id || (prev as any)._id) === targetId)) {
            return { ...prev, ...updated, read: true };
          }
          return prev;
        });
        setInquiries((prev) =>
          prev.map((item) =>
            (item.id || (item as any)._id) === targetId
              ? { ...item, ...updated, read: true }
              : item
          )
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to mark inquiry as read:', err);
    }
    return false;
  }, [activeInquiry]);

  const markAsUnreadAction = useCallback(async (id?: string): Promise<boolean> => {
    const targetId = id || (activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null);
    if (!targetId) return false;

    // Optimistically update local state to unread
    setActiveInquiry((prev) => {
      if (prev && ((prev.id || (prev as any)._id) === targetId)) {
        return { ...prev, read: false, status: 'new' };
      }
      return prev;
    });

    setInquiries((prev) =>
      prev.map((item) =>
        (item.id || (item as any)._id) === targetId
          ? { ...item, read: false, status: 'new' }
          : item
      )
    );

    try {
      const res = await api.updateInquiry(targetId, { read: false, status: 'new' });
      if (res.success && res.data) {
        const updated = res.data;
        setActiveInquiry((prev) => {
          if (prev && ((prev.id || (prev as any)._id) === targetId)) {
            return { ...prev, ...updated, read: false };
          }
          return prev;
        });
        setInquiries((prev) =>
          prev.map((item) =>
            (item.id || (item as any)._id) === targetId
              ? { ...item, ...updated, read: false }
              : item
          )
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to mark inquiry as unread:', err);
    }
    return false;
  }, [activeInquiry]);

  const inFlightStarMapRef = useRef<Map<string, boolean>>(new Map());

  const toggleStarAction = useCallback(
    async (id?: string, targetStarred?: boolean): Promise<boolean> => {
      const targetId = id || (activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null);
      if (!targetId) return false;

      // Prevent race conditions on rapid clicks
      if (inFlightStarMapRef.current.get(targetId)) {
        return false;
      }
      inFlightStarMapRef.current.set(targetId, true);

      // Determine current and next state
      const currentInquiry =
        inquiries.find((item) => (item.id || (item as any)._id) === targetId) ||
        activeInquiry;

      const currentStarred = Boolean(currentInquiry?.starred);
      const nextStarred = typeof targetStarred === 'boolean' ? targetStarred : !currentStarred;

      // Optimistic update
      setActiveInquiry((prev) => {
        if (prev && (prev.id || (prev as any)._id) === targetId) {
          return { ...prev, starred: nextStarred };
        }
        return prev;
      });

      setInquiries((prev) =>
        prev.map((item) =>
          (item.id || (item as any)._id) === targetId
            ? { ...item, starred: nextStarred }
            : item
        )
      );

      try {
        const res = await api.toggleStarInquiry(targetId, nextStarred);
        if (res.success && res.data) {
          const updated = res.data;
          const authoritativeStarred = Boolean(updated.starred);

          setActiveInquiry((prev) => {
            if (prev && (prev.id || (prev as any)._id) === targetId) {
              return { ...prev, ...updated, starred: authoritativeStarred };
            }
            return prev;
          });

          setInquiries((prev) =>
            prev.map((item) =>
              (item.id || (item as any)._id) === targetId
                ? { ...item, ...updated, starred: authoritativeStarred }
                : item
            )
          );
          return true;
        } else {
          throw new Error(res.error || 'Failed to toggle star status');
        }
      } catch (err) {
        console.error('Failed to toggle star on inquiry:', err);
        // Rollback optimistic state
        setActiveInquiry((prev) => {
          if (prev && (prev.id || (prev as any)._id) === targetId) {
            return { ...prev, starred: currentStarred };
          }
          return prev;
        });

        setInquiries((prev) =>
          prev.map((item) =>
            (item.id || (item as any)._id) === targetId
              ? { ...item, starred: currentStarred }
              : item
          )
        );
        return false;
      } finally {
        inFlightStarMapRef.current.delete(targetId);
      }
    },
    [activeInquiry, inquiries]
  );

  const deleteInquiry = async (id: string): Promise<boolean> => {
    const res = await api.deleteInquiry(id);
    if (res.success) {
      setInquiries((prev) => prev.filter((item) => (item.id || (item as any)._id) !== id));
      if (activeInquiry && (activeInquiry.id || (activeInquiry as any)._id) === id) {
        const remaining = inquiries.filter((item) => (item.id || (item as any)._id) !== id);
        if (remaining.length > 0) {
          const nextInq = remaining[0];
          setActiveInquiry(nextInq);
          window.history.pushState(null, '', `/app/inquiries/${nextInq.id || (nextInq as any)._id}`);
        } else {
          setActiveInquiry(null);
          window.history.pushState(null, '', '/app/inquiries');
        }
      }
      return true;
    }
    return false;
  };

  const analyzeInquiryAction = async (
    targetId?: string,
    screenshotPayload?: { screenshotData?: string; screenshotMimeType?: string; fileName?: string }
  ): Promise<boolean> => {
    const inqId = targetId || (activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null);
    if (!inqId) return false;

    setIsAnalyzing(true);
    setAnalysisError(null);

    const res = await api.analyzeInquiry(inqId, screenshotPayload);
    setIsAnalyzing(false);

    if (res.success && res.data) {
      const updated = res.data;
      setActiveInquiry(updated);
      setDraft(updated.draft || updated.analysisResult?.aiSuggestedReply || '');
      setInquiries((prev) =>
        prev.map((item) => ((item.id || (item as any)._id) === inqId ? updated : item))
      );
      const remaining =
        typeof res.aiCreditsRemaining === 'number'
          ? res.aiCreditsRemaining
          : typeof (res.data as any)?.aiCreditsRemaining === 'number'
          ? (res.data as any).aiCreditsRemaining
          : undefined;

      if (typeof remaining === 'number') {
        updateCredits(remaining);
      }
      return true;
    } else {
      setAnalysisError(res.error || 'Failed to analyze inquiry.');
      return false;
    }
  };

  const generateReplyAction = async (
    tone?: 'friendly' | 'formal' | 'concise' | 'detailed'
  ): Promise<boolean> => {
    if (!activeInquiry) return false;
    const inqId = activeInquiry.id || (activeInquiry as any)._id;
    const targetTone = tone || selectedTone || 'friendly';

    setIsGeneratingReply(true);
    setAnalysisError(null);

    const res = await api.generateInquiryReply(inqId, targetTone);
    setIsGeneratingReply(false);

    if (res.success && res.data) {
      const updated = res.data;
      setActiveInquiry(updated);
      setSelectedTone(targetTone);
      setDraft(updated.draft || updated.analysisResult?.aiSuggestedReply || '');
      setInquiries((prev) =>
        prev.map((item) => ((item.id || (item as any)._id) === inqId ? updated : item))
      );
      const remaining =
        typeof res.aiCreditsRemaining === 'number'
          ? res.aiCreditsRemaining
          : typeof (res.data as any)?.aiCreditsRemaining === 'number'
          ? (res.data as any).aiCreditsRemaining
          : undefined;

      if (typeof remaining === 'number') {
        updateCredits(remaining);
      }
      return true;
    } else {
      setAnalysisError(res.error || 'Failed to generate reply.');
      return false;
    }
  };

  const translateAnalysisAction = async (
    targetLanguage: 'en' | 'bn' = 'bn'
  ): Promise<IInquiryAnalysis | null> => {
    if (!activeInquiry) return null;
    const inqId = activeInquiry.id || (activeInquiry as any)._id;
    if (!inqId || !activeInquiry.analysisResult) return null;

    if (targetLanguage === 'en') {
      return activeInquiry.analysisResult;
    }

    // Check if already present in cached inquiry
    if (activeInquiry.analysisResult.translations && activeInquiry.analysisResult.translations[targetLanguage]) {
      return activeInquiry.analysisResult.translations[targetLanguage];
    }

    const res = await api.translateInquiryAnalysis(inqId, targetLanguage);
    if (res.success) {
      const updated = res.data;
      if (updated) {
        setActiveInquiry(updated);
        setInquiries((prev) =>
          prev.map((item) => ((item.id || (item as any)._id) === inqId ? updated : item))
        );
      }
      return (
        updated?.analysisResult?.translations?.[targetLanguage] ||
        (res as any).translatedAnalysis ||
        null
      );
    }
    return null;
  };

  const sendReplyAction = async (messageText?: string): Promise<boolean> => {
    if (!activeInquiry) return false;
    const targetId = activeInquiry.id || (activeInquiry as any)._id;
    const rawContent = (messageText !== undefined ? messageText : draft) || '';

    if (!rawContent.trim()) return false;

    // Automatically resolve template placeholders with authenticated user and active client context
    const templateContext = buildTemplateContext({ inquiry: activeInquiry, user });
    const validation = validateTemplate(rawContent, templateContext);
    if (!validation.isValid) {
      console.warn('Cannot send reply with unresolved template placeholders:', validation.unresolvedVariables);
      return false;
    }
    const contentToSend = renderTemplate(rawContent, templateContext);

    // Build updated analysisResult with aiSuggestedReply cleared,
    // preserving all other analysis results (clientWants, requiredSkills, matchedSkills, missingSkills, questionsToClarify, pricingEstimate, etc.)
    const updatedAnalysis = activeInquiry.analysisResult
      ? { ...activeInquiry.analysisResult, aiSuggestedReply: '' }
      : undefined;

    const updatePayload: Partial<IInquiry> = {
      status: 'replied',
      sentReply: contentToSend,
      draft: '',
      selectedTone: 'friendly',
      ...(updatedAnalysis ? { analysisResult: updatedAnalysis } : {}),
    };

    const res = await api.updateInquiry(targetId, updatePayload);

    if (res.success && res.data) {
      const updated = res.data;
      setActiveInquiry(updated);
      setDraft('');
      setSelectedTone('friendly');
      setInquiries((prev) =>
        prev.map((item) => ((item.id || (item as any)._id) === targetId ? updated : item))
      );
      return true;
    }
    return false;
  };

  // Filter and Sort Logic
  const filteredInquiries = inquiries
    .filter((inq) => {
      // Status filter
      if (statusFilter === 'unread') {
        if (inq.status !== 'new' && (inq as any).read) {
          return false;
        }
      } else if (statusFilter !== 'all' && inq.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesClient = inq.clientName.toLowerCase().includes(q);
        const matchesSubject = (inq.subject || '').toLowerCase().includes(q);
        const matchesMessage = inq.rawMessage.toLowerCase().includes(q);
        const matchesChannel = (inq.sourceChannel || '').toLowerCase().includes(q);
        return matchesClient || matchesSubject || matchesMessage || matchesChannel;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sort === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <InquiryContext.Provider
      value={{
        inquiries,
        filteredInquiries,
        activeInquiry,
        loading,
        error,
        searchQuery,
        statusFilter,
        sort,
        draft,
        selectedTone,
        isSavingDraft,
        isAnalyzing,
        isGeneratingReply,
        analysisError,
        fetchInquiries,
        selectInquiry,
        createNewInquiry,
        saveDraft,
        updateStatus,
        markAsReadAction,
        markAsUnreadAction,
        toggleStarAction,
        deleteInquiry,
        analyzeInquiryAction,
        generateReplyAction,
        translateAnalysisAction,
        sendReplyAction,
        setSearchQuery,
        setStatusFilter,
        setSort,
        setDraft,
        setSelectedTone,
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
};

export const useInquiry = (): InquiryContextType => {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error('useInquiry must be used within an InquiryProvider');
  }
  return context;
};
