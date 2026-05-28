export function isValidMaxUploadFileSize(maxUploadFileSize: unknown): maxUploadFileSize is number {
  return typeof maxUploadFileSize === 'number' && Number.isFinite(maxUploadFileSize) && maxUploadFileSize > 0;
}
