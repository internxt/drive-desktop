import { MODAL_DEBOUNCE_MS } from './constants';
import { showMaxFileSizeRejectionModal } from './show-max-file-size-rejection-modal';
import { type UploadFileSizeValidation } from './validate-upload-file-size';

const uploadSizeLimitBlockedPaths = new Set<string>();

type MaxFileSizeRejectionModalState = {
  rejectedFilesCount: number;
  showUpgradeCta: boolean;
  maxFileSize?: number;
  fileSize?: number;
  timeout: NodeJS.Timeout;
};

type MaxFileSizeRejection = {
  validation?: Extract<UploadFileSizeValidation, { allowed: false }>;
  fileSize: number;
  path: string;
  blockUploadPath?: boolean;
};

type MaxFileSizeRejectionModalDraft = Omit<MaxFileSizeRejectionModalState, 'timeout'>;

let state: MaxFileSizeRejectionModalState | undefined;

export function markUploadSizeLimitBlockedPath(path: string): void {
  uploadSizeLimitBlockedPaths.add(path);
}

export function isUploadSizeLimitBlockedPath(path: string): boolean {
  return uploadSizeLimitBlockedPaths.has(path);
}

export function clearUploadSizeLimitBlockedPath(path: string): void {
  uploadSizeLimitBlockedPaths.delete(path);
}

export function addMaxFileSizeRejection(rejection: MaxFileSizeRejection): void {
  if (rejection.blockUploadPath ?? true) {
    markUploadSizeLimitBlockedPath(rejection.path);
  }
  if (state) clearTimeout(state.timeout);

  state = {
    ...saveMaxFileSizeRejection({ state, rejection }),
    timeout: setTimeout(showMaxFileSizeModal, MODAL_DEBOUNCE_MS),
  };
}

export function clearMaxFileSizeRejectionModal(): void {
  if (state) clearTimeout(state.timeout);
  state = undefined;
}

function saveMaxFileSizeRejection({
  state,
  rejection,
}: {
  state: MaxFileSizeRejectionModalState | undefined;
  rejection: MaxFileSizeRejection;
}): MaxFileSizeRejectionModalDraft {
  const shouldShowUpgradeCta = rejection.validation?.showUpgradeCta ?? true;

  return {
    rejectedFilesCount: (state?.rejectedFilesCount ?? 0) + 1,
    showUpgradeCta: Boolean(state?.showUpgradeCta || shouldShowUpgradeCta),
    maxFileSize: getMaxFileSizeToDisplay({
      currentMaxFileSizeToDisplay: state?.maxFileSize,
      newRejectedFileMaxFileSize: rejection.validation?.maxFileSize,
    }),
    fileSize: getRejectedFileSizeToShow({ currentFileSize: state?.fileSize, rejection, shouldShowUpgradeCta }),
  };
}

function showMaxFileSizeModal(): void {
  if (!state) {
    return;
  }

  void showMaxFileSizeRejectionModal({
    variant: state.rejectedFilesCount === 1 ? 'single' : 'multiple',
    showUpgradeCta: state.showUpgradeCta,
    maxFileSize: state.maxFileSize,
    fileSize: state.fileSize,
  });

  state = undefined;
}
function getMaxFileSizeToDisplay({
  currentMaxFileSizeToDisplay,
  newRejectedFileMaxFileSize,
}: {
  currentMaxFileSizeToDisplay?: number;
  newRejectedFileMaxFileSize?: number;
}): number | undefined {
  if (!newRejectedFileMaxFileSize) return currentMaxFileSizeToDisplay;
  if (!currentMaxFileSizeToDisplay) return newRejectedFileMaxFileSize;

  return Math.min(currentMaxFileSizeToDisplay, newRejectedFileMaxFileSize);
}

function getRejectedFileSizeToShow({
  currentFileSize,
  rejection,
  shouldShowUpgradeCta,
}: {
  currentFileSize?: number;
  rejection: MaxFileSizeRejection;
  shouldShowUpgradeCta: boolean;
}): number {
  if (shouldShowUpgradeCta) return Math.max(currentFileSize ?? 0, rejection.fileSize);

  return currentFileSize ?? rejection.fileSize;
}
