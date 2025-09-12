import { useTranslationContext } from '../../../../../renderer/context/LocalContext';
import Spinner from '../../../../assets/spinner.svg';

export function LoadingView() {
  const { translate } = useTranslationContext();
  return (
    <div
      className="flex h-full flex-col items-center justify-center p-5"
      data-testid="loading-state-container"
    >
      <div className="mt-12">
        <p className="ml-1 font-medium text-gray-100">
          {translate('settings.cleaner.loadingView.title')}
        </p>
        <p className="text-sm text-gray-80">
          {translate('settings.cleaner.loadingView.description')}
        </p>
        <div
          className="mr-4 mt-6 flex flex-col items-center text-center"
          data-testid="loading-state-content"
        >
          <Spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    </div>
  );
}
