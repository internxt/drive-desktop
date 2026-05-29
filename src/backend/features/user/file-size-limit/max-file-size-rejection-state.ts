import { showMaxFileSizeRejectionModal } from '@/backend/features/user/file-size-limit/show-max-file-size-rejection-modal';
import { type UploadFileSizeValidation } from './validate-upload-file-size';

const MODAL_DEBOUNCE_MS = 2_000;

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
};

type MaxFileSizeRejectionModalDraft = Omit<MaxFileSizeRejectionModalState, 'timeout'>;

let state: MaxFileSizeRejectionModalState | undefined;

export function addMaxFileSizeRejection(rejection: MaxFileSizeRejection) {
  if (state) clearTimeout(state.timeout);

  state = {
    ...saveMaxFileSizeRejection({ state, rejection }),
    timeout: setTimeout(showMaxFileSizeModal, MODAL_DEBOUNCE_MS),
  };
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

function showMaxFileSizeModal() {
  if (state) {
    void showMaxFileSizeRejectionModal({
      variant: state.rejectedFilesCount === 1 ? 'single' : 'multiple',
      showUpgradeCta: state.showUpgradeCta,
      maxFileSize: state.maxFileSize,
      fileSize: state.fileSize,
    });

    state = undefined;
  }
}

export function clearMaxFileSizeRejectionModal() {
  if (state) clearTimeout(state.timeout);
  state = undefined;
}

function getMaxFileSizeToDisplay({
  currentMaxFileSizeToDisplay,
  newRejectedFileMaxFileSize,
}: {
  currentMaxFileSizeToDisplay?: number;
  newRejectedFileMaxFileSize?: number;
}) {
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
}) {
  if (shouldShowUpgradeCta) return Math.max(currentFileSize ?? 0, rejection.fileSize);

  return currentFileSize ?? rejection.fileSize;
}
