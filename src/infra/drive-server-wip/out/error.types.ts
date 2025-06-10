export class InfraError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'InfraError';
    this.cause = cause;
  }
}
export class NetworkError extends InfraError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

export class AlreadyExistsError extends InfraError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AlreadyExistsError';
  }
}

export class NotFoundError extends InfraError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'NotFoundError';
  }
}
