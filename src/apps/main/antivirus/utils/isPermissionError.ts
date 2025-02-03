import NodeClamError from '@internxt/scan/lib/NodeClamError';

const PERMISSION_ERROR_CODES = [
  'EACCES',
  'EPERM',
  'EBUSY',
  'ENOENT',
  'ENOFILE',
  'EISDIR',
];

const PERMISSION_ERROR_MESSAGES = [
  'operation not permitted',
  'access denied',
  'access is denied',
];

export const isPermissionError = (err: unknown) => {
  let error = err as any;
  if (!err || typeof err !== 'object') return false;

  if (err instanceof NodeClamError && (err as any).data?.err instanceof Error) {
    error = (err as any).data.err;
  }

  const msg = error.message?.toLowerCase() || '';
  const hasPermissionErrorCode = PERMISSION_ERROR_CODES.includes(error.code);
  const hasPermissionErrorMessage = PERMISSION_ERROR_MESSAGES.some((m) =>
    msg.includes(m)
  );

  return hasPermissionErrorCode || hasPermissionErrorMessage;
};
