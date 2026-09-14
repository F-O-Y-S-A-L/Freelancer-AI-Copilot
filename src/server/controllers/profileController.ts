import { Response, NextFunction } from 'express';
import { UserProfile } from '../models/UserProfile.js';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import { DEFAULT_AVATAR } from '../../shared/types.js';

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      let profile = memoryStore.profiles.find((p) => p.userId === userId);
      const user = memoryStore.users.find((u) => u.id === userId);

      if (!profile) {
        profile = {
          id: 'prof_' + userId,
          userId: userId,
          profession: '',
          professions: [],
          categories: [],
          specializations: [],
          experienceLevel: 'mid',
          bio: '',
          avatar: user?.avatar || DEFAULT_AVATAR,
          skills: [],
          toolsAndFrameworks: [],
          supportedWork: [],
          unsupportedWork: [],
          services: [],
          pricingRules: {
            minProjectPrice: 0,
            hourlyRate: 0,
            rushOrderMultiplier: 1.0,
            currency: 'USD',
          },
          businessRules: [],
          maxRevisions: 0,
          depositPercentage: 0,
          communicationTone: 'friendly',
          followUpThresholdDays: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.profiles.push(profile);
      }

      res.json({
        success: true,
        data: {
          ...profile,
          followUpThresholdDays:
            typeof profile.followUpThresholdDays === 'number' && profile.followUpThresholdDays >= 1
              ? profile.followUpThresholdDays
              : 3,
          avatar: profile.avatar || user?.avatar || DEFAULT_AVATAR,
          name: user?.name || 'Freelancer',
        },
      });
      return;
    }

    let profile = await UserProfile.findOne({ userId });
    const user = await User.findById(userId);

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        profession: '',
        professions: [],
        categories: [],
        specializations: [],
        experienceLevel: 'mid',
        bio: '',
        avatar: user?.avatar || DEFAULT_AVATAR,
        skills: [],
        toolsAndFrameworks: [],
        supportedWork: [],
        unsupportedWork: [],
        services: [],
        pricingRules: {
          minProjectPrice: 0,
          hourlyRate: 0,
          rushOrderMultiplier: 1.0,
          currency: 'USD',
        },
        businessRules: [],
        maxRevisions: 0,
        depositPercentage: 0,
        communicationTone: 'friendly',
        followUpThresholdDays: 3,
      });
    }

    const profileObj = profile.toObject();
    res.json({
      success: true,
      data: {
        ...profileObj,
        followUpThresholdDays:
          typeof profileObj.followUpThresholdDays === 'number' && profileObj.followUpThresholdDays >= 1
            ? profileObj.followUpThresholdDays
            : 3,
        avatar: profileObj.avatar || user?.avatar || DEFAULT_AVATAR,
        name: user?.name || 'Freelancer',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { name, ...profileUpdates } = req.body;

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.id === userId);
      if (user) {
        if (name) user.name = name;
        if (profileUpdates.avatar !== undefined) user.avatar = profileUpdates.avatar;
        user.updatedAt = new Date();
      }

      let profile = memoryStore.profiles.find((p) => p.userId === userId);
      if (!profile) {
        profile = {
          id: 'prof_' + userId,
          userId,
          avatar: profileUpdates.avatar || user?.avatar || DEFAULT_AVATAR,
          ...profileUpdates,
          updatedAt: new Date(),
        };
        memoryStore.profiles.push(profile);
      } else {
        Object.assign(profile, profileUpdates, { updatedAt: new Date() });
      }

      const updatedUser = memoryStore.users.find((u) => u.id === userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...profile,
          followUpThresholdDays:
            typeof profile.followUpThresholdDays === 'number' && profile.followUpThresholdDays >= 1
              ? profile.followUpThresholdDays
              : 3,
          avatar: profile.avatar || updatedUser?.avatar || DEFAULT_AVATAR,
          name: updatedUser?.name || name,
        },
      });
      return;
    }

    const userUpdates: Record<string, any> = {};
    if (name) userUpdates.name = name;
    if (profileUpdates.avatar !== undefined) userUpdates.avatar = profileUpdates.avatar;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: profileUpdates },
      { new: true, upsert: true, runValidators: true }
    );

    const updatedUser = await User.findById(userId);
    const profileObj = profile.toObject();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...profileObj,
        followUpThresholdDays:
          typeof profileObj.followUpThresholdDays === 'number' && profileObj.followUpThresholdDays >= 1
            ? profileObj.followUpThresholdDays
            : 3,
        avatar: profileObj.avatar || updatedUser?.avatar || DEFAULT_AVATAR,
        name: updatedUser?.name || name,
      },
    });
  } catch (error) {
    next(error);
  }
}
