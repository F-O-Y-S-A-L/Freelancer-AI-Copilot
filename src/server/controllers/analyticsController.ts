import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { User } from '../models/User.js';
import { Template } from '../models/Template.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import { IAnalyticsData } from '../../shared/types.js';
import { PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig.js';

const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'year', 'all', 'custom']).optional().default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface DateBucket {
  date: string;
  label: string;
  startTime: number;
  endTime: number;
  inquiries: number;
  replies: number;
}

function generateDateBuckets(
  period: '7d' | '30d' | '90d' | 'year' | 'all' | 'custom',
  startDate?: string,
  endDate?: string
): { cutoffDate: Date; maxDate: Date; buckets: DateBucket[] } {
  const now = new Date();
  let cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const buckets: DateBucket[] = [];

  if (period === '7d') {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    cutoffDate.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      buckets.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  } else if (period === '30d') {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    cutoffDate.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i -= 2) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000);
      buckets.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  } else if (period === '90d') {
    cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    cutoffDate.setHours(0, 0, 0, 0);
    // 12 weekly buckets
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
      buckets.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  } else if (period === 'year') {
    const currentYear = now.getFullYear();
    cutoffDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m <= now.getMonth(); m++) {
      const d = new Date(currentYear, m, 1, 0, 0, 0, 0);
      const nextD = new Date(currentYear, m + 1, 1, 0, 0, 0, 0);
      buckets.push({
        date: `${currentYear}-${String(m + 1).padStart(2, '0')}-01`,
        label: monthNames[m],
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  } else if (period === 'custom' && startDate) {
    cutoffDate = new Date(startDate);
    maxDate = endDate ? new Date(endDate) : now;
    maxDate.setHours(23, 59, 59, 999);
    const rangeDays = Math.max(1, Math.ceil((maxDate.getTime() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000)));
    const stepDays = Math.max(1, Math.ceil(rangeDays / 10));

    for (let t = cutoffDate.getTime(); t <= maxDate.getTime(); t += stepDays * 24 * 60 * 60 * 1000) {
      const d = new Date(t);
      const nextD = new Date(Math.min(maxDate.getTime(), t + stepDays * 24 * 60 * 60 * 1000));
      buckets.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  } else {
    // 'all'
    cutoffDate = new Date(0);
    // 6 bi-monthly buckets leading up to now
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
      buckets.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        startTime: d.getTime(),
        endTime: nextD.getTime(),
        inquiries: 0,
        replies: 0,
      });
    }
  }

  return { cutoffDate, maxDate, buckets };
}

