import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT, validateUploadFileSize } from './validate-upload-file-size';

describe('validateUploadFileSize', () => {
  it('should allow file if size is under stored plan limit', () => {
    const res = validateUploadFileSize({ size: 5, maxUploadFileSize: 10 });

    expect(res).toStrictEqual({ allowed: true });
  });

  it('should reject file if size is over stored plan limit', () => {
    const res = validateUploadFileSize({ size: 10, maxUploadFileSize: 5 });

    expect(res).toStrictEqual({
      allowed: false,
      reason: 'PLAN_LIMIT_EXCEEDED',
      maxFileSize: 5,
      showUpgradeCta: true,
    });
  });

  it('should reject file without upgrade cta if size is over absolute cap', () => {
    const res = validateUploadFileSize({ size: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1, maxUploadFileSize: 200 * 1024 ** 3 });

    expect(res).toStrictEqual({
      allowed: false,
      reason: 'ABSOLUTE_CAP_EXCEEDED',
      maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
      showUpgradeCta: false,
    });
  });

  it('should allow file if stored plan limit is not valid', () => {
    const res = validateUploadFileSize({ size: 10 * 1024 ** 3, maxUploadFileSize: 0 });

    expect(res).toStrictEqual({ allowed: true });
  });
});
