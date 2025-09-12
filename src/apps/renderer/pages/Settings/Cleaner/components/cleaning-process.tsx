import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import CleanedFilesContainer from './cleaned-files-containter';
import { ProgresBar } from './progress-bar';
type Props = {
  currentCleaningPath: string;
  cleanedProgress: number;
  deletedFiles: number;
  freeSpaceGained: string;
  onStopCleaning: () => void;
};

export default function CleaningProcess({
  currentCleaningPath,
  cleanedProgress,
  deletedFiles,
  freeSpaceGained,
  onStopCleaning,
}: Props) {
  const { translate } = useTranslationContext();
  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      data-testid="clean-process-container"
    >
      <div className="flex h-20 w-full max-w-[450px] flex-col text-center">
        <p>
          {translate('settings.cleaner.cleaningView.cleaningProcess.title')}
        </p>
        <p className="line-clamp-2">{currentCleaningPath}</p>
      </div>
      <ProgresBar progress={cleanedProgress} />
      <CleanedFilesContainer
        deletedFiles={deletedFiles}
        freeSpaceGained={freeSpaceGained}
      />
      <Button
        className={'hover:cursor-pointer'}
        variant={'dangerLight'}
        size="lg"
        onClick={onStopCleaning}
      >
        {translate(
          'settings.cleaner.cleaningView.cleaningProcess.stopCleanButton'
        )}
      </Button>
    </div>
  );
}
