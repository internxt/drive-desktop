import { Sparkle } from '@phosphor-icons/react';

import { Button } from '@/frontend/components/button';
import { LocalContextProps } from '@/frontend/frontend.types';

import { CleanedFilesContainer } from './cleaned-files-container';

type Props = {
  deletedFiles: number;
  freeSpaceGained: string;
  onFinish: () => void;
  useTranslationContext: () => LocalContextProps;
};

export function CleaningFinished({ deletedFiles, freeSpaceGained, onFinish, useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <div className="flex w-full flex-col items-center gap-4" data-testid="clean-finished-container">
      <div className="flex w-full max-w-[450px] flex-col text-center">
        <div className="mb-4 flex justify-center">
          <Sparkle color="#0066ff" weight="fill" size={64} />
        </div>
        <h3 className="text-lg font-semibold">{translate('settings.cleaner.cleaningView.cleaningFinished.title')}</h3>
        <p className="text-gray-70 text-base">{translate('settings.cleaner.cleaningView.cleaningFinished.subtitle')}</p>
      </div>
      <CleanedFilesContainer deletedFiles={deletedFiles} freeSpaceGained={freeSpaceGained} useTranslationContext={useTranslationContext} />
      <Button className={'hover:cursor-pointer'} variant={'primary'} size="lg" onClick={onFinish}>
        {translate('settings.cleaner.cleaningView.cleaningFinished.finish')}
      </Button>
    </div>
  );
}
