const reasons = [
  'FOLDER_IS_LOCKED',
  'SERVICE_UNAVAILABE',
  'UNKNONW_LOCK_SERVICE_ERROR',
  'LOCK_UNAUTHORIZED',
] as const;

export type LockErrorReason = typeof reasons[number];

export function isLockError(maybe: unknown): maybe is LockErrorReason {
  return (
    typeof maybe === 'string' && reasons.includes(maybe as LockErrorReason)
  );
}

export class LockError extends Error {
  readonly reason: LockErrorReason;

  constructor(reason: LockErrorReason, msg?: string) {
    super(msg);

    this.reason = reason;
  }
}

export class FolderIsLocked extends LockError {
  constructor(msg?: string) {
    super('FOLDER_IS_LOCKED', msg);
  }
}

export class LockServiceUnavailabe extends LockError {
  constructor(msg?: string) {
    super('SERVICE_UNAVAILABE', msg);
  }
}

export class UnknonwLockServiceError extends LockError {
  constructor(msg?: string) {
    super('UNKNONW_LOCK_SERVICE_ERROR', msg);
  }
}

export class UnauthorizedError extends LockError {
  constructor(msg?: string) {
    super('LOCK_UNAUTHORIZED', msg);
  }
}
