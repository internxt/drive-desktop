export { resolveUserFileSizeLimit } from './resolve-user-file-size-limits';
export { validateUploadFileSize } from './validate-upload-file-size';
export { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
export { handleFileUploadSizeExceeded } from './handle-file-upload-size-exceeded';
export type MaxFileSizeRejectionModalProps = {
  variant: 'single' | 'multiple';
  showUpgradeCta: boolean;
  maxFileSize?: number;
  fileSize?: number;
};
