import { IAuthResponse, IUser, IUserProfile, ITemplate, IInquiry, IInquiryAnalysis, INotification, IApiResponse, IAnalyticsData, IUsageData, IFollowUp, IFollowUpSummary } from '../shared/types';

const TOKEN_KEY = 'freelancer_copilot_token';
const REFRESH_TOKEN_KEY = 'freelancer_copilot_refresh_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(refreshToken: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function removeStoredRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string | null) => void)[] = [];

function onRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function trySilentRefresh(): Promise<string | null> {
  const currentRefreshToken = getStoredRefreshToken();
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken || undefined }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.token) {
      const newAccessToken = data.data.token;
      setStoredToken(newAccessToken);
      if (data.data.refreshToken) {
        setStoredRefreshToken(data.data.refreshToken);
      }
      return newAccessToken;
    }
  } catch {
    // Refresh failed
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<IApiResponse<T>> {
  let token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Handle expired token with silent refresh (except for auth routes)
    if (
      response.status === 401 &&
      !endpoint.includes('/api/auth/login') &&
      !endpoint.includes('/api/auth/register') &&
      !endpoint.includes('/api/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await trySilentRefresh();
        isRefreshing = false;
        onRefreshed(newToken);

        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
        }
      } else {
        // Wait for active refresh
        const refreshedToken = await new Promise<string | null>((resolve) => {
          refreshSubscribers.push(resolve);
        });
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`;
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
        }
      }
    }

    let data: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        data = { success: false, error: text || `HTTP ${response.status}` };
      }
    } else {
      const text = await response.text();
      data = {
        success: false,
        error: !response.ok
          ? `Server error (${response.status}): ${text.slice(0, 150).trim() || response.statusText}`
          : text,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Request failed with status ' + response.status,
        details: data.details,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network communication error',
    };
  }
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<IAuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<IAuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  refreshToken: (payload?: { refreshToken?: string }) =>
    request<{ token: string; accessToken: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(payload || { refreshToken: getStoredRefreshToken() || undefined }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: getStoredRefreshToken() || undefined }),
    }),

  getMe: () => request<IUser>('/api/auth/me'),

  // Profile
  getProfile: () => request<IUserProfile & { name?: string }>('/api/profile'),

  updateProfile: (updates: Partial<IUserProfile> & { name?: string }) =>
    request<IUserProfile & { name?: string }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Templates
  getTemplates: () => request<ITemplate[]>('/api/templates'),

  getTemplate: (id: string) => request<ITemplate>('/api/templates/' + id),

  createTemplate: (payload: {
    title: string;
    category: string;
    content: string;
    description?: string;
  }) =>
    request<ITemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTemplate: (id: string, updates: Partial<ITemplate>) =>
    request<ITemplate>('/api/templates/' + id, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTemplate: (id: string) =>
    request<{ success: boolean }>('/api/templates/' + id, {
      method: 'DELETE',
    }),

  // Inquiries
  getInquiries: () => request<IInquiry[]>('/api/inquiries'),

  getInquiry: (id: string) => request<IInquiry>('/api/inquiries/' + id),

  createInquiry: (payload: {
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
  }) =>
    request<IInquiry>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateInquiry: (id: string, updates: Partial<IInquiry>) =>
    request<IInquiry>('/api/inquiries/' + id, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  markInquiryAsRead: (id: string) =>
    request<IInquiry>('/api/inquiries/' + id + '/read', {
      method: 'PATCH',
    }),

  toggleStarInquiry: (id: string, starred?: boolean) =>
    request<IInquiry>('/api/inquiries/' + id + '/star', {
      method: 'PATCH',
      body: JSON.stringify(typeof starred === 'boolean' ? { starred } : {}),
    }),

  deleteInquiry: (id: string) =>
    request<{ success: boolean }>('/api/inquiries/' + id, {
      method: 'DELETE',
    }),

  analyzeInquiry: (
    id: string,
    payload?: { screenshotData?: string; screenshotMimeType?: string; fileName?: string }
  ) =>
    request<IInquiry & { aiCreditsRemaining?: number }>('/api/inquiries/' + id + '/analyze', {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  generateInquiryReply: (id: string, tone: 'friendly' | 'formal' | 'concise' | 'detailed') =>
    request<IInquiry & { aiCreditsRemaining?: number }>('/api/inquiries/' + id + '/reply', {
      method: 'POST',
      body: JSON.stringify({ tone }),
    }),

  translateInquiryAnalysis: (id: string, targetLanguage: 'bn' = 'bn') =>
    request<IInquiry & { translatedAnalysis?: IInquiryAnalysis }>('/api/inquiries/' + id + '/translate-analysis', {
      method: 'POST',
      body: JSON.stringify({ targetLanguage }),
    }),

  // Analytics & Usage
  getAnalytics: (
    period: '7d' | '30d' | '90d' | 'year' | 'all' | 'custom' = '30d',
    customRange?: { startDate?: string; endDate?: string }
  ) => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (customRange?.startDate) params.set('startDate', customRange.startDate);
    if (customRange?.endDate) params.set('endDate', customRange.endDate);
    return request<IAnalyticsData>('/api/analytics?' + params.toString());
  },

  getUsage: () => request<IUsageData>('/api/usage'),

  // Notifications
  getNotifications: () => request<INotification[]>('/api/notifications'),

  getUnreadNotificationCount: () =>
    request<{ count: number }>('/api/notifications/unread-count'),

  markNotificationAsRead: (id: string) =>
    request<INotification>('/api/notifications/' + id + '/read', {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: () =>
    request<{ count: number }>('/api/notifications/mark-all-read', {
      method: 'POST',
    }),

  deleteNotification: (id: string) =>
    request<{ success: boolean }>('/api/notifications/' + id, {
      method: 'DELETE',
    }),

  // Follow-ups
  getFollowUps: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request<{ followUps: IFollowUp[]; summary: IFollowUpSummary; thresholdDays: number }>(
      '/api/followups' + (qs ? '?' + qs : '')
    );
  },

  generateFollowUp: (payload: {
    followUpId?: string;
    inquiryId?: string;
    tone?: 'friendly' | 'formal' | 'concise' | 'detailed';
    templateId?: string;
    notes?: string;
  }) =>
    request<{
      generatedMessage: string;
      tone: string;
      aiCreditsRemaining?: number;
      followUp?: IFollowUp;
    }>('/api/followups/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  scheduleFollowUp: (id: string, payload: { scheduledFor: string; notes?: string }) =>
    request<IFollowUp>('/api/followups/' + id + '/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  snoozeFollowUp: (id: string, payload: { snoozedUntil: string; notes?: string }) =>
    request<IFollowUp>('/api/followups/' + id + '/snooze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  dismissFollowUp: (id: string) =>
    request<IFollowUp>('/api/followups/' + id + '/dismiss', {
      method: 'POST',
    }),

  sendFollowUp: (id: string, payload: { message: string }) =>
    request<{ followUp: IFollowUp; inquiry: IInquiry }>('/api/followups/' + id + '/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Health
  checkHealth: () => request<{ status: string; service: string }>('/api/health'),
};
