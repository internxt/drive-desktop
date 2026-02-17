const DriveServerErrorCauses = [
  'NO_PERMISSION',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'SERVER_ERROR',
  'NETWORK_ERROR',
  'TOO_MANY_REQUESTS',
  'CONFLICT',
  'UNKNOWN',
] as const;
export type DriveServerErrorCause = (typeof DriveServerErrorCauses)[number];
export class DriveServerError extends Error {
  constructor(
    public readonly cause: DriveServerErrorCause,
    public readonly statusCode?: number,
    message?: string,
  ) {
    super(message);
  }
}

export function mapStatusToErrorCause(status: number): DriveServerErrorCause {
  if (status === 401) return 'NO_PERMISSION';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'TOO_MANY_REQUESTS';
  if (status >= 400 && status < 500) return 'BAD_REQUEST';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}
