import crypto from 'crypto';

/**
 * Generates a deterministic SHA-256 fingerprint for screenshot image data or binary buffers.
 * Handles data URLs (e.g. data:image/png;base64,...), raw base64, and binary Buffers.
 * Normalizes all whitespace and headers to ensure duplicate images always produce the exact same fingerprint.
 */
export function generateScreenshotFingerprint(dataOrBuffer?: string | Buffer | null): string {
  if (!dataOrBuffer) return '';

  try {
    if (Buffer.isBuffer(dataOrBuffer)) {
      if (dataOrBuffer.length === 0) return '';
      return crypto.createHash('sha256').update(dataOrBuffer).digest('hex');
    }

    if (typeof dataOrBuffer === 'string') {
      let base64 = dataOrBuffer.trim();
      if (!base64) return '';

      // Extract base64 payload if formatted as a Data URL
      if (base64.includes(',')) {
        base64 = base64.split(',')[1];
      }

      // Strip all whitespace and linebreaks
      base64 = base64.replace(/\s+/g, '');

      // Decode base64 to binary buffer for format-invariant binary hashing
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length > 0) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
      }

      // Fallback to hashing clean string
      return crypto.createHash('sha256').update(base64).digest('hex');
    }
  } catch (err) {
    console.error('[FINGERPRINT ERROR] Failed to compute binary fingerprint:', err);
  }

  return '';
}

/**
 * Generates a deterministic content fingerprint for an inquiry or payload (screenshot or text).
 */
export function generateContentFingerprint(content: {
  screenshotData?: string | null;
  rawMessage?: string | null;
}): string {
  if (content.screenshotData && content.screenshotData.trim().length > 0) {
    return generateScreenshotFingerprint(content.screenshotData);
  }

  if (content.rawMessage && content.rawMessage.trim().length > 0) {
    const normText = content.rawMessage.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normText).digest('hex');
  }

  return '';
}
