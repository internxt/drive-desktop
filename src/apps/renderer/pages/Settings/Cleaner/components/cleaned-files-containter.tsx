import { useTranslationContext } from '../../../../context/LocalContext';
type Props = {
  deletedFiles: number;
  freeSpaceGained: string;
};
export default function CleanedFilesContainer({
  deletedFiles,
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
