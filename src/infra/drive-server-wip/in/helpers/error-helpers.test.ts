import { describe, it, expect, vi } from 'vitest';
import { isNetworkConnectivityError, isServerError, handleError } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';

vi.mock('@/apps/main/background-processes/issues');

describe('error-helpers', () => {
  describe('isNetworkConnectivityError', () => {
    it('should return true for ENOTFOUND', () => {
      expect(isNetworkConnectivityError({ code: 'ENOTFOUND' })).toBe(true);
    });

    it('should return true for ECONNREFUSED', () => {
      expect(isNetworkConnectivityError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should return true for ETIMEDOUT', () => {
      expect(isNetworkConnectivityError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should return true for ENETUNREACH', () => {
      expect(isNetworkConnectivityError({ code: 'ENETUNREACH' })).toBe(true);
    });

    it('should return true for EHOSTUNREACH', () => {
      expect(isNetworkConnectivityError({ code: 'EHOSTUNREACH' })).toBe(true);
    });

    it('should return true for ECONNRESET', () => {
      expect(isNetworkConnectivityError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('should return true for EPIPE', () => {
      expect(isNetworkConnectivityError({ code: 'EPIPE' })).toBe(true);
    });

    it('should return true for message containing "Failed to fetch"', () => {
      expect(isNetworkConnectivityError({ message: 'Failed to fetch' })).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkConnectivityError({ status: 500 })).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for status code 500', () => {
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

    it('should return false for non-server errors', () => {
      expect(isServerError({ status: 400 })).toBe(false);
    });
  });

  describe('handleError', () => {
    const addGeneralIssueMock = deepMocked(addGeneralIssue);
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle network connectivity errors', () => {
      handleError({ code: 'ENOTFOUND' });

      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Connection Error',
        error: 'NETWORK_CONNECTIVITY_ERROR',
      });
    });

    it('should handle server errors', () => {
      handleError({ status: 500 });

      expect(addGeneralIssueMock).toHaveBeenCalledWith({
        name: 'Server Error',
        error: 'SERVER_INTERNAL_ERROR',
      });
    });

    it('should not handle unknown errors', () => {
      handleError({ status: 404 });

      expect(addGeneralIssueMock).not.toHaveBeenCalled();
    });
  });
});