export async function getAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = analyticsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'INVALID_QUERY_PARAMS',
        message: 'Invalid query parameters',
        details: parseResult.error.format(),
      });
      return;
    }

    const { period, startDate, endDate } = parseResult.data;
    const userId = req.userId;
    const { cutoffDate, maxDate, buckets } = generateDateBuckets(period, startDate, endDate);

    if (isUsingMemoryDB()) {
      const allUserInquiries = memoryStore.inquiries.filter((inq) => inq.userId === userId);
      const userObj = memoryStore.users.find((u) => u.id === userId || u._id === userId);
      const userTemplates = memoryStore.templates.filter((t) => t.userId === userId);

      // Filter by date
      const inquiries = allUserInquiries.filter((inq) => {
        const inqTime = new Date(inq.createdAt).getTime();
        return inqTime >= cutoffDate.getTime() && inqTime <= maxDate.getTime();
      });

      const totalInquiries = inquiries.length;

      const inquiriesByStatus = {
        new: 0,
        analyzed: 0,
        replied: 0,
        converted: 0,
        declined: 0,
        archived: 0,
      };

      const capabilityBreakdown = {
        supported: 0,
        partially_supported: 0,
        not_supported: 0,
        unassigned: 0,
      };

      let totalMin = 0;
      let totalMax = 0;
      let aiAnalysesCompleted = 0;
      let aiRepliesGenerated = 0;
      let aiAssistedRepliesCount = 0;
      const channelStatsMap: Record<
        string,
        { inquiries: number; replied: number; converted: number }
      > = {};

      const responseTimesInMinutes: number[] = [];

      for (const inq of inquiries) {
        const inqCreatedTime = new Date(inq.createdAt).getTime();

        // Count in activity timeline
        for (const bucket of buckets) {
          if (inqCreatedTime >= bucket.startTime && inqCreatedTime < bucket.endTime) {
            bucket.inquiries++;
            break;
          }
        }

        // Status count
        const st = (inq.status as keyof typeof inquiriesByStatus) || 'new';
        if (inquiriesByStatus[st] !== undefined) {
          inquiriesByStatus[st]++;
        } else {
          inquiriesByStatus.new++;
        }

        // Check if replied
        const isReplied =
          inq.status === 'replied' ||
          inq.status === 'converted' ||
          Boolean(inq.sentReply && inq.sentReply.trim().length > 0) ||
          Boolean(inq.conversationHistory?.some((m: any) => m.sender === 'freelancer'));

        // Check AI usage
        const hasAnalysis = Boolean(inq.analysisResult && Object.keys(inq.analysisResult).length > 0);
        if (hasAnalysis || inq.status !== 'new') {
          aiAnalysesCompleted++;
        }
        if (
          inq.draft ||
          inq.sentReply ||
          (inq.analysisResult?.suggestedReplies && inq.analysisResult.suggestedReplies.length > 0)
        ) {
          aiRepliesGenerated++;
        }
        if (isReplied && hasAnalysis) {
          aiAssistedRepliesCount++;
        }

        // Check Response Time from real timestamps
        if (isReplied) {
          let firstReplyTime: number | null = null;

          if (Array.isArray(inq.conversationHistory) && inq.conversationHistory.length > 0) {
            const firstFreelancerMsg = inq.conversationHistory.find(
              (m: any) => m.sender === 'freelancer' && m.createdAt
            );
            if (firstFreelancerMsg && firstFreelancerMsg.createdAt) {
              firstReplyTime = new Date(firstFreelancerMsg.createdAt).getTime();
            }
          }

          if (!firstReplyTime && inq.updatedAt && (inq.status === 'replied' || inq.sentReply)) {
            firstReplyTime = new Date(inq.updatedAt).getTime();
          }

          if (firstReplyTime && firstReplyTime >= inqCreatedTime) {
            const diffMin = Math.max(1, Math.round((firstReplyTime - inqCreatedTime) / (60 * 1000)));
            responseTimesInMinutes.push(diffMin);

            // Add to activity timeline replies
            for (const bucket of buckets) {
              if (firstReplyTime >= bucket.startTime && firstReplyTime < bucket.endTime) {
                bucket.replies++;
                break;
              }
            }
          }
        }

        // Capability count
        if (inq.analysisResult && inq.analysisResult.capability) {
          const cap = inq.analysisResult.capability as keyof typeof capabilityBreakdown;
          if (capabilityBreakdown[cap] !== undefined) {
            capabilityBreakdown[cap]++;
          } else {
            capabilityBreakdown.unassigned++;
          }
        } else {
          capabilityBreakdown.unassigned++;
        }

        // Pipeline value
        if (inq.analysisResult?.pricingEstimate) {
          totalMin += Number(inq.analysisResult.pricingEstimate.minPrice || 0);
          totalMax += Number(inq.analysisResult.pricingEstimate.maxPrice || 0);
        }

        // Channel stats
        const channel = (inq.sourceChannel || 'Direct/Other').trim();
        if (!channelStatsMap[channel]) {
          channelStatsMap[channel] = { inquiries: 0, replied: 0, converted: 0 };
        }
        channelStatsMap[channel].inquiries++;
        if (isReplied) channelStatsMap[channel].replied++;
        if (inq.status === 'converted') channelStatsMap[channel].converted++;
      }

      const repliedCount = inquiriesByStatus.replied + inquiriesByStatus.converted;
      const pendingCount = inquiriesByStatus.new + inquiriesByStatus.analyzed;
      const responseRate = totalInquiries > 0
        ? Number(((repliedCount / totalInquiries) * 100).toFixed(1))
        : 0;

      const conversionRate = totalInquiries > 0
        ? Number(((inquiriesByStatus.converted / totalInquiries) * 100).toFixed(1))
        : 0;

      const hasReliableResponseTime = responseTimesInMinutes.length > 0;
      const averageMinutes = hasReliableResponseTime
        ? Math.round(responseTimesInMinutes.reduce((a, b) => a + b, 0) / responseTimesInMinutes.length)
        : null;
      const fastestMinutes = hasReliableResponseTime
        ? Math.min(...responseTimesInMinutes)
        : null;
      const slowestMinutes = hasReliableResponseTime
        ? Math.max(...responseTimesInMinutes)
        : null;

      const responseTimeDistribution = {
        under1h: responseTimesInMinutes.filter((m) => m < 60).length,
        between1hAnd6h: responseTimesInMinutes.filter((m) => m >= 60 && m < 360).length,
        between6hAnd24h: responseTimesInMinutes.filter((m) => m >= 360 && m < 1440).length,
        over24h: responseTimesInMinutes.filter((m) => m >= 1440).length,
      };

      const remainingCredits = userObj?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
      const totalCredits = PRO_PLAN_AI_CREDITS_LIMIT;
      const usedCredits = Math.max(0, totalCredits - remainingCredits);
      const usagePercentage = Number(((usedCredits / totalCredits) * 100).toFixed(1));

      const sourcePerformance = Object.entries(channelStatsMap)
        .map(([source, stats]) => ({
          source,
          inquiries: stats.inquiries,
          replied: stats.replied,
          converted: stats.converted,
          responseRate: stats.inquiries > 0 ? Number(((stats.replied / stats.inquiries) * 100).toFixed(1)) : 0,
          percentage: totalInquiries > 0 ? Number(((stats.inquiries / totalInquiries) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.inquiries - a.inquiries);

      const channelDistribution = sourcePerformance.map((s) => ({
        channel: s.source,
        count: s.inquiries,
        percentage: s.percentage,
      }));

      const aiAssistedReplyRate = repliedCount > 0
        ? Number(((aiAssistedRepliesCount / repliedCount) * 100).toFixed(1))
        : 0;

      const analyticsData: IAnalyticsData = {
        period,
        startDate: cutoffDate.toISOString(),
        endDate: maxDate.toISOString(),
        totalInquiries,
        repliedCount,
        pendingCount,
        responseRate,
        conversionRate,
        responseTime: {
          averageMinutes,
          fastestMinutes,
          slowestMinutes,
          hasReliableData: hasReliableResponseTime,
          distribution: responseTimeDistribution,
        },
        inquiriesByStatus,
        activityTimeline: buckets.map((b) => ({
          date: b.date,
          label: b.label,
          inquiries: b.inquiries,
          replies: b.replies,
        })),
        aiUsage: {
          analysesCompleted: aiAnalysesCompleted,
          repliesGenerated: aiRepliesGenerated,
          templatesCount: userTemplates.length,
          aiAssistedReplyRate,
          remainingCredits,
          totalCredits,
          usedCredits,
          usagePercentage,
        },
        capabilityBreakdown,
        pipelineValue: {
          totalMin,
          totalMax,
          currency: 'USD',
        },
        aiCreditUsage: {
          remainingCredits,
          totalCredits,
          usedCredits,
          usagePercentage,
        },
        sourcePerformance,
        channelDistribution,
      };

      res.json({ success: true, data: analyticsData });
      return;
    }

    // Mongoose MongoDB query mode
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [userDoc, templatesCount, rawInquiries] = await Promise.all([
      User.findById(userId),
      Template.countDocuments({ userId: userObjectId }),
      Inquiry.find({
        userId: userObjectId,
        createdAt: { $gte: cutoffDate, $lte: maxDate },
      }).lean(),
    ]);

    const totalInquiries = rawInquiries.length;

    const inquiriesByStatus = {
      new: 0,
      analyzed: 0,
      replied: 0,
      converted: 0,
      declined: 0,
      archived: 0,
    };

    const capabilityBreakdown = {
      supported: 0,
      partially_supported: 0,
      not_supported: 0,
      unassigned: 0,
    };

    let totalMin = 0;
    let totalMax = 0;
    let aiAnalysesCompleted = 0;
    let aiRepliesGenerated = 0;
    let aiAssistedRepliesCount = 0;
    const channelStatsMap: Record<
      string,
      { inquiries: number; replied: number; converted: number }
    > = {};

    const responseTimesInMinutes: number[] = [];

    for (const inq of rawInquiries) {
      const inqCreatedTime = new Date(inq.createdAt).getTime();

      // Count in activity timeline
      for (const bucket of buckets) {
        if (inqCreatedTime >= bucket.startTime && inqCreatedTime < bucket.endTime) {
          bucket.inquiries++;
          break;
        }
      }

      // Status count
      const st = (inq.status as keyof typeof inquiriesByStatus) || 'new';
      if (inquiriesByStatus[st] !== undefined) {
        inquiriesByStatus[st]++;
      } else {
        inquiriesByStatus.new++;
      }

      // Check if replied
      const isReplied =
        inq.status === 'replied' ||
        inq.status === 'converted' ||
        Boolean(inq.sentReply && inq.sentReply.trim().length > 0) ||
        Boolean((inq as any).conversationHistory?.some((m: any) => m.sender === 'freelancer'));

      // Check AI usage
      const hasAnalysis = Boolean(inq.analysisResult && Object.keys(inq.analysisResult).length > 0);
      if (hasAnalysis || inq.status !== 'new') {
        aiAnalysesCompleted++;
      }
      if (
        inq.draft ||
        inq.sentReply ||
        ((inq.analysisResult as any)?.suggestedReplies && (inq.analysisResult as any).suggestedReplies.length > 0)
      ) {
        aiRepliesGenerated++;
      }
      if (isReplied && hasAnalysis) {
        aiAssistedRepliesCount++;
      }

      // Check Response Time from real timestamps
      if (isReplied) {
        let firstReplyTime: number | null = null;

        if (Array.isArray((inq as any).conversationHistory) && (inq as any).conversationHistory.length > 0) {
          const firstFreelancerMsg = (inq as any).conversationHistory.find(
            (m: any) => m.sender === 'freelancer' && m.createdAt
          );
          if (firstFreelancerMsg && firstFreelancerMsg.createdAt) {
            firstReplyTime = new Date(firstFreelancerMsg.createdAt).getTime();
          }
        }

        if (!firstReplyTime && inq.updatedAt && (inq.status === 'replied' || inq.sentReply)) {
          firstReplyTime = new Date(inq.updatedAt).getTime();
        }

        if (firstReplyTime && firstReplyTime >= inqCreatedTime) {
          const diffMin = Math.max(1, Math.round((firstReplyTime - inqCreatedTime) / (60 * 1000)));
          responseTimesInMinutes.push(diffMin);

          // Add to activity timeline replies
          for (const bucket of buckets) {
            if (firstReplyTime >= bucket.startTime && firstReplyTime < bucket.endTime) {
              bucket.replies++;
              break;
            }
          }
        }
      }

      // Capability count
      if ((inq.analysisResult as any)?.capability) {
        const cap = (inq.analysisResult as any).capability as keyof typeof capabilityBreakdown;
        if (capabilityBreakdown[cap] !== undefined) {
          capabilityBreakdown[cap]++;
        } else {
          capabilityBreakdown.unassigned++;
        }
      } else {
        capabilityBreakdown.unassigned++;
      }

      // Pipeline value
      if ((inq.analysisResult as any)?.pricingEstimate) {
        totalMin += Number((inq.analysisResult as any).pricingEstimate.minPrice || 0);
        totalMax += Number((inq.analysisResult as any).pricingEstimate.maxPrice || 0);
      }

      // Channel stats
      const channel = (inq.sourceChannel || 'Direct/Other').trim();
      if (!channelStatsMap[channel]) {
        channelStatsMap[channel] = { inquiries: 0, replied: 0, converted: 0 };
      }
      channelStatsMap[channel].inquiries++;
      if (isReplied) channelStatsMap[channel].replied++;
      if (inq.status === 'converted') channelStatsMap[channel].converted++;
    }

    const repliedCount = inquiriesByStatus.replied + inquiriesByStatus.converted;
    const pendingCount = inquiriesByStatus.new + inquiriesByStatus.analyzed;
    const responseRate = totalInquiries > 0
      ? Number(((repliedCount / totalInquiries) * 100).toFixed(1))
      : 0;

    const conversionRate = totalInquiries > 0
      ? Number(((inquiriesByStatus.converted / totalInquiries) * 100).toFixed(1))
      : 0;

    const hasReliableResponseTime = responseTimesInMinutes.length > 0;
    const averageMinutes = hasReliableResponseTime
      ? Math.round(responseTimesInMinutes.reduce((a, b) => a + b, 0) / responseTimesInMinutes.length)
      : null;
    const fastestMinutes = hasReliableResponseTime
      ? Math.min(...responseTimesInMinutes)
      : null;
    const slowestMinutes = hasReliableResponseTime
      ? Math.max(...responseTimesInMinutes)
      : null;

    const responseTimeDistribution = {
      under1h: responseTimesInMinutes.filter((m) => m < 60).length,
      between1hAnd6h: responseTimesInMinutes.filter((m) => m >= 60 && m < 360).length,
      between6hAnd24h: responseTimesInMinutes.filter((m) => m >= 360 && m < 1440).length,
      over24h: responseTimesInMinutes.filter((m) => m >= 1440).length,
    };

    const remainingCredits = userDoc?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
    const totalCredits = PRO_PLAN_AI_CREDITS_LIMIT;
    const usedCredits = Math.max(0, totalCredits - remainingCredits);
    const usagePercentage = Number(((usedCredits / totalCredits) * 100).toFixed(1));

    const sourcePerformance = Object.entries(channelStatsMap)
      .map(([source, stats]) => ({
        source,
        inquiries: stats.inquiries,
        replied: stats.replied,
        converted: stats.converted,
        responseRate: stats.inquiries > 0 ? Number(((stats.replied / stats.inquiries) * 100).toFixed(1)) : 0,
        percentage: totalInquiries > 0 ? Number(((stats.inquiries / totalInquiries) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.inquiries - a.inquiries);

    const channelDistribution = sourcePerformance.map((s) => ({
      channel: s.source,
      count: s.inquiries,
      percentage: s.percentage,
    }));

    const aiAssistedReplyRate = repliedCount > 0
      ? Number(((aiAssistedRepliesCount / repliedCount) * 100).toFixed(1))
      : 0;

    const analyticsData: IAnalyticsData = {
      period,
      startDate: cutoffDate.toISOString(),
      endDate: maxDate.toISOString(),
      totalInquiries,
      repliedCount,
      pendingCount,
      responseRate,
      conversionRate,
      responseTime: {
        averageMinutes,
        fastestMinutes,
        slowestMinutes,
        hasReliableData: hasReliableResponseTime,
        distribution: responseTimeDistribution,
      },
      inquiriesByStatus,
      activityTimeline: buckets.map((b) => ({
        date: b.date,
        label: b.label,
        inquiries: b.inquiries,
        replies: b.replies,
      })),
      aiUsage: {
        analysesCompleted: aiAnalysesCompleted,
        repliesGenerated: aiRepliesGenerated,
        templatesCount,
        aiAssistedReplyRate,
        remainingCredits,
        totalCredits,
        usedCredits,
        usagePercentage,
      },
      capabilityBreakdown,
      pipelineValue: {
        totalMin,
        totalMax,
        currency: 'USD',
      },
      aiCreditUsage: {
        remainingCredits,
        totalCredits,
        usedCredits,
        usagePercentage,
      },
      sourcePerformance,
      channelDistribution,
    };

    res.json({ success: true, data: analyticsData });
  } catch (error) {
    next(error);
  }
}

