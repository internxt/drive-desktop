import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
import { validateUploadFileSize } from './validate-upload-file-size';

describe('validateUploadFileSize', () => {
  it('should pass when file size is under the stored limit', () => {
    expect(validateUploadFileSize({ size: 99, maxUploadFileSize: 100 })).toStrictEqual({ allowed: true });
  });

  it('should pass when file size is equal to the stored limit', () => {
    expect(validateUploadFileSize({ size: 100, maxUploadFileSize: 100 })).toStrictEqual({ allowed: true });
  });

  it('should return plan limit error when file size is over the stored limit', () => {
    expect(validateUploadFileSize({ size: 101, maxUploadFileSize: 100 })).toStrictEqual({
      allowed: false,
      reason: 'PLAN_LIMIT_EXCEEDED',
      maxFileSize: 100,
      showUpgradeCta: true,
    });
  });

  it('should pass when stored limit is 0 and file does not exceed absolute cap', () => {
    expect(validateUploadFileSize({ size: 101, maxUploadFileSize: 0 })).toStrictEqual({ allowed: true });
  });

  it('should pass when stored limit is null and file does not exceed absolute cap', () => {
    expect(validateUploadFileSize({ size: 101, maxUploadFileSize: null })).toStrictEqual({ allowed: true });
  });

  it('should return absolute cap error even when stored limit is unavailable', () => {
    expect(
      validateUploadFileSize({ size: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1, maxUploadFileSize: null }),
    ).toStrictEqual({
      allowed: false,
      reason: 'ABSOLUTE_CAP_EXCEEDED',
      maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
      showUpgradeCta: false,
    });
  });

  it('should ignore zero-byte files', () => {
    expect(validateUploadFileSize({ size: 0, maxUploadFileSize: 100 })).toStrictEqual({ allowed: true });
  });
});
