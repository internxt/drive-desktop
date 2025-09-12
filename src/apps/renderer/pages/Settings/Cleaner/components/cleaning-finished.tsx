import { Sparkle } from '@phosphor-icons/react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import CleanedFilesContainer from './cleaned-files-containter';

type Props = {
  deletedFiles: number;
  freeSpaceGained: string;
  onFinish: () => void;
};
export default function CleaningFinished({
  deletedFiles,
  freeSpaceGained,
  onFinish,
}: Props) {
  const { translate } = useTranslationContext();
  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      data-testid="clean-finished-container"
    >
      <div className="flex w-full max-w-[450px] flex-col text-center">
        <div className="mb-4 flex justify-center">
          <Sparkle color="#0066ff" weight="fill" size={64} />
        </div>
        <h3 className="text-lg font-semibold">
          {translate('settings.cleaner.cleaningView.cleaningFinished.title')}
        </h3>
        <p className="text-base text-gray-70">
          {translate('settings.cleaner.cleaningView.cleaningFinished.subtitle')}
        </p>
      </div>
      <CleanedFilesContainer
        deletedFiles={deletedFiles}
        freeSpaceGained={freeSpaceGained}
      />
      <Button
        className={'hover:cursor-pointer'}
        variant={'primary'}
        size="lg"
        onClick={onFinish}
      >
        {translate('settings.cleaner.cleaningView.cleaningFinished.finish')}
      </Button>
    </div>
  );
}
