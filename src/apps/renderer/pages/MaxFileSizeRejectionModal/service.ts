import { MaxFileSizeRejectionModalProps } from '../../../../backend/features/user/file-size-limit';
import { upgradePlans } from './constants';

export function getModalPropsFromUrlParams(): MaxFileSizeRejectionModalProps | undefined {
  const rawModal = new URLSearchParams(globalThis.window.location.search).get('modal');
  if (!rawModal) return;

  try {
    return JSON.parse(rawModal) as MaxFileSizeRejectionModalProps;
  } catch {
    return;
  }
}

export function getSuggestedUpgradePlan(fileSize?: number) {
  if (!fileSize) return;
  return upgradePlans.find((plan) => fileSize <= plan.maxFileSize);
}

export function getDescriptionTranslationKey({
  variant,
  showUpgradeCta,
  hasKnownLimit,
}: {
  variant: 'single' | 'multiple';
  showUpgradeCta: boolean;
  hasKnownLimit: boolean;
}) {
  if (!hasKnownLimit) return `maxFileSizeRejectionModal.${variant}.description_unknown_limit` as const;
  if (variant === 'single' && showUpgradeCta) return 'maxFileSizeRejectionModal.single.description';
  if (variant === 'single') return 'maxFileSizeRejectionModal.single.description_no_suggested_plan';
  if (showUpgradeCta) return 'maxFileSizeRejectionModal.multiple.description';

  return 'maxFileSizeRejectionModal.multiple.description_no_suggested_plan';
}
