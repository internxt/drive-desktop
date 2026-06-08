export class UploadSizeLimitError extends Error {
  constructor() {
    super('UPLOAD_SIZE_LIMIT_EXCEEDED');
    this.name = 'UploadSizeLimitError';
  }
}
