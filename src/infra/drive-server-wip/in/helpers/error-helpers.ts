import { addGeneralIssue } from '@/apps/main/background-processes/issues';

export function isNetworkConnectivityError(error: any): boolean {
  return !!(
    ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'ECONNRESET', 'EPIPE'].includes(error?.code) ||
    error?.message?.includes('Failed to fetch')
  );
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

export function handleError(error: any) {
  if (isNetworkConnectivityError(error)) {
    addGeneralIssue({
      name: 'Connection Error',
      error: 'NETWORK_CONNECTIVITY_ERROR',
    });
  } else if (isServerError(error)) {
    addGeneralIssue({
      name: 'Server Error',
      error: 'SERVER_INTERNAL_ERROR',
    });
  }
}
