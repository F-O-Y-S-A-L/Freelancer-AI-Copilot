import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IFollowUp, IFollowUpSummary } from '../shared/types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface FollowUpContextType {
  followUps: IFollowUp[];
  summary: IFollowUpSummary;
  thresholdDays: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  activeFilter: string;
  searchQuery: string;
  fetchFollowUps: (statusOverride?: string, searchOverride?: string) => Promise<void>;
  generateFollowUpDraft: (params: {
    followUpId?: string;
    inquiryId?: string;
    tone?: 'friendly' | 'formal' | 'concise' | 'detailed';
    templateId?: string;
    notes?: string;
  }) => Promise<{ generatedMessage: string; tone: string; aiCreditsRemaining?: number } | null>;
  scheduleFollowUpAction: (id: string, scheduledFor: string, notes?: string) => Promise<boolean>;
  snoozeFollowUpAction: (id: string, snoozedUntil: string, notes?: string) => Promise<boolean>;
  dismissFollowUpAction: (id: string) => Promise<boolean>;
  sendFollowUpAction: (id: string, message: string) => Promise<boolean>;
  setActiveFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
}

const initialSummary: IFollowUpSummary = {
  dueCount: 0,
  scheduledCount: 0,
  completedCount: 0,
  noResponseCount: 0,
  totalActiveFollowUps: 0,
};

const FollowUpContext = createContext<FollowUpContextType | undefined>(undefined);

export const FollowUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCredits } = useAuth();
  const [followUps, setFollowUps] = useState<IFollowUp[]>([]);
  const [summary, setSummary] = useState<IFollowUpSummary>(initialSummary);
  const [thresholdDays, setThresholdDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchFollowUps = useCallback(
    async (statusOverride?: string, searchOverride?: string) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const filter = statusOverride !== undefined ? statusOverride : activeFilter;
        const search = searchOverride !== undefined ? searchOverride : searchQuery;
        const res = await api.getFollowUps({ status: filter, search });
        if (res.success && res.data) {
          setFollowUps(res.data.followUps || []);
          setSummary(res.data.summary || initialSummary);
          setThresholdDays(res.data.thresholdDays || 3);
        } else {
          setError(res.error || 'Failed to load follow-up reminders');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching follow-ups');
      } finally {
        setLoading(false);
      }
    },
    [user, activeFilter, searchQuery]
  );

  useEffect(() => {
    if (user) {
      fetchFollowUps();
    } else {
      setFollowUps([]);
      setSummary(initialSummary);
    }
  }, [user, activeFilter]);

  const generateFollowUpDraft = async (params: {
    followUpId?: string;
    inquiryId?: string;
    tone?: 'friendly' | 'formal' | 'concise' | 'detailed';
    templateId?: string;
    notes?: string;
  }) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.generateFollowUp(params);
      if (res.success && res.data) {
        if (params.followUpId) {
          setFollowUps((prev) =>
            prev.map((f) =>
              (f.id === params.followUpId || f._id === params.followUpId)
                ? { ...f, generatedMessage: res.data!.generatedMessage, tone: (res.data!.tone as any) || f.tone }
                : f
            )
          );
        }
        const remaining =
          typeof res.aiCreditsRemaining === 'number'
            ? res.aiCreditsRemaining
            : typeof res.data.aiCreditsRemaining === 'number'
            ? res.data.aiCreditsRemaining
            : undefined;

        if (typeof remaining === 'number') {
          updateCredits(remaining);
        }
        return res.data;
      } else {
        setError(res.error || 'Failed to generate follow-up message');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate follow-up');
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const scheduleFollowUpAction = async (id: string, scheduledFor: string, notes?: string) => {
    setActionLoading(true);
    try {
      const res = await api.scheduleFollowUp(id, { scheduledFor, notes });
      if (res.success && res.data) {
        await fetchFollowUps();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const snoozeFollowUpAction = async (id: string, snoozedUntil: string, notes?: string) => {
    setActionLoading(true);
    try {
      const res = await api.snoozeFollowUp(id, { snoozedUntil, notes });
      if (res.success && res.data) {
        await fetchFollowUps();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const dismissFollowUpAction = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await api.dismissFollowUp(id);
      if (res.success) {
        await fetchFollowUps();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const sendFollowUpAction = async (id: string, message: string) => {
    setActionLoading(true);
    try {
      const res = await api.sendFollowUp(id, { message });
      if (res.success && res.data) {
        await fetchFollowUps();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <FollowUpContext.Provider
      value={{
        followUps,
        summary,
        thresholdDays,
        loading,
        actionLoading,
        error,
        activeFilter,
        searchQuery,
        fetchFollowUps,
        generateFollowUpDraft,
        scheduleFollowUpAction,
        snoozeFollowUpAction,
        dismissFollowUpAction,
        sendFollowUpAction,
        setActiveFilter,
        setSearchQuery,
      }}
    >
      {children}
    </FollowUpContext.Provider>
  );
};

export const useFollowUps = () => {
  const context = useContext(FollowUpContext);
  if (!context) {
    throw new Error('useFollowUps must be used within a FollowUpProvider');
  }
  return context;
};
