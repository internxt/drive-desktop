import { describe, expect, it } from 'vitest';
import { ALLOWED_HOSTNAMES, ALLOWED_PROTOCOLS } from './constants';
import { isValidUrl } from './is-valid-url';

describe('isValidUrl', () => {
  it('should accept a valid URL with matching protocol and hostname', () => {
    expect(isValidUrl('https://drive.internxt.com/some/path', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(true);
  });

  it('should reject a URL with a disallowed protocol', () => {
    expect(isValidUrl('file:///etc/passwd', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a URL with a disallowed protocol ftp', () => {
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    expect(isValidUrl('ftp://files.internxt.com', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a URL with a different hostname', () => {
    expect(isValidUrl('https://evil.com', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a URL with a subdomain that bypasses the check', () => {
    expect(isValidUrl('https://drive.internxt.com.evil.com', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a URL with a hostname that contains the allowed one as a substring', () => {
    expect(isValidUrl('https://evilinternxt.com', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a malformed URL string', () => {
    expect(isValidUrl('not-a-url', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject an empty string', () => {
    expect(isValidUrl('', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should reject a URL with no hostname', () => {
    expect(isValidUrl('https://', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(false);
  });

  it('should accept a URL with a port', () => {
    expect(isValidUrl('https://internxt.com:443/path', ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)).toBe(true);
  });
});
