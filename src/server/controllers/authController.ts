import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { hashPassword, comparePassword } from '../utils/passwords.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import { PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig.js';
import { DEFAULT_AVATAR } from '../../shared/types.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (isUsingMemoryDB()) {
      const existingUser = memoryStore.users.find((u) => u.email === email.toLowerCase());
      if (existingUser) {
        res.status(400).json({ success: false, error: 'User with this email already exists' });
        return;
      }

      const passwordHash = await hashPassword(password);
      const userId = 'mem_' + Date.now() + Math.random().toString(36).substr(2, 4);

      const newUser = {
        id: userId,
        _id: userId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'freelancer',
        avatar: DEFAULT_AVATAR,
        aiCreditsRemaining: PRO_PLAN_AI_CREDITS_LIMIT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.users.push(newUser);

      // Default profile
      const defaultProfile = {
        id: 'prof_' + userId,
        userId: userId,
        profession: '',
        bio: '',
        avatar: DEFAULT_AVATAR,
        experienceLevel: 'mid',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.profiles.push(defaultProfile);

      const token = signToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            aiCreditsRemaining: newUser.aiCreditsRemaining,
            createdAt: newUser.createdAt.toISOString(),
            updatedAt: newUser.updatedAt.toISOString(),
          },
          token,
        },
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'freelancer',
      avatar: DEFAULT_AVATAR,
    });

    // Create default UserProfile
    await UserProfile.create({
      userId: user._id,
      profession: '',
      bio: '',
      avatar: DEFAULT_AVATAR,
      experienceLevel: 'mid',
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
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining: user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.email === email.toLowerCase());
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || DEFAULT_AVATAR,
            aiCreditsRemaining: user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          token,
        },
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining: user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.id === userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining: user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
      return;
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || DEFAULT_AVATAR,
        aiCreditsRemaining: user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
