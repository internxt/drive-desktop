import { Info } from '@phosphor-icons/react';
import { useTranslationContext } from '../../../../context/LocalContext';
type Props = {
  deletedFiles: number;
  skippedFiles: number;
  freeSpaceGained: string;
};
export default function CleanedFilesContainer({
  deletedFiles,
  skippedFiles,
  freeSpaceGained,
}: Props) {
  const { translate } = useTranslationContext();
  return (
    <div className="flex h-full w-full items-stretch gap-5 rounded-xl bg-surface py-4">
      <div className="flex w-full flex-row justify-center gap-5">
        <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
          <p>{deletedFiles}</p>
          <p>
            {translate(
              'settings.cleaner.cleaningView.cleaningProcess.deletedFiles'
            )}
          </p>
        </div>
        <div className="flex flex-col border border-gray-10" />
        <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
          <p>{skippedFiles}</p>
          <div className="flex items-center gap-1">
            <p>
              {translate(
                'settings.cleaner.cleaningView.cleaningProcess.skippedFiles'
              )}
            </p>
            <div className="group relative">
              <Info
                size={16}
                className="cursor-help text-blue-500 hover:text-blue-600"
              />
              <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-white px-3 py-2 text-xs text-black opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-black dark:text-white">
                {translate(
                  'settings.cleaner.cleaningView.cleaningProcess.skippedFilesTooltip'
                )}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-black"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col border border-gray-10" />
        <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
          <p>{freeSpaceGained}</p>
          <p>
            {translate(
              'settings.cleaner.cleaningView.cleaningProcess.freeSpaceGained'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
