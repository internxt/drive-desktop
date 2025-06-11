import { describe, it, expect, vi } from 'vitest';
import { isNetworkConnectivityError, isServerError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

vi.mock('@/apps/main/background-processes/issues');

describe('error-helpers', () => {
  describe('isNetworkConnectivityError', () => {
    // Top‐level `.code` tests (node-fetch legacy or any direct‐code error)
    const topLevelCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'ECONNRESET', 'EPIPE'];
    for (const code of topLevelCodes) {
      it(`should return true for top-level code "${code}"`, () => {
        const error = new Error('error', { cause: { code } });
        expect(isNetworkConnectivityError({ error })).toBe(true);
      });
    }

    // Undici-specific codes under err.code
    const undiciPrimaryCodes = ['UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_DESTROYED', 'UND_ERR_CLOSED'];
    for (const code of undiciPrimaryCodes) {
      it(`should return true for Undici primary code "${code}"`, () => {
        const error = new Error('error', { cause: { code } });
        expect(isNetworkConnectivityError({ error })).toBe(true);
      });
    }

    // Code buried under `error.cause.code` (Node v18+ / Undici)
    it('should return true when real code is under error.cause.code ("ECONNREFUSED")', () => {
      const error = { cause: { code: 'ECONNREFUSED' } };
      expect(isNetworkConnectivityError({ error })).toBe(true);
    });
    it('should return true when real code is under error.cause.code ("UND_ERR_SOCKET")', () => {
      const error = { cause: { code: 'UND_ERR_SOCKET' } };
      expect(isNetworkConnectivityError({ error })).toBe(true);
    });
    it('should return true when real code is under error.cause.code ("UND_ERR_CONNECT_TIMEOUT")', () => {
      const error = { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } };
      expect(isNetworkConnectivityError({ error })).toBe(true);
    });

    // Fallback: message includes "Failed to fetch"
    it('should return true for message containing "Failed to fetch"', () => {
      const error = new Error('Failed to fetch');
      expect(isNetworkConnectivityError({ error })).toBe(true);
    });

    // Negative cases
    it('should return false for a random Error without code or "Failed to fetch"', () => {
      const error = new Error('Something else happened');
      expect(isNetworkConnectivityError({ error })).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for a top-level status code 500', () => {
      const response = { status: 500 } as Response;
      const error = new Error('internal server error');
      expect(isServerError({ error, response })).toBe(true);
    });

    it('should return true for status code 503 inside response', () => {
      const response = { status: 503 } as Response;
      const error = new Error('Service Unavailable');
      expect(isServerError({ error, response })).toBe(true);
    });

    it('should return true for statusText containing "Internal Server Error"', () => {
      const response = { statusText: 'Internal Server Error' } as Response;
      const error = new Error('Server error occurred');
      expect(isServerError({ error, response })).toBe(true);
    });

    it('should return true for statusText containing "Service Unavailable"', () => {
      const response = { statusText: 'Service Unavailable' } as Response;
      const error = new Error('Service Unavailable');
      expect(isServerError({ error, response })).toBe(true);
    });

    it('should return false for a 400 status (top-level)', () => {
      const response = { status: 400, statusText: 'Bad Request' } as Response;
      const error = new Error('Bad Request');
      expect(isServerError({ error, response })).toBe(false);
    });

    it('should return false for a non-error status inside response (e.g. 200)', () => {
      const response = { status: 200, statusText: 'Ok' } as Response;
      const error = new Error('OK');
      expect(isServerError({ error, response })).toBe(false);
    });
  });
});
