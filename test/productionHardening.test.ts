import { validateSafeUrl } from '../src/server/services/ssrfValidator.js';
import { checkRateLimit, resetRateLimitStore } from '../src/server/middleware/rateLimiter.js';
import { sanitizeObject } from '../src/server/middleware/security.js';
import { redactSensitiveData } from '../src/server/utils/logger.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken,
  revokeToken,
  isTokenRevoked,
} from '../src/server/utils/jwt.js';
import { getDbStatus } from '../src/server/config/db.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

console.log('=== RUNNING PHASE 12 PRODUCTION HARDENING & SAAS AUDIT TEST SUITE ===\n');

async function runTests() {
  console.log('--- 1. SSRF and Dangerous URL Protection ---');
  
  // Public HTTPS URLs should pass
  const validUrl = validateSafeUrl('https://stripe.com');
  assert(validUrl.isValid, 'Allow valid public HTTPS URLs (stripe.com)');

  // Localhost blocked
  const localRes = validateSafeUrl('http://localhost:3000');
  assert(!localRes.isValid, 'Block localhost target URLs');

  const ip127 = validateSafeUrl('http://127.0.0.1/admin');
  assert(!ip127.isValid, 'Block loopback 127.0.0.1 URLs');

  // AWS/Cloud metadata IP blocked
  const metadataIp = validateSafeUrl('http://169.254.169.254/latest/meta-data/');
  assert(!metadataIp.isValid, 'Block AWS / Cloud metadata link-local IP 169.254.169.254');

  // GCP metadata hostname blocked
  const gcpMeta = validateSafeUrl('http://metadata.google.internal/computeMetadata/v1/');
  assert(!gcpMeta.isValid, 'Block GCP internal metadata hostname');

  // Private RFC1918 IPs blocked
  const priv10 = validateSafeUrl('http://10.0.0.1/dashboard');
  assert(!priv10.isValid, 'Block 10.0.0.0/8 private network IP');

  const priv192 = validateSafeUrl('http://192.168.1.1/setup');
  assert(!priv192.isValid, 'Block 192.168.0.0/16 private network IP');

  // Restricted ports blocked
  const sshPort = validateSafeUrl('https://example.com:22');
  assert(!sshPort.isValid, 'Block restricted port 22 (SSH)');

  const mongoPort = validateSafeUrl('https://example.com:27017');
  assert(!mongoPort.isValid, 'Block restricted port 27017 (MongoDB)');

  // Invalid protocol
  const fileProto = validateSafeUrl('file:///etc/passwd');
  assert(!fileProto.isValid, 'Block file:// protocol scheme');

  console.log('\n--- 2. NoSQL Injection Sanitization ---');
  const maliciousInput = {
    username: 'admin',
    $where: 'this.password.length > 0',
    nested: {
      $gt: '',
      normalField: 'safeValue',
      'dot.field': 'injected',
    },
  };
  const sanitized = sanitizeObject(maliciousInput);
  assert(sanitized.username === 'admin', 'Preserves benign fields');
  assert(sanitized.$where === undefined, 'Removes $where operator at root level');
  assert(sanitized.nested.$gt === undefined, 'Removes $gt operator in nested objects');
  assert(sanitized.nested.normalField === 'safeValue', 'Preserves benign nested fields');
  assert((sanitized.nested as any)['dot.field'] === undefined, 'Removes field names with dots (.)');

  console.log('\n--- 3. Rate Limiter Sliding Window Logic ---');
  resetRateLimitStore('test-ip');
  const opts = { windowMs: 1000, max: 3, keyPrefix: 'test-ip' };
  const ip = '198.51.100.42';

  const req1 = checkRateLimit(ip, opts);
  const req2 = checkRateLimit(ip, opts);
  const req3 = checkRateLimit(ip, opts);
  const req4 = checkRateLimit(ip, opts);

  assert(req1.allowed && req1.remaining === 2, 'First request allowed, 2 remaining');
  assert(req2.allowed && req2.remaining === 1, 'Second request allowed, 1 remaining');
  assert(req3.allowed && req3.remaining === 0, 'Third request allowed, 0 remaining');
  assert(!req4.allowed && req4.remaining === 0, 'Fourth request blocked when max exceeded');

  console.log('\n--- 4. Auth & Token Rotation Verification ---');
  const userPayload = { userId: 'usr_test_123', email: 'test@example.com', role: 'freelancer' };
  const accessToken = signAccessToken(userPayload);
  const refreshToken = signRefreshToken(userPayload);

  assert(typeof accessToken === 'string' && accessToken.length > 20, 'Generates valid access JWT');
  assert(typeof refreshToken === 'string' && refreshToken.length > 20, 'Generates valid refresh JWT');

  const verified = verifyToken(accessToken);
  assert(verified !== null && (verified as any).userId === 'usr_test_123', 'Verified access token decodes userId');

  const verifiedRefresh = verifyRefreshToken(refreshToken);
  assert(verifiedRefresh !== null && (verifiedRefresh as any).tokenType === 'refresh', 'Refresh token validates refresh tokenType');

  // Test token revocation
  assert(!isTokenRevoked(accessToken), 'Active token is not revoked initially');
  revokeToken(accessToken);
  assert(isTokenRevoked(accessToken), 'Revoked token is identified as revoked');

  console.log('\n--- 5. Observability & Sensitive Data Redaction ---');
  const logData = {
    userId: 'usr_abc',
    email: 'test@domain.com',
    password: 'superSecretPassword123!',
    token: 'jwt.token.here',
    apiKey: 'AIzaSy1234567890',
    normalMessage: 'System operational',
  };
  const redacted = redactSensitiveData(logData);
  assert(redacted.password === '[REDACTED]', 'Redacts password field');
  assert(redacted.token === '[REDACTED]', 'Redacts token field');
  assert(redacted.apiKey === '[REDACTED]', 'Redacts apiKey field');
  assert(redacted.userId === 'usr_abc', 'Retains non-sensitive user identity field');
  assert(redacted.normalMessage === 'System operational', 'Retains non-sensitive message');

  console.log('\n--- 6. Database Health Status ---');
  const dbStatus = getDbStatus();
  assert(typeof dbStatus.connected === 'boolean', 'getDbStatus returns connection boolean');
  assert(typeof dbStatus.mode === 'string', 'getDbStatus returns active mode (mongodb or memory-fallback)');

  console.log(`\n========================================`);
  console.log(`PRODUCTION HARDENING TESTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} tests failed.`);
    process.exit(1);
  } else {
    console.log(`ALL PRODUCTION HARDENING TESTS COMPLETED SUCCESSFULLY!`);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
