import { GeneralIssue, removeGeneralIssue } from '@/apps/main/background-processes/issues';
import { z } from 'zod';

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
 * 2. The request is made successfully, but the server responds with an error status code.
 *  - For this case, the error will be in the response.error and the response.status will be set to the error status code.
 */

/**
 * v2.5.4 Daniel Jiménez
 * Examples:
 * error: TypeError: fetch failed
 *   cause: Error: getaddrinfo ENOTFOUND gateway.internxt.com
 *     code: 'ENOTFOUND'
 */
const fetchErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  cause: z
    .object({
      code: z.string().optional(),
    })
    .optional(),
});

/**
 * v2.5.4 Daniel Jiménez
 * Examples:
 * { message: 'workspaceId should be a valid uuid!', error: 'Bad Request', statusCode: 400 }
 */
const fetchErrorWithHttpResponseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
  statusCode: z.number().optional(),
});

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

export const networkErrorIssue: Omit<GeneralIssue, 'tab'> = {
  name: 'Connection Error',
  error: 'NETWORK_CONNECTIVITY_ERROR',
};

export const serverErrorIssue: Omit<GeneralIssue, 'tab'> = {
  name: 'Server Error',
  error: 'SERVER_INTERNAL_ERROR',
};

export function isNetworkConnectivityError({ error }: { error: unknown }): boolean {
  const parsedError = fetchErrorSchema.safeParse(error);
  if (!parsedError.success) return false;

  const { code, message, cause } = parsedError.data;

  if (code && errorCodes.includes(code)) {
    return true;
  }

  if (cause?.code && errorCodes.includes(cause.code)) {
    return true;
  }

  return !!(message && message.includes('Failed to fetch'));
}

export function isServerError({ response, error }: { response: Response; error: unknown }): boolean {
  const parsedError = fetchErrorWithHttpResponseSchema.safeParse(error);
  if (!parsedError.success) return false;

  const status = parsedError.data.statusCode ?? response.status;
  const statusText = response.statusText;

  return (status >= 500 && status < 600) || statusText.includes('Internal Server Error') || statusText.includes('Service Unavailable');
}

export function handleRemoveErrors() {
  removeGeneralIssue(serverErrorIssue);
  removeGeneralIssue(networkErrorIssue);
}

export function isErrorWithStatusCode({ error, code }: { error: unknown; code: number }): boolean {
  const parsedData = fetchErrorWithHttpResponseSchema.safeParse(error).data;
  return parsedData?.statusCode === code;
}
