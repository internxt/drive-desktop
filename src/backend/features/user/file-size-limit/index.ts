export { resolveUserFileSizeLimit } from './resolve-user-file-size-limits';
export { getFileSizeLimitAdapter } from './get-file-size-limit-adapter';
export { handleFileUploadSizeExceeded } from './handle-file-upload-size-exceeded';
export type MaxFileSizeRejectionModalProps = {
  variant: 'single' | 'multiple';
  showUpgradeCta: boolean;
  maxFileSize?: number;
  fileSize?: number;
};
