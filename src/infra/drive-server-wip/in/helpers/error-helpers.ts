import { addGeneralIssue, GeneralIssue, removeGeneralIssue } from '@/apps/main/background-processes/issues';
/*
 * v2.5.3
 * Alexis Mora
 * This file contains error handling utilities for network and server errors.
 * We know that openapi-fetch under the hood uses the built-in fetch API,
 * which is based on: https://undici.nodejs.org/#/
 * ---
 * an Error request can be "resolved" in two ways:
 * 1. The request fails due to network connectivity issues (e.g., DNS resolution failure, connection refused, timeout).
 *  - For this case, the error will not be in the response.error but rather this error will be thrown by the fetch API.
 * 2. The request is made successfully, but the server responds with an error status code
 *  - For this case, the error will be in the response.error and the response.status will be set to the error status code.
 * */

const errorCodes = [
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ECONNRESET',
  'EPIPE',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_DESTROYED',
  'UND_ERR_CLOSED',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
];

const networkErrorIssue: Omit<GeneralIssue, 'tab'> = {
  name: 'Connection Error',
  error: 'NETWORK_CONNECTIVITY_ERROR',
};

const serverErrorIssue: Omit<GeneralIssue, 'tab'> = {
  name: 'Server Error',
  error: 'SERVER_INTERNAL_ERROR',
};

export function isNetworkConnectivityError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as any;
  if (typeof err.code === 'string') {
    return errorCodes.includes(err?.code);
  }
  if (err.cause !== undefined && typeof err.cause.code === 'string') {
    return errorCodes.includes(err?.cause?.code);
  }

  return !!(typeof err.message === 'string' && err.message.includes('Failed to fetch'));
}

export function isServerError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  const statusText = error?.response?.statusText;

  return !!(
    (status >= 500 && status < 600) ||
    statusText?.includes('Internal Server Error') ||
    statusText?.includes('Service Unavailable')
  );
}

export function handleError(error: unknown) {
  if (isNetworkConnectivityError(error)) {
    addGeneralIssue(networkErrorIssue);
  } else if (isServerError(error)) {
    addGeneralIssue(serverErrorIssue);
  }
}

export function handleRemoveErrors() {
  removeGeneralIssue(serverErrorIssue);
  removeGeneralIssue(networkErrorIssue);
}
