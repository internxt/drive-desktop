import { describe, it, expect, vi } from 'vitest';
import { isNetworkConnectivityError, isServerError, handleError } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';

vi.mock('@/apps/main/background-processes/issues');

describe('error-helpers', () => {
  describe('isNetworkConnectivityError', () => {
    // Top‐level `.code` tests (node-fetch legacy or any direct‐code error)
    const topLevelCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'ECONNRESET', 'EPIPE'];
    for (const code of topLevelCodes) {
      it(`should return true for top-level code "${code}"`, () => {
        expect(isNetworkConnectivityError({ code })).toBe(true);
      });
    }

    // Undici-specific codes under err.code
    const undiciPrimaryCodes = ['UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_DESTROYED', 'UND_ERR_CLOSED'];
    for (const code of undiciPrimaryCodes) {
      it(`should return true for Undici primary code "${code}"`, () => {
        expect(isNetworkConnectivityError({ code })).toBe(true);
      });
    }

    // Code buried under `error.cause.code` (Node v18+ / Undici)
    it('should return true when real code is under error.cause.code ("ECONNREFUSED")', () => {
      const err = { cause: { code: 'ECONNREFUSED' } };
      expect(isNetworkConnectivityError(err)).toBe(true);
    });
    it('should return true when real code is under error.cause.code ("UND_ERR_SOCKET")', () => {
      const err = { cause: { code: 'UND_ERR_SOCKET' } };
      expect(isNetworkConnectivityError(err)).toBe(true);
    });
    it('should return true when real code is under error.cause.code ("UND_ERR_CONNECT_TIMEOUT")', () => {
      const err = { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } };
      expect(isNetworkConnectivityError(err)).toBe(true);
    });

    // Fallback: message includes "Failed to fetch"
    it('should return true for message containing "Failed to fetch"', () => {
      const err = new Error('Failed to fetch');
      expect(isNetworkConnectivityError(err)).toBe(true);
    });

    // Negative cases
    it('should return false for a random Error without code or "Failed to fetch"', () => {
      const err = new Error('Something else happened');
      expect(isNetworkConnectivityError(err)).toBe(false);
    });
    it('should return false if error is not an Error instance', () => {
      expect(isNetworkConnectivityError({ status: 500 })).toBe(false);
      expect(isNetworkConnectivityError('just a string')).toBe(false);
      expect(isNetworkConnectivityError(null)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for a top-level status code 500', () => {
      expect(isServerError({ status: 500 })).toBe(true);
    });

    it('should return true for status code 503 inside response', () => {
      expect(isServerError({ response: { status: 503 } })).toBe(true);
    });

    it('should return true for statusText containing "Internal Server Error"', () => {
      expect(isServerError({ response: { statusText: 'Internal Server Error' } })).toBe(true);
    });

    it('should return true for statusText containing "Service Unavailable"', () => {
      expect(isServerError({ response: { statusText: 'Service Unavailable' } })).toBe(true);
    });

    it('should return false for a 400 status (top-level)', () => {
      expect(isServerError({ status: 400 })).toBe(false);
    });

    it('should return false for a non-error status inside response (e.g. 200)', () => {
      expect(isServerError({ response: { status: 200, statusText: 'OK' } })).toBe(false);
    });

    it('should return false if neither status nor response is present', () => {
      expect(isServerError({ foo: 'bar' })).toBe(false);
    });
  });

  describe('handleError', () => {
    const addGeneralIssueMock = deepMocked(addGeneralIssue);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle top-level network connectivity error', () => {
      handleError({ code: 'ENOTFOUND' });
      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Connection Error',
        error: 'NETWORK_CONNECTIVITY_ERROR',
      });
    });

    it('should handle Undici network error under cause.code', () => {
      handleError({ cause: { code: 'UND_ERR_SOCKET' } });
      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Connection Error',
        error: 'NETWORK_CONNECTIVITY_ERROR',
      });
    });

    it('should handle "Failed to fetch" message', () => {
      handleError(new Error('Failed to fetch'));
      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Connection Error',
        error: 'NETWORK_CONNECTIVITY_ERROR',
      });
    });

    it('should handle server errors (status 500)', () => {
      handleError({ response: { status: 500 } });
      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Server Error',
        error: 'SERVER_INTERNAL_ERROR',
      });
    });

    it('should not handle a 404 (client error)', () => {
      handleError({ response: { status: 404 } });
      expect(addGeneralIssueMock).not.toHaveBeenCalled();
    });

    it('should not handle completely unrelated errors', () => {
      handleError(new Error('Some random error'));
      expect(addGeneralIssueMock).not.toHaveBeenCalled();
    });
  });
});
