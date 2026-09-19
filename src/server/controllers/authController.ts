import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { User } from "../models/User.js";
import { UserProfile } from "../models/UserProfile.js";
import { hashPassword, comparePassword } from "../utils/passwords.js";
import {
  signToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  revokeToken,
  JwtPayload,
} from "../utils/jwt.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { isUsingMemoryDB, memoryStore } from "../config/db.js";
import { ENV } from "../config/env.js";
import { PRO_PLAN_AI_CREDITS_LIMIT } from "../../shared/planConfig.js";
import { DEFAULT_AVATAR } from "../../shared/types.js";
import { emailService } from "../services/emailService.js";

export function generate6DigitCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashCode(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  const isProd = ENV.NODE_ENV === "production";
  const cookieParts = [
    `refreshToken=${encodeURIComponent(refreshToken)}`,
    "HttpOnly",
    "Path=/api/auth",
    "SameSite=Lax",
    "Max-Age=604800", // 7 days in seconds
  ];
  if (isProd) {
    cookieParts.push("Secure");
  }
  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

export function clearRefreshTokenCookie(res: Response): void {
  const isProd = ENV.NODE_ENV === "production";
  const cookieParts = [
    "refreshToken=",
    "HttpOnly",
    "Path=/api/auth",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProd) {
    cookieParts.push("Secure");
  }
  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

export function extractRefreshToken(req: Request): string | null {
  if (
    req.body &&
    typeof req.body.refreshToken === "string" &&
    req.body.refreshToken.trim()
  ) {
    return req.body.refreshToken.trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (name || "").trim();

    if (isUsingMemoryDB()) {
      const existingUser = memoryStore.users.find(
        (u) => u.email === cleanEmail,
      );
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: "User with this email already exists",
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      const userId =
        "mem_" + Date.now() + Math.random().toString(36).substr(2, 4);
      const verificationCode = generate6DigitCode();
      const codeHash = hashCode(verificationCode);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const newUser = {
        id: userId,
        _id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "freelancer",
        avatar: DEFAULT_AVATAR,
        aiCreditsRemaining: PRO_PLAN_AI_CREDITS_LIMIT,
        isEmailVerified: false,
        emailVerificationCodeHash: codeHash,
        emailVerificationExpiresAt: expiresAt,
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.users.push(newUser);

      // Default profile
      const defaultProfile = {
        id: "prof_" + userId,
        userId: userId,
        profession: "",
        bio: "",
        avatar: DEFAULT_AVATAR,
        experienceLevel: "mid",
        skills: [],
        toolsAndFrameworks: [],
        supportedWork: [],
        unsupportedWork: [],
        services: [],
        pricingRules: {
          minProjectPrice: 0,
          hourlyRate: 0,
          rushOrderMultiplier: 1.0,
          currency: "USD",
        },
        businessRules: [],
        maxRevisions: 0,
        depositPercentage: 0,
        communicationTone: "friendly",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.profiles.push(defaultProfile);

      await emailService.sendVerificationEmail(
        cleanEmail,
        verificationCode,
        cleanName,
      );

      res.status(201).json({
        success: true,
        requiresVerification: true,
        message:
          "Account created successfully! Please enter the 6-digit verification code sent to your email to activate your account.",
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            aiCreditsRemaining: newUser.aiCreditsRemaining,
            isEmailVerified: false,
            createdAt: newUser.createdAt.toISOString(),
            updatedAt: newUser.updatedAt.toISOString(),
          },
          email: newUser.email,
          requiresVerification: true,
        },
      });
      return;
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      res
        .status(400)
        .json({ success: false, error: "User with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const verificationCode = generate6DigitCode();
    const codeHash = hashCode(verificationCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "freelancer",
      avatar: DEFAULT_AVATAR,
      isEmailVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date(),
    });

    // Create default UserProfile
    await UserProfile.create({
      userId: user._id,
      profession: "",
      bio: "",
      avatar: DEFAULT_AVATAR,
      experienceLevel: "mid",
      skills: [],
      toolsAndFrameworks: [],
      supportedWork: [],
      unsupportedWork: [],
      services: [],
      pricingRules: {
        minProjectPrice: 0,
        hourlyRate: 0,
        rushOrderMultiplier: 1.0,
        currency: "USD",
      },
      businessRules: [],
      maxRevisions: 0,
      depositPercentage: 0,
      communicationTone: "friendly",
    });

    await emailService.sendVerificationEmail(
      cleanEmail,
      verificationCode,
      cleanName,
    );

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message:
        "Account created successfully! Please enter the 6-digit verification code sent to your email to activate your account.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining:
            user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          isEmailVerified: false,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.email === cleanEmail);
      if (!user) {
        res
          .status(401)
          .json({ success: false, error: "Invalid email or password" });
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        res
          .status(401)
          .json({ success: false, error: "Invalid email or password" });
        return;
      }

      // Check if account is verified
      if (user.isEmailVerified === false) {
        res.status(403).json({
          success: false,
          error: "EMAIL_NOT_VERIFIED",
          requiresVerification: true,
          email: user.email,
          message:
            "Your email address has not been verified yet. Please enter the 6-digit verification code sent to your email to activate your account.",
        });
        return;
      }

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshTokenValue = signRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      setRefreshTokenCookie(res, refreshTokenValue);

      res.json({
        success: true,
        message: "Logged in successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || DEFAULT_AVATAR,
            aiCreditsRemaining:
              user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
            isEmailVerified: true,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          token: accessToken,
          accessToken,
          refreshToken: refreshTokenValue,
        },
      });
      return;
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
      return;
    }

    // Check if account is verified
    if (user.isEmailVerified === false) {
      res.status(403).json({
        success: false,
        error: "EMAIL_NOT_VERIFIED",
        requiresVerification: true,
        email: user.email,
        message:
          "Your email address has not been verified yet. Please enter the 6-digit verification code sent to your email to activate your account.",
      });
      return;
    }

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const refreshTokenValue = signRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setRefreshTokenCookie(res, refreshTokenValue);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining:
            user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          isEmailVerified: true,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenValue,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.id === userId);
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
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
          aiCreditsRemaining:
            user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          isEmailVerified: user.isEmailVerified ?? true,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
      return;
    }

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
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
        aiCreditsRemaining:
          user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
        isEmailVerified: user.isEmailVerified ?? true,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractRefreshToken(req);
    if (!token) {
      res
        .status(401)
        .json({ success: false, error: "Refresh token is required" });
      return;
    }

    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res
        .status(401)
        .json({ success: false, error: "Invalid or expired refresh token" });
      return;
    }

    // Revoke old refresh token (token rotation prevents replay attacks)
    revokeToken(token);

    // Verify user still exists
    let userExists = false;
    let userRole = payload.role || "freelancer";
    let userEmail = payload.email;

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.id === payload.userId);
      if (user) {
        userExists = true;
        userRole = user.role;
        userEmail = user.email;
      }
    } else {
      const user = await User.findById(payload.userId);
      if (user) {
        userExists = true;
        userRole = user.role;
        userEmail = user.email;
      }
    }

    if (!userExists) {
      res
        .status(401)
        .json({ success: false, error: "User account no longer exists" });
      return;
    }

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      email: userEmail,
      role: userRole,
    });

    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      email: userEmail,
      role: userRole,
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newAccessToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractRefreshToken(req);
    if (token) {
      revokeToken(token);
    }

    // Also revoke accessToken if provided in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.split(" ")[1];
      if (accessToken) {
        revokeToken(accessToken);
      }
    }

    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify 6-digit email verification code
 */
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, code } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanCode = (code || "").trim();

    if (!cleanEmail || !cleanCode) {
      res.status(400).json({
        success: false,
        error: "Email and 6-digit verification code are required.",
      });
      return;
    }

    const codeHash = hashCode(cleanCode);

    if (isUsingMemoryDB()) {
      const user = memoryStore.users.find((u) => u.email === cleanEmail);
      if (!user) {
        res.status(404).json({
          success: false,
          error: "No account found with this email address.",
        });
        return;
      }

      if (user.isEmailVerified === true) {
        res.status(400).json({
          success: false,
          error: "Account is already verified. You can sign in.",
        });
        return;
      }

      // Max attempts check (attempt protection)
      if ((user.emailVerificationAttempts || 0) >= 5) {
        res.status(429).json({
          success: false,
          error: "TOO_MANY_ATTEMPTS",
          message:
            "Too many failed verification attempts. Please request a new verification code.",
        });
        return;
      }

      // Expiry check
      if (
        !user.emailVerificationExpiresAt ||
        new Date(user.emailVerificationExpiresAt).getTime() < Date.now()
      ) {
        res.status(400).json({
          success: false,
          error: "CODE_EXPIRED",
          message: "Verification code has expired. Please request a new code.",
        });
        return;
      }

      // Verify code hash
      if (user.emailVerificationCodeHash !== codeHash) {
        user.emailVerificationAttempts =
          (user.emailVerificationAttempts || 0) + 1;
        const remaining = Math.max(0, 5 - user.emailVerificationAttempts);
        res.status(400).json({
          success: false,
          error: "INVALID_CODE",
          message:
            remaining > 0
              ? `Invalid verification code. ${remaining} attempt(s) remaining.`
              : "Too many failed attempts. Please request a new verification code.",
        });
        return;
      }

      // Verification successful: activate user
      user.isEmailVerified = true;
      user.emailVerificationCodeHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      user.emailVerificationAttempts = 0;
      user.updatedAt = new Date();

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshTokenValue = signRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      setRefreshTokenCookie(res, refreshTokenValue);

      res.json({
        success: true,
        message: "Email successfully verified! Your account is now active.",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || DEFAULT_AVATAR,
            aiCreditsRemaining:
              user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
            isEmailVerified: true,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          token: accessToken,
          accessToken,
          refreshToken: refreshTokenValue,
        },
      });
      return;
    }

    // MongoDB Mode
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        error: "No account found with this email address.",
      });
      return;
    }

    if (user.isEmailVerified === true) {
      res.status(400).json({
        success: false,
        error: "Account is already verified. You can sign in.",
      });
      return;
    }

    if ((user.emailVerificationAttempts || 0) >= 5) {
      res.status(429).json({
        success: false,
        error: "TOO_MANY_ATTEMPTS",
        message:
          "Too many failed verification attempts. Please request a new verification code.",
      });
      return;
    }

    if (
      !user.emailVerificationExpiresAt ||
      new Date(user.emailVerificationExpiresAt).getTime() < Date.now()
    ) {
      res.status(400).json({
        success: false,
        error: "CODE_EXPIRED",
        message: "Verification code has expired. Please request a new code.",
      });
      return;
    }

    if (user.emailVerificationCodeHash !== codeHash) {
      user.emailVerificationAttempts =
        (user.emailVerificationAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.emailVerificationAttempts);
      res.status(400).json({
        success: false,
        error: "INVALID_CODE",
        message:
          remaining > 0
            ? `Invalid verification code. ${remaining} attempt(s) remaining.`
            : "Too many failed attempts. Please request a new verification code.",
      });
      return;
    }

    // Verification successful: activate user
    user.isEmailVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationAttempts = 0;
    await user.save();

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const refreshTokenValue = signRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setRefreshTokenCookie(res, refreshTokenValue);

    res.json({
      success: true,
      message: "Email successfully verified! Your account is now active.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || DEFAULT_AVATAR,
          aiCreditsRemaining:
            user.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT,
          isEmailVerified: true,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenValue,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend 6-digit verification code
 */
export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanEmail) {
      res
        .status(400)
        .json({ success: false, error: "Email address is required." });
      return;
    }

    let user: any = null;
    if (isUsingMemoryDB()) {
      user = memoryStore.users.find((u) => u.email === cleanEmail);
    } else {
      user = await User.findOne({ email: cleanEmail });
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: "No account found with this email address.",
      });
      return;
    }

    if (user.isEmailVerified === true) {
      res.status(400).json({
        success: false,
        error: "Account is already verified. Please sign in.",
      });
      return;
    }

    // Rate limiting cooldown: minimum 60 seconds between resends
    if (user.emailVerificationLastSentAt) {
      const elapsed =
        Date.now() - new Date(user.emailVerificationLastSentAt).getTime();
      if (elapsed < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - elapsed) / 1000);
        res.status(429).json({
          success: false,
          error: "RATE_LIMIT_COOLDOWN",
          message: `Please wait ${waitSec} second(s) before requesting another verification code.`,
          retryAfter: waitSec,
        });
        return;
      }
    }

    const verificationCode = generate6DigitCode();
    const codeHash = hashCode(verificationCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.emailVerificationCodeHash = codeHash;
    user.emailVerificationExpiresAt = expiresAt;
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSentAt = new Date();

    if (!isUsingMemoryDB()) {
      await user.save();
    }

    await emailService.sendVerificationEmail(
      user.email,
      verificationCode,
      user.name,
    );

    res.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request password reset email
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanEmail) {
      res
        .status(400)
        .json({ success: false, error: "Email address is required." });
      return;
    }

    let user: any = null;
    if (isUsingMemoryDB()) {
      user = memoryStore.users.find((u) => u.email === cleanEmail);
    } else {
      user = await User.findOne({ email: cleanEmail });
    }

    // Constant response time/message prevents user email enumeration
    if (!user) {
      res.json({
        success: true,
        message:
          "If an account exists with this email address, a password reset link has been sent.",
      });
      return;
    }

    // Cooldown rate-limit: 60s
    if (user.passwordResetLastRequestedAt) {
      const elapsed =
        Date.now() - new Date(user.passwordResetLastRequestedAt).getTime();
      if (elapsed < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - elapsed) / 1000);
        res.status(429).json({
          success: false,
          error: "RATE_LIMIT_COOLDOWN",
          message: `Please wait ${waitSec} second(s) before requesting another reset link.`,
          retryAfter: waitSec,
        });
        return;
      }
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashCode(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    user.passwordResetUsed = false;
    user.passwordResetLastRequestedAt = new Date();

    if (!isUsingMemoryDB()) {
      await user.save();
    }

    const host = req.get("host") || "localhost:3000";
    const protocol =
      req.protocol === "https" || req.get("x-forwarded-proto") === "https"
        ? "https"
        : "http";
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

    res.json({
      success: true,
      message:
        "If an account exists with this email address, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validate password reset token before displaying reset form
 */
export async function verifyResetToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token.trim() : "";
    const email =
      typeof req.query.email === "string"
        ? req.query.email.toLowerCase().trim()
        : "";

    if (!token || !email) {
      res.status(400).json({
        success: false,
        valid: false,
        error: "Token and email parameters are required.",
      });
      return;
    }

    const tokenHash = hashCode(token);

    let user: any = null;
    if (isUsingMemoryDB()) {
      user = memoryStore.users.find((u) => u.email === email);
    } else {
      user = await User.findOne({ email });
    }

    console.log("RESET TOKEN DEBUG:", {
      email,
      tokenReceived: !!token,
      tokenLength: token.length,
      tokenHash,
      userFound: !!user,
      storedTokenHash: user?.passwordResetTokenHash,
      tokenMatch: user?.passwordResetTokenHash === tokenHash,
      passwordResetUsed: user?.passwordResetUsed,
      expiresAt: user?.passwordResetExpiresAt,
      now: new Date(),
    });

    if (
      !user ||
      !user.passwordResetTokenHash ||
      user.passwordResetTokenHash !== tokenHash ||
      user.passwordResetUsed === true ||
      !user.passwordResetExpiresAt ||
      new Date(user.passwordResetExpiresAt).getTime() < Date.now()
    ) {
      res.status(400).json({
        success: false,
        valid: false,
        error:
          "Password reset link is invalid, expired, or has already been used.",
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      message: "Reset token is valid.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Set new password using single-use reset token
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, token, password } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanToken = (token || "").trim();

    if (!cleanEmail || !cleanToken || !password) {
      res.status(400).json({
        success: false,
        error: "Email, reset token, and new password are required.",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long.",
      });
      return;
    }

    const tokenHash = hashCode(cleanToken);

    let user: any = null;
    if (isUsingMemoryDB()) {
      user = memoryStore.users.find((u) => u.email === cleanEmail);
    } else {
      user = await User.findOne({ email: cleanEmail });
    }

    if (
      !user ||
      !user.passwordResetTokenHash ||
      user.passwordResetTokenHash !== tokenHash ||
      user.passwordResetUsed === true ||
      !user.passwordResetExpiresAt ||
      new Date(user.passwordResetExpiresAt).getTime() < Date.now()
    ) {
      res.status(400).json({
        success: false,
        error:
          "Password reset link is invalid, expired, or has already been used. Please request a new one.",
      });
      return;
    }

    // Hash the new password with bcrypt
    const newPasswordHash = await hashPassword(password);
    user.passwordHash = newPasswordHash;

    // Invalidate reset token (single-use guarantee)
    user.passwordResetUsed = true;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.isEmailVerified = true; // Email ownership verified through reset email
    user.updatedAt = new Date();

    if (!isUsingMemoryDB()) {
      await user.save();
    }

    res.json({
      success: true,
      message:
        "Your password has been successfully reset! You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}
