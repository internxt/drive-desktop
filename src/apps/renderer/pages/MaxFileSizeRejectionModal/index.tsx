import Button from '../../components/Button';
import { useI18n } from '../../localize/use-i18n';
import { PLANS_URL } from './constants';
import { formatBytes } from './format-bytes';
import { getModalPropsFromUrlParams, getSuggestedUpgradePlan } from './service';
import { getDescriptionTranslationKey } from './service';
import { UpgradePlanList } from './upgrade-plan-list';

export function MaxFileSizeRejectionModal() {
  const { translate } = useI18n();

  const modal = getModalPropsFromUrlParams();
  if (!modal) return null;

  async function onUpgradePlan() {
    await globalThis.window.electron.shellOpenExternal(PLANS_URL);
    globalThis.window.close();
  }
  const suggestedPlan = modal.showUpgradeCta ? getSuggestedUpgradePlan(modal.fileSize) : undefined;

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-transparent p-5 text-highlight">
      <section className="w-full max-w-[486px] rounded-xl bg-surface p-5 shadow-xl dark:bg-gray-1">
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
