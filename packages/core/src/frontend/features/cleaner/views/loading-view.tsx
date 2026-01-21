import { Spinner } from '@/frontend/components/spinner';
import { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  useTranslationContext: () => LocalContextProps;
};

export function LoadingView({ useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full flex-col items-center justify-center p-5" data-testid="loading-state-container">
      <div className="mt-12">
        <p className="ml-1 font-medium text-gray-100">{translate('settings.cleaner.loadingView.title')}</p>
        <p className="text-gray-80 text-sm">{translate('settings.cleaner.loadingView.description')}</p>
        <div className="mt-6 mr-4 flex flex-col items-center text-center" data-testid="loading-state-content">
          <Spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    </div>
  );
}
