export class RetryError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'RetryError';
  }
}
