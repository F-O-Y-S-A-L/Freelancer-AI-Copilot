import { URL } from 'url';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.goog',
  '169.254.169.254',
  'instance-data',
]);

const DANGEROUS_PORTS = new Set([
  20, 21, 22, 23, 25, 53, 69, 110, 111, 135, 137, 138, 139, 143, 445,
  993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 9200, 11211, 27017,
]);

export function validateSafeUrl(rawUrl: string): { isValid: boolean; normalizedUrl?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL string is required' };
  }

  let trimmed = rawUrl.trim();

  // If a scheme is specified, verify it is strictly http or https
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported' };
    }
  } else {
    // If no scheme provided (e.g. "stripe.com"), prepend https://
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    return { isValid: false, error: 'Access to private, local, or cloud metadata network hosts is restricted' };
  }

  // Check port if explicitly specified
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return { isValid: false, error: 'Invalid port specified in URL' };
    }
    if (DANGEROUS_PORTS.has(portNum)) {
      return { isValid: false, error: `Access to restricted port ${portNum} is prohibited for security reasons` };
    }
  }

  // Check IPv4 private ranges
  // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const o1 = parseInt(ipv4Match[1], 10);
    const o2 = parseInt(ipv4Match[2], 10);

    if (
      o1 === 0 ||
      o1 === 10 ||
      o1 === 127 ||
      (o1 === 172 && o2 >= 16 && o2 <= 31) ||
      (o1 === 192 && o2 === 168) ||
      (o1 === 169 && o2 === 254) ||
      (o1 === 100 && o2 >= 64 && o2 <= 127)
    ) {
      return { isValid: false, error: 'Access to internal IP address ranges is prohibited' };
    }
  }

  // Check IPv6 loopback and private/link-local ranges
  if (
    hostname.startsWith('[') ||
    hostname.includes(':') ||
    hostname === '::1' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd00:')
  ) {
    return { isValid: false, error: 'Access to local or private IPv6 addresses is restricted' };
  }

  return { isValid: true, normalizedUrl: parsed.toString() };
}

