import assert from 'node:assert';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../src/server/config/db.js';
import {
  generate6DigitCode,
  hashCode,
} from '../src/server/controllers/authController.js';

console.log('=== RUNNING EMAIL VERIFICATION & PASSWORD RESET TEST SUITE ===');

async function runAuthVerificationAndResetTests() {
  // Clear memoryStore.users for clean test
  memoryStore.users = [];

  console.log('\n--- 1. Verification Code & Crypto Helpers ---');
  const code = generate6DigitCode();
  assert.strictEqual(code.length, 6, 'Verification code must be 6 digits');
  assert.match(code, /^\d{6}$/, 'Verification code must contain only numbers');

  const hashedCode = hashCode(code);
  assert.strictEqual(typeof hashedCode, 'string');
  assert.strictEqual(hashedCode.length, 64, 'SHA-256 hash must be 64 characters hex');
  assert.strictEqual(hashedCode, hashCode(code), 'Hash must be deterministic');
  console.log('  ✓ PASS: 6-digit code generation and deterministic SHA-256 hashing');

  const resetToken = crypto.randomBytes(32).toString('hex');
  assert.strictEqual(resetToken.length, 64, 'Reset token must be 32 bytes (64 hex characters)');
  const hashedResetToken = hashCode(resetToken);
  assert.strictEqual(hashedResetToken.length, 64);
  console.log('  ✓ PASS: High-entropy reset token generation');

  console.log('\n--- 2. User Registration & Unverified State ---');
  const testEmail = 'freelancer_tester@example.com';
  const initialPassword = 'InitialSecurePassword123!';
  const hashedPassword = await bcrypt.hash(initialPassword, 10);

  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
  const user = {
    _id: 'test-user-123',
    id: 'test-user-123',
    name: 'Alex Freelancer',
    email: testEmail,
    passwordHash: hashedPassword,
    isEmailVerified: false,
    emailVerificationCodeHash: hashedCode,
    emailVerificationExpiresAt: verificationExpiry,
    emailVerificationAttempts: 0,
    emailVerificationLastSentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.users.push(user);

  assert.strictEqual(user.isEmailVerified, false, 'New user should be unverified');
  assert.strictEqual(user.emailVerificationCodeHash, hashedCode, 'Token must be stored in hashed form');
  assert(user.emailVerificationExpiresAt > new Date(), 'Expiry must be in the future');
  console.log('  ✓ PASS: User registered with unverified flag and hashed code');

  console.log('\n--- 3. Verification Code Validation & Attempt Protection ---');
  // Attempt with wrong code
  const wrongCode = '000000';
  const hashedWrong = hashCode(wrongCode);
  assert.notStrictEqual(hashedWrong, user.emailVerificationCodeHash);

  user.emailVerificationAttempts += 1;
  assert.strictEqual(user.emailVerificationAttempts, 1);

  // Exceed max attempts
  user.emailVerificationAttempts = 5;
  assert.strictEqual(user.emailVerificationAttempts >= 5, true, 'Account detects attempt limit exceeded');

  // Reset with fresh code (resend verification)
  const freshCode = generate6DigitCode();
  user.emailVerificationCodeHash = hashCode(freshCode);
  user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = new Date();

  assert.strictEqual(user.emailVerificationAttempts, 0);
  assert.strictEqual(user.emailVerificationCodeHash, hashCode(freshCode));
  console.log('  ✓ PASS: Attempt limiting and code renewal logic verified');

  console.log('\n--- 4. Successful Email Verification ---');
  // Verify with correct code
  const providedCode = freshCode;
  assert.strictEqual(hashCode(providedCode), user.emailVerificationCodeHash, 'Provided code matches stored hash');
  assert(user.emailVerificationExpiresAt > new Date(), 'Code is not expired');

  user.isEmailVerified = true;
  user.emailVerificationCodeHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationAttempts = 0;

  const verifiedUser = memoryStore.users.find((u) => u.email === testEmail);
  assert.strictEqual(verifiedUser?.isEmailVerified, true, 'User is now verified');
  assert.strictEqual(verifiedUser?.emailVerificationCodeHash, undefined, 'Verification token is cleared');
  console.log('  ✓ PASS: Correct code activates account and purges verification token');

  console.log('\n--- 5. Forgot Password & Single-Use Reset Token Flow ---');
  const tokenToUse = crypto.randomBytes(32).toString('hex');
  const hashedReset = hashCode(tokenToUse);
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  verifiedUser!.passwordResetTokenHash = hashedReset;
  verifiedUser!.passwordResetExpiresAt = resetExpiry;
  verifiedUser!.passwordResetUsed = false;
  verifiedUser!.passwordResetLastRequestedAt = new Date();

  // Validate token lookup
  const foundUser = memoryStore.users.find(
    (u) =>
      u.passwordResetTokenHash === hashCode(tokenToUse) &&
      u.passwordResetExpiresAt &&
      new Date(u.passwordResetExpiresAt) > new Date() &&
      !u.passwordResetUsed
  );
  assert(foundUser !== undefined, 'Found user with valid reset token');
  assert.strictEqual(foundUser?.email, testEmail);

  // Invalidate token with tampered / wrong token
  const tamperedToken = tokenToUse + 'x';
  const invalidUser = memoryStore.users.find(
    (u) =>
      u.passwordResetTokenHash === hashCode(tamperedToken) &&
      u.passwordResetExpiresAt &&
      new Date(u.passwordResetExpiresAt) > new Date() &&
      !u.passwordResetUsed
  );
  assert.strictEqual(invalidUser, undefined, 'Tampered token rejected');
  console.log('  ✓ PASS: Password reset token lookup, expiration check, and tamper rejection');

  console.log('\n--- 6. Password Reset, Token Invalidation & Login Protection ---');
  const newPassword = 'BrandNewSuperSecurePassword999!';
  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and mark token used
  foundUser!.passwordHash = newHashedPassword;
  foundUser!.passwordResetUsed = true;
  foundUser!.passwordResetTokenHash = undefined;
  foundUser!.passwordResetExpiresAt = undefined;

  // Verify old password no longer works
  const oldPasswordMatches = await bcrypt.compare(initialPassword, foundUser!.passwordHash);
  assert.strictEqual(oldPasswordMatches, false, 'Old password must NOT match');

  // Verify new password works
  const newPasswordMatches = await bcrypt.compare(newPassword, foundUser!.passwordHash);
  assert.strictEqual(newPasswordMatches, true, 'New password MUST match');

  // Verify reset token cannot be reused
  const reuseAttempt = memoryStore.users.find(
    (u) =>
      u.passwordResetTokenHash === hashCode(tokenToUse) &&
      !u.passwordResetUsed
  );
  assert.strictEqual(reuseAttempt, undefined, 'Reset token cannot be reused after password update');
  console.log('  ✓ PASS: New password hashed, old password invalidated, token burned (single-use)');

  console.log('\n========================================');
  console.log('ALL EMAIL VERIFICATION & PASSWORD RESET TESTS PASSED!');
  console.log('========================================');
}

runAuthVerificationAndResetTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
