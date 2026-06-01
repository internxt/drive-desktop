import NodeClamError from '@internxt/scan/lib/NodeClamError';

const PERMISSION_ERROR_CODES = ['EACCES', 'EPERM', 'EBUSY', 'ENOENT', 'ENOFILE', 'EISDIR'];

const PERMISSION_ERROR_MESSAGES = ['operation not permitted', 'access denied', 'access is denied'];

export const isPermissionError = (err: unknown) => {
  if (!err || typeof err !== 'object') return false;

  let error: { message?: string; code?: string } = err as { message?: string; code?: string };

  if (err instanceof NodeClamError && err.data?.err instanceof Error) {
    error = err.data.err;
  }

  const msg = error.message?.toLowerCase() ?? '';
  const hasPermissionErrorCode = PERMISSION_ERROR_CODES.includes(error.code ?? '');
  const hasPermissionErrorMessage = PERMISSION_ERROR_MESSAGES.some((m) => msg.includes(m));

  return hasPermissionErrorCode || hasPermissionErrorMessage;
};
