import { useTranslationContext } from '../../../../context/LocalContext';
type Props = {
  deletedFiles: number;
  skippedFiles: number;
  freeSpaceGained: string;
  hideSkippedFiles?: boolean;
};
export default function CleanedFilesContainer({ deletedFiles, skippedFiles, freeSpaceGained, hideSkippedFiles = false }: Props) {
  const { translate } = useTranslationContext();
  return (
    <div className="flex h-full w-full items-stretch gap-5 rounded-xl bg-surface py-4">
      <div className="flex w-full flex-row justify-center gap-5">
        <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
          <p>{deletedFiles}</p>
          <p>{translate('settings.cleaner.cleaningView.cleaningProcess.deletedFiles')}</p>
        </div>
        <div className="flex flex-col border border-gray-10" />
        {!hideSkippedFiles && skippedFiles > 0 && (
          <>
            <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
              <p>{skippedFiles}</p>
              <div className="flex items-center gap-1">
                <p>{translate('settings.cleaner.cleaningView.cleaningProcess.skippedFiles')}</p>
              </div>
            </div>
            <div className="flex flex-col border border-gray-10" />
          </>
        )}
        <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
          <p>{freeSpaceGained}</p>
          <p>{translate('settings.cleaner.cleaningView.cleaningProcess.freeSpaceGained')}</p>
        </div>
      </div>
    </div>
  );
}
