import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { IAnalyticsData } from '../../shared/types';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Inbox,
  Send,
  Clock,
  Timer,
  Bot,
  Sparkles,
  FileText,
  Percent,
  Calendar,
  Layers,
  ChevronDown,
  AlertCircle,
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onNavigateTab?: (tab: 'inquiries' | 'templates' | 'followups' | 'knowledge' | 'analytics' | 'settings') => void;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

type PeriodType = '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';

const PERIOD_LABELS: Record<PeriodType, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  year: 'This Year',
  all: 'All Time',
  custom: 'Custom Range',
};

export function AnalyticsDashboard({ onNavigateTab }: AnalyticsDashboardProps) {
  const [data, setData] = useState<IAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const customRange =
        period === 'custom' && customStart && customEnd
          ? { startDate: customStart, endDate: customEnd }
          : undefined;

      const res = await api.getAnalytics(period, customRange);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchAnalytics();
    }
  }, [period]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPeriod = (newPeriod: PeriodType) => {
    setIsDropdownOpen(false);
    if (newPeriod === 'custom') {
      setShowCustomModal(true);
    } else {
      setPeriod(newPeriod);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setShowCustomModal(false);
      setPeriod('custom');
      fetchAnalytics();
    }
  };

  // Loading State skeleton
  if (loading && !data) {
    return (
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded-md w-32" />
              <div className="h-3.5 bg-slate-100 rounded-md w-56" />
            </div>
            <div className="h-9 bg-slate-100 rounded-xl w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200/80 p-4" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-xl border border-slate-200/80" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 bg-white rounded-xl border border-slate-200/80" />
            <div className="h-56 bg-white rounded-xl border border-slate-200/80" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-6 bg-white border border-rose-100 rounded-2xl max-w-sm w-full space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Failed to load analytics</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const analytics = data!;

  // Timeline scaling calculations
  const timeline = analytics.activityTimeline || [];
  const maxActivity = Math.max(...timeline.map((b) => Math.max(b.inquiries, b.replies)), 1);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your inquiry and AI performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Lightweight Date Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl shadow-xs transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{PERIOD_LABELS[period]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-xs animate-in fade-in-50 duration-100">
                {(['7d', '30d', '90d', 'year', 'all'] as PeriodType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPeriod(p)}
                    className={`w-full text-left px-3 py-1.5 transition cursor-pointer flex items-center justify-between ${
                      period === p
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{PERIOD_LABELS[p]}</span>
                    {period === p && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => handleSelectPeriod('custom')}
                  className={`w-full text-left px-3 py-1.5 transition cursor-pointer flex items-center justify-between ${
                    period === 'custom'
                      ? 'bg-violet-50 text-violet-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Custom Range...</span>
                  {period === 'custom' && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleApplyCustomRange}
            className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4 text-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Select Custom Range</h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Level 1: 4 Simplified Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inquiries */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500">Total Inquiries</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics.totalInquiries}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {analytics.inquiriesByStatus.new} new, {analytics.inquiriesByStatus.analyzed} analyzed
            </div>
          </div>
        </div>

        {/* 2. Replied */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500">Replied</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics.repliedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {analytics.inquiriesByStatus.converted > 0
                ? `${analytics.inquiriesByStatus.converted} converted leads`
                : 'inquiries replied'}
            </div>
          </div>
        </div>

        {/* 3. Requires Reply */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500">Requires Reply</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics.pendingCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {analytics.pendingCount === 0 ? (
                <span className="text-emerald-600 font-medium">All caught up</span>
              ) : (
                'awaiting response'
              )}
            </div>
          </div>
        </div>

        {/* 4. Response Rate */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500">Response Rate</span>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics.responseRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {analytics.repliedCount} of {analytics.totalInquiries} inquiries
            </div>
          </div>
        </div>
      </div>

      {/* Empty State when no inquiry data exists */}
      {analytics.totalInquiries === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">No inquiry data yet</h3>
            <p className="text-xs text-slate-500">
              Your analytics will appear here once you start receiving inquiries.
            </p>
          </div>
          {onNavigateTab && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('inquiries')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Go to Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Level 2: Main Inquiry Activity Chart */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Inquiry Activity</h2>
                <p className="text-xs text-slate-500">Inquiries received vs. replies sent over time</p>
              </div>

              {/* Minimal Chart Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                  <span className="text-slate-600">Inquiries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Replies</span>
                </div>
              </div>
            </div>

            {/* Clean, spacious timeline chart */}
            <div className="pt-2">
              <div className="relative h-44 w-full flex items-end gap-1 sm:gap-2 px-1 border-b border-slate-100">
                {/* Horizontal reference line */}
                <div className="absolute inset-x-0 top-1/2 border-b border-slate-100/80 pointer-events-none" />

                {timeline.map((bucket, idx) => {
                  const inqHeight = (bucket.inquiries / maxActivity) * 100;
                  const replyHeight = (bucket.replies / maxActivity) * 100;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={bucket.date + idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 flex flex-col justify-end items-center h-full relative cursor-pointer group"
                    >
                      {/* Bar Group */}
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-1/2 max-w-[14px] bg-violet-500/85 group-hover:bg-violet-600 rounded-t-sm transition-all duration-200"
                          style={{ height: `${Math.max(inqHeight, bucket.inquiries > 0 ? 6 : 1)}%` }}
                        />
                        <div
                          className="w-1/2 max-w-[14px] bg-emerald-500/85 group-hover:bg-emerald-600 rounded-t-sm transition-all duration-200"
                          style={{ height: `${Math.max(replyHeight, bucket.replies > 0 ? 6 : 1)}%` }}
                        />
                      </div>

                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-xs shadow-lg space-y-0.5 pointer-events-none whitespace-nowrap min-w-[100px]">
                          <div className="font-semibold text-slate-300 text-[11px] border-b border-slate-800 pb-0.5">
                            {bucket.label}
                          </div>
                          <div className="flex justify-between items-center gap-3 text-[11px]">
                            <span className="text-violet-300">Inquiries:</span>
                            <span className="font-mono font-bold">{bucket.inquiries}</span>
                          </div>
                          <div className="flex justify-between items-center gap-3 text-[11px]">
                            <span className="text-emerald-300">Replies:</span>
                            <span className="font-mono font-bold">{bucket.replies}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* X-axis date labels */}
              <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-slate-400 font-mono">
                {timeline.length <= 10
                  ? timeline.map((b) => (
                      <span key={b.date} className="truncate text-center">
                        {b.label}
                      </span>
                    ))
                  : [
                      timeline[0],
                      timeline[Math.floor(timeline.length / 2)],
                      timeline[timeline.length - 1],
                    ].map((b, i) => (
                      <span key={i} className="truncate text-center">
                        {b?.label}
                      </span>
                    ))}
              </div>
            </div>
          </div>

          {/* Level 3: Two-Column Secondary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Inquiry Status */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inquiry Status
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {analytics.totalInquiries} total
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Replied / Converted */}
                <div>
                  <div className="flex justify-between items-center text-slate-700 font-medium mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Replied / Converted
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {analytics.repliedCount}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          analytics.totalInquiries > 0
                            ? (analytics.repliedCount / analytics.totalInquiries) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Requires Reply (New + Analyzed) */}
                <div>
                  <div className="flex justify-between items-center text-slate-700 font-medium mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Requires Reply (New / Analyzed)
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {analytics.pendingCount}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          analytics.totalInquiries > 0
                            ? (analytics.pendingCount / analytics.totalInquiries) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Declined */}
                {analytics.inquiriesByStatus.declined > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-slate-700 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Declined
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {analytics.inquiriesByStatus.declined}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-400 h-full transition-all duration-300"
                        style={{
                          width: `${
                            (analytics.inquiriesByStatus.declined / analytics.totalInquiries) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Archived */}
                {analytics.inquiriesByStatus.archived > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-slate-700 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Archived
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {analytics.inquiriesByStatus.archived}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-400 h-full transition-all duration-300"
                        style={{
                          width: `${
                            (analytics.inquiriesByStatus.archived / analytics.totalInquiries) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Response Performance */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Response Performance
                </h3>
                <Timer className="w-4 h-4 text-slate-400" />
              </div>

              {analytics.responseTime.hasReliableData ? (
                <div className="space-y-4">
                  {/* Primary Average Metric */}
                  <div className="flex items-baseline justify-between bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">Average response time</div>
                      <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-0.5">
                        {formatDuration(analytics.responseTime.averageMinutes)}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                      <div>
                        Fastest: <span className="font-mono font-semibold text-slate-700">{formatDuration(analytics.responseTime.fastestMinutes)}</span>
                      </div>
                      <div>
                        Slowest: <span className="font-mono font-semibold text-slate-700">{formatDuration(analytics.responseTime.slowestMinutes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean speed distribution */}
                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] font-semibold text-slate-700">Response Speed Distribution</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-slate-500 text-[10px]">&lt; 1h</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">
                          {analytics.responseTime.distribution.under1h}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-slate-500 text-[10px]">1–6h</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">
                          {analytics.responseTime.distribution.between1hAnd6h}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-slate-500 text-[10px]">6–24h</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">
                          {analytics.responseTime.distribution.between6hAnd24h}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-slate-500 text-[10px]">&gt; 24h</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">
                          {analytics.responseTime.distribution.over24h}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                  <Clock className="w-5 h-5 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">No response timestamps yet</p>
                  <p className="text-[11px] text-slate-400">
                    Response time will calculate automatically as you reply.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Level 4: Compact AI Usage & Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: AI Usage */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-violet-600" />
                  AI Usage
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {analytics.aiUsage.remainingCredits} credits left
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="text-slate-500 text-[11px]">AI Analyses</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {analytics.aiUsage.analysesCompleted}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="text-slate-500 text-[11px]">AI Replies</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {analytics.aiUsage.repliesGenerated}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="text-slate-500 text-[11px]">Templates</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {analytics.aiUsage.templatesCount}
                  </div>
                </div>
              </div>

              {/* Compact AI Credits Meter */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>AI Credits Usage</span>
                  <span className="font-mono font-medium text-slate-700">
                    {analytics.aiUsage.usedCredits} / {analytics.aiUsage.totalCredits}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full transition-all duration-300"
                    style={{
                      width: `${analytics.aiUsage.usagePercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Lead Sources */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inquiry Sources
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Channel breakdown</span>
              </div>

              {analytics.sourcePerformance && analytics.sourcePerformance.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {analytics.sourcePerformance.map((src) => (
                    <div key={src.source} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-slate-800">{src.source}</span>
                        <div className="flex items-center gap-2 font-mono text-slate-600">
                          <span>{src.percentage}%</span>
                          <span className="text-slate-400">({src.inquiries})</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-violet-600 h-full transition-all duration-300"
                          style={{ width: `${src.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No source channel data recorded for this period.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
