import { showMaxFileSizeRejectionModal } from '@/backend/features/user/file-size-limit/show-max-file-size-rejection-modal';
import { addMaxFileSizeRejection, clearMaxFileSizeRejectionModal } from './max-file-size-rejection-state';

vi.mock(import('@/backend/features/user/file-size-limit/show-max-file-size-rejection-modal'));

describe('max-file-size-rejection-state', () => {
  const showMaxFileSizeRejectionModalWindowMock = vi.mocked(showMaxFileSizeRejectionModal);

  const planLimitValidation = {
    allowed: false,
    reason: 'PLAN_LIMIT_EXCEEDED',
    maxFileSize: 5,
    showUpgradeCta: true,
  } as const;

  const absoluteCapValidation = {
    allowed: false,
    reason: 'ABSOLUTE_CAP_EXCEEDED',
    maxFileSize: 100,
    showUpgradeCta: false,
  } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    clearMaxFileSizeRejectionModal();
  });

  afterEach(() => {
    clearMaxFileSizeRejectionModal();
    vi.useRealTimers();
  });

  it('should show modal for a single file after no more rejections are added within a time frame', () => {
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 6 });

    expect(showMaxFileSizeRejectionModalWindowMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });
  });

  it('should show modal for multiple files if another rejection is added within a time frame', () => {
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 6 });
    vi.advanceTimersByTime(1_000);
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 7 });

    vi.advanceTimersByTime(1_999);
    expect(showMaxFileSizeRejectionModalWindowMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 7,
    });
  });

  it('should keep the biggest upgradeable file size for multiple rejections', () => {
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 20 });
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 10 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 20,
    });
  });

  it('should show multiple modal with upgrade and preserve upgradeable file size if one rejected file exceeds absolute cap', () => {
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 6 });
    addMaxFileSizeRejection({ validation: absoluteCapValidation, fileSize: 101 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });
  });

  it('should show modal for multiple files without upgrade if all rejected files exceed absolute cap', () => {
    addMaxFileSizeRejection({ validation: absoluteCapValidation, fileSize: 101 });
    addMaxFileSizeRejection({ validation: absoluteCapValidation, fileSize: 102 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: false,
      maxFileSize: 100,
      fileSize: 101,
    });
  });

  it('should show upgrade modal with unknown max file size', () => {
    addMaxFileSizeRejection({ fileSize: 6 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: undefined,
      fileSize: 6,
    });
  });

  it('should show multiple upgrade modal with unknown max file size and keep the biggest file size', () => {
    addMaxFileSizeRejection({ fileSize: 6 });
    addMaxFileSizeRejection({ fileSize: 20 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: undefined,
      fileSize: 20,
    });
  });

  it('should keep upgrade cta if unknown rejection is followed by absolute cap rejection', () => {
    addMaxFileSizeRejection({ fileSize: 20 });
    addMaxFileSizeRejection({ validation: absoluteCapValidation, fileSize: 101 });

    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenCalledWith({
      variant: 'multiple',
      showUpgradeCta: true,
      maxFileSize: 100,
      fileSize: 20,
    });
  });

  it('should reset after showing modal', () => {
    addMaxFileSizeRejection({ validation: planLimitValidation, fileSize: 6 });
    vi.advanceTimersByTime(2_000);

    addMaxFileSizeRejection({ validation: absoluteCapValidation, fileSize: 101 });
    vi.advanceTimersByTime(2_000);

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenNthCalledWith(1, {
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });

    expect(showMaxFileSizeRejectionModalWindowMock).toHaveBeenNthCalledWith(2, {
      variant: 'single',
      showUpgradeCta: false,
      maxFileSize: 100,
      fileSize: 101,
    });
  });
});
