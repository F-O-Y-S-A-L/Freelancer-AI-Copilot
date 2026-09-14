import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import { IUsageData } from '../../shared/types.js';
import { PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig.js';

export async function getUsage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const userObj = memoryStore.users.find((u) => u.id === userId || u._id === userId);
      const remainingCredits = userObj?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
      const totalCredits = PRO_PLAN_AI_CREDITS_LIMIT;
      const usedCredits = Math.max(0, totalCredits - remainingCredits);
      const usagePercentage = Number(((usedCredits / totalCredits) * 100).toFixed(1));

      const usageData: IUsageData = {
        aiCreditsRemaining: remainingCredits,
        totalCredits,
        usedCredits,
        usagePercentage,
      };

      res.json({ success: true, data: usageData });
      return;
    }

    const userDoc = await User.findById(userId);
    const remainingCredits = userDoc?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
    const totalCredits = PRO_PLAN_AI_CREDITS_LIMIT;
    const usedCredits = Math.max(0, totalCredits - remainingCredits);
    const usagePercentage = Number(((usedCredits / totalCredits) * 100).toFixed(1));

    const usageData: IUsageData = {
      aiCreditsRemaining: remainingCredits,
      totalCredits,
      usedCredits,
      usagePercentage,
    };

    res.json({ success: true, data: usageData });
  } catch (error) {
    next(error);
  }
}
