import { addGeneralIssue, GeneralIssue, removeGeneralIssue } from '@/apps/main/background-processes/issues';
import { z } from 'zod';
import { AlreadyExistsError, InfraError, NetworkError, NotFoundError } from '@/infra/drive-server-wip/out/error.types';

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

const fetchErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  cause: z
    .object({
      code: z.string().optional(),
    })
    .optional(),
});

const fetchErrorWithHttpResponseSchema = z.object({
  response: z
    .object({
      status: z.number(),
      statusText: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
  statusCode: z.number().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

type FetchErrorWithHttpResponse = z.infer<typeof fetchErrorWithHttpResponseSchema>;

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

function isFetchErrorWithHttpResponse(error: unknown): error is FetchErrorWithHttpResponse {
  return fetchErrorWithHttpResponseSchema.safeParse(error).success;
}

export function isErrorWithStatusCode(error: unknown, code: number): boolean {
  return isFetchErrorWithHttpResponse(error) && ((error.response && error.response.status === code) || error.statusCode === code);
}

export function getSpecificInfraError(error: unknown) {
  switch (true) {
    case isNetworkConnectivityError(error):
      return new NetworkError('Network connectivity error occurred. Please check your internet connection.', error);
    case isServerError(error):
      return new NetworkError('Server error occurred. Please try again later.', error);
    case isErrorWithStatusCode(error, 404):
      return new NotFoundError('Resource not found. Please check the URL or resource identifier.', error);
    case isErrorWithStatusCode(error, 409):
      return new AlreadyExistsError('Conflict error occurred. The resource may already exist or be in use.', error);
    default:
      return new InfraError('Unknown error in the infrastructure layer.', error);
  }
}
