import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { PLANS_URL } from './constants';
import { formatBytes } from './format-bytes';
import { getDescriptionTranslationKey, getModalPropsFromUrlParams, getSuggestedUpgradePlan } from './service';
import { UpgradePlanList } from './upgrade-plan-list';

async function onUpgradePlan() {
  await globalThis.window.electron.openUrl(PLANS_URL);
  window.close();
}

export function MaxFileSizeRejectionModal() {
  const { translate } = useTranslationContext();

  const modal = getModalPropsFromUrlParams();
  if (!modal) return null;

  const suggestedPlan = modal.showUpgradeCta ? getSuggestedUpgradePlan(modal.fileSize) : undefined;

  return (
    <main className="flex h-screen w-screen items-center justify-center rounded-[20px] bg-transparent p-5 text-highlight">
      <section className="w-full max-w-[486px] bg-surface p-5 shadow-xl dark:bg-gray-1">
        <h1 className="mb-4 text-xl font-medium leading-6">
          {modal.variant === 'single'
            ? translate('maxFileSizeRejectionModal.single.title')
            : translate('maxFileSizeRejectionModal.multiple.title')}
        </h1>

        <div className="text-base leading-5 text-gray-80 dark:text-gray-80">
          <p>
            {translate(
              getDescriptionTranslationKey({
                variant: modal.variant,
                showUpgradeCta: modal.showUpgradeCta,
                hasKnownLimit: Boolean(modal.maxFileSize),
              }),
              {
                limit: modal.maxFileSize ? formatBytes(modal.maxFileSize) : '',
              },
            )}
          </p>
          {modal.showUpgradeCta && <UpgradePlanList suggestedPlan={suggestedPlan} />}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => window.close()}>
            {translate('common.close')}
          </Button>
          {modal.showUpgradeCta && (
            <Button variant="primary" onClick={onUpgradePlan}>
              {translate('maxFileSizeRejectionModal.ctaUpgrade')}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
