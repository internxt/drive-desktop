export {
  addMaxFileSizeRejection,
  clearMaxFileSizeRejectionModal,
  clearUploadSizeLimitBlockedPath,
  isUploadSizeLimitBlockedPath,
  markUploadSizeLimitBlockedPath,
} from './add-max-file-size-rejection';
export { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
export { calculateProjectedWriteSize } from './calculate-projected-write-size';
export { preserveRejectedFileSizeTooBig } from './rejected-file-size-too-big/preserve-rejected-file-size-too-big';
export { resolveUserFileSizeLimit } from './resolve-user-file-size-limit';
export { validateUploadFileSize } from './validate-upload-file-size';
export type MaxFileSizeRejectionModalProps = {
  variant: 'single' | 'multiple';
  showUpgradeCta: boolean;
  maxFileSize?: number;
  fileSize?: number;
};
