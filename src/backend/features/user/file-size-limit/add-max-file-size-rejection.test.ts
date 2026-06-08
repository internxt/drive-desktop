import {
  addMaxFileSizeRejection,
  clearMaxFileSizeRejectionModal,
  clearUploadSizeLimitBlockedPath,
  isUploadSizeLimitBlockedPath,
  markUploadSizeLimitBlockedPath,
} from './add-max-file-size-rejection';
import * as modalModule from './show-max-file-size-rejection-modal';

describe('addMaxFileSizeRejection', () => {
  const showModalMock = vi.spyOn(modalModule, 'showMaxFileSizeRejectionModal');
  const path = '/Documents/oversized.pdf';

  beforeEach(() => {
    vi.useFakeTimers();
    showModalMock.mockResolvedValue(undefined);
    showModalMock.mockClear();
    clearMaxFileSizeRejectionModal();
    clearUploadSizeLimitBlockedPath(path);
    clearUploadSizeLimitBlockedPath('/Documents/first.pdf');
    clearUploadSizeLimitBlockedPath('/Documents/second.pdf');
  });

  afterEach(() => {
    clearMaxFileSizeRejectionModal();
    clearUploadSizeLimitBlockedPath(path);
    clearUploadSizeLimitBlockedPath('/Documents/first.pdf');
    clearUploadSizeLimitBlockedPath('/Documents/second.pdf');
    vi.useRealTimers();
  });

  it('should track paths blocked by upload size limit', () => {
    markUploadSizeLimitBlockedPath(path);

    expect(isUploadSizeLimitBlockedPath(path)).toBe(true);
  });

  it('should clear blocked paths', () => {
    markUploadSizeLimitBlockedPath(path);

    clearUploadSizeLimitBlockedPath(path);

    expect(isUploadSizeLimitBlockedPath(path)).toBe(false);
  });

  it('should show single-file modal after debounce', () => {
    addMaxFileSizeRejection({
      path,
      fileSize: 101,
      validation: { allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 100, showUpgradeCta: true },
    });

    expect(isUploadSizeLimitBlockedPath(path)).toBe(true);

    vi.advanceTimersByTime(1_999);
    expect(showModalMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(showModalMock).toHaveBeenCalledWith({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 100,
      fileSize: 101,
    });
  });

  it('should aggregate multiple rejected files within debounce window', () => {
    addMaxFileSizeRejection({
      path: '/Documents/first.pdf',
      fileSize: 101,
      validation: { allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 100, showUpgradeCta: true },
    });
    addMaxFileSizeRejection({
      path: '/Documents/second.pdf',
      fileSize: 150,
      validation: { allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 120, showUpgradeCta: true },
    });

    expect(isUploadSizeLimitBlockedPath('/Documents/first.pdf')).toBe(true);
    expect(isUploadSizeLimitBlockedPath('/Documents/second.pdf')).toBe(true);

    vi.advanceTimersByTime(2_000);

    expect(showModalMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: 100,
      fileSize: 150,
    });
  });

  it('should keep upgrade CTA disabled for absolute cap rejections', () => {
    addMaxFileSizeRejection({
      path,
      fileSize: 150,
      validation: { allowed: false, reason: 'ABSOLUTE_CAP_EXCEEDED', maxFileSize: 100, showUpgradeCta: false },
    });

    vi.advanceTimersByTime(2_000);

    expect(showModalMock).toHaveBeenCalledWith({
      variant: 'single',
      showUpgradeCta: false,
      maxFileSize: 100,
      fileSize: 150,
    });
  });

  it('should allow backend rejections to skip blocked path tracking', () => {
    addMaxFileSizeRejection({
      path,
      fileSize: 150,
      blockUploadPath: false,
    });

    expect(isUploadSizeLimitBlockedPath(path)).toBe(false);

    vi.advanceTimersByTime(2_000);

    expect(showModalMock).toHaveBeenCalledWith({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: undefined,
      fileSize: 150,
    });
  });
});
