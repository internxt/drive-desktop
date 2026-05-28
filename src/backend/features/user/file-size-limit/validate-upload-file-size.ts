const BYTES_IN_GB = 1024 ** 3;

export const ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT = 100 * BYTES_IN_GB;

export type UploadFileSizeValidation =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'PLAN_LIMIT_EXCEEDED' | 'ABSOLUTE_CAP_EXCEEDED';
      maxFileSize: number;
      showUpgradeCta: boolean;
    };

type Props = {
  size: number;
  maxUploadFileSize: number;
};

export function validateUploadFileSize({ size, maxUploadFileSize }: Props): UploadFileSizeValidation {
  if (size > ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT) {
    return {
      allowed: false,
      reason: 'ABSOLUTE_CAP_EXCEEDED',
      maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
      showUpgradeCta: false,
    };
  }

  if (maxUploadFileSize && size > maxUploadFileSize) {
    return {
      allowed: false,
      reason: 'PLAN_LIMIT_EXCEEDED',
      maxFileSize: maxUploadFileSize,
      showUpgradeCta: true,
    };
  }

  return { allowed: true };
}
