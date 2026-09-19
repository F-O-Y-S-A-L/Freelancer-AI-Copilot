import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

export interface ISentEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  code?: string;
  resetUrl?: string;
  sentAt: Date;
}

// In-memory record of sent emails for developer inspection and automated test suites
const sentEmailsLog: ISentEmail[] = [];

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

if (!smtpUser || !smtpPass) {
  throw new Error("Missing SMTP_USER or SMTP_PASS environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export const emailService = {
  /**
   * Send 6-digit verification code email for account activation
   */
  async sendVerificationEmail(
    toEmail: string,
    code: string,
    recipientName?: string,
  ): Promise<{ success: boolean; messageId?: string; previewCode?: string }> {
    const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
    const subject = "Your Verification Code - Freelancer AI Copilot";

    const text = `${greeting}\n\nThank you for signing up for Freelancer AI Copilot.\n\nYour 6-digit verification code is:\n\n${code}\n\nThis code will expire in 15 minutes. For security reasons, please do not share this code with anyone.\n\nIf you did not create an account, please disregard this email.\n\nBest regards,\nThe Freelancer AI Copilot Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 32px; color: #1E293B;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Freelancer AI Copilot</h1>
        <p style="color: #E9D5FF; margin: 6px 0 0 0; font-size: 13px;">Account Email Verification</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">${greeting}</p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">
          Thank you for signing up! Enter the following 6-digit verification code on the activation screen to complete your registration:
        </p>
        <div style="background-color: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #6D28D9; display: inline-block;">${code}</span>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #64748B; margin: 0 0 8px 0;">
          &bull; This code will expire in <strong>15 minutes</strong>.<br>
          &bull; For your protection, never share this code with anyone.
        </p>
        <div style="border-top: 1px solid #E2E8F0; margin-top: 24px; padding-top: 20px;">
          <p style="font-size: 12px; color: #94A3B8; margin: 0; line-height: 1.5;">
            If you did not request this verification, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const record: ISentEmail = {
      to: toEmail.toLowerCase(),
      subject,
      text,
      html,
      code,
      sentAt: new Date(),
    };

    sentEmailsLog.push(record);

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        text,
        html,
      });

      logger.info(
        `[EmailService] Verification email delivered to ${toEmail}, messageId=${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        previewCode: process.env.NODE_ENV !== "production" ? code : undefined,
      };
    } catch (error) {
      logger.error(
        `[EmailService] Failed to send verification email to ${toEmail}`,
        error,
      );

      return {
        success: false,
      };
    }
  },

  /**
   * Send secure password reset link email
   */
  async sendPasswordResetEmail(
    toEmail: string,
    resetUrl: string,
    recipientName?: string,
  ): Promise<{ success: boolean; messageId?: string; resetUrl?: string }> {
    const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
    const subject = "Reset Your Password - Freelancer AI Copilot";

    const text = `${greeting}\n\nWe received a request to reset the password for your Freelancer AI Copilot account.\n\nPlease visit the link below to set a new password:\n\n${resetUrl}\n\nThis single-use link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.\n\nBest regards,\nThe Freelancer AI Copilot Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 32px; color: #1E293B;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Freelancer AI Copilot</h1>
        <p style="color: #E9D5FF; margin: 6px 0 0 0; font-size: 13px;">Secure Password Reset</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">${greeting}</p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">
          We received a request to reset your password. Click the button below to choose a new, secure password:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);">Reset Password</a>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #64748B; margin: 0 0 8px 0;">
          &bull; This link is single-use and will expire in <strong>1 hour</strong>.<br>
          &bull; If the button above doesn't work, copy and paste this URL into your browser:<br>
          <span style="color: #6D28D9; word-break: break-all;">${resetUrl}</span>
        </p>
        <div style="border-top: 1px solid #E2E8F0; margin-top: 24px; padding-top: 20px;">
          <p style="font-size: 12px; color: #94A3B8; margin: 0; line-height: 1.5;">
            If you did not request a password reset, please ignore this email. Your current password remains secure.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const record: ISentEmail = {
      to: toEmail.toLowerCase(),
      subject,
      text,
      html,
      resetUrl,
      sentAt: new Date(),
    };

    sentEmailsLog.push(record);

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        text,
        html,
      });

      logger.info(
        `[EmailService] Password reset email delivered to ${toEmail}, messageId=${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      };
    } catch (error) {
      logger.error(
        `[EmailService] Failed to send password reset email to ${toEmail}`,
        error,
      );

      return {
        success: false,
      };
    }
  },

  /**
   * Retrieves the latest sent email (optionally filtered by recipient email)
   */
  getLatestEmail(toEmail?: string): ISentEmail | undefined {
    if (!toEmail) {
      return sentEmailsLog[sentEmailsLog.length - 1];
    }
    const lower = toEmail.toLowerCase();
    for (let i = sentEmailsLog.length - 1; i >= 0; i--) {
      if (sentEmailsLog[i].to === lower) {
        return sentEmailsLog[i];
      }
    }
    return undefined;
  },

  /**
   * Get all sent emails (for testing / auditing)
   */
  getAllSentEmails(): ISentEmail[] {
    return [...sentEmailsLog];
  },

  /**
   * Clear email logs (for test teardowns)
   */
  clearSentEmails(): void {
    sentEmailsLog.length = 0;
  },
};
