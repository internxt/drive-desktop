import { describe, expect, test } from 'vitest';
import { validateUrl } from './urlValidation';

describe('validateUrl', () => {
  const allowedProtocols = ['https:', 'http:'];
  const allowedHostnames = ['internxt.com', 'drive.internxt.com', '127.0.0.1'];

  test('should accept a valid URL with matching protocol and hostname', () => {
    expect(validateUrl('https://drive.internxt.com/some/path', allowedProtocols, allowedHostnames)).toBe(true);
  });

  test('should accept http with localhost IP', () => {
    expect(validateUrl('http://127.0.0.1:9090/login', allowedProtocols, allowedHostnames)).toBe(true);
  });

  test('should reject a URL with a disallowed protocol', () => {
    expect(validateUrl('file:///etc/passwd', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a URL with a disallowed protocol ftp', () => {
    expect(validateUrl('ftp://files.internxt.com', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a URL with a different hostname', () => {
    expect(validateUrl('https://evil.com', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a URL with a subdomain that bypasses the check', () => {
    expect(validateUrl('https://drive.internxt.com.evil.com', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a URL with a hostname that contains the allowed one as a substring', () => {
    expect(validateUrl('https://evilinternxt.com', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a malformed URL string', () => {
    expect(validateUrl('not-a-url', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject an empty string', () => {
    expect(validateUrl('', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should reject a URL with no hostname', () => {
    expect(validateUrl('https://', allowedProtocols, allowedHostnames)).toBe(false);
  });

  test('should accept a URL with a port', () => {
    expect(validateUrl('https://internxt.com:443/path', allowedProtocols, allowedHostnames)).toBe(true);
  });

  test('should accept IPv6 localhost with brackets', () => {
    expect(validateUrl('http://[::1]:9090/login', allowedProtocols, ['127.0.0.1', '[::1]'])).toBe(true);
  });
});
