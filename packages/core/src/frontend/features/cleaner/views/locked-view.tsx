import { Button } from '@/frontend/components/button';
import { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  useTranslationContext: () => LocalContextProps;
  openUrl: (url: string) => Promise<void>;
};

export function LockedState({ useTranslationContext, openUrl }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  async function handleOpenPricingPage() {
    try {
      await openUrl('https://internxt.com/pricing');
    } catch (error) {
      reportError(error);
    }
  }

  return (
    <div className="flex flex-col items-center p-5" data-testid="locked-state-container">
      <div className="flex flex-col items-center gap-4 text-center" data-testid="locked-state-content">
        <div className="flex flex-col">
          <p className="font-medium text-gray-100">{translate('settings.antivirus.featureLocked.title')}</p>
          <p className="text-sm text-gray-80">{translate('settings.antivirus.featureLocked.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            void handleOpenPricingPage();
          }}
          className="w-max">
          {translate('settings.antivirus.featureLocked.action')}
        </Button>
      </div>
    </div>
  );
}
