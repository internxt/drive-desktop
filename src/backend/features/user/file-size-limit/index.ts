export { resolveUserFileSizeLimit } from './resolve-user-file-size-limits';
export { validateUploadFileSize, ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './validate-upload-file-size';
export type MaxFileSizeRejectionModalProps = {
  variant: 'single' | 'multiple';
  showUpgradeCta: boolean;
  maxFileSize?: number;
  fileSize?: number;
};
