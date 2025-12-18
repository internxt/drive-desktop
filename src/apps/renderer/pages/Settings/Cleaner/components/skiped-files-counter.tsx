import { useTranslationContext } from '../../../../context/LocalContext';

type Props = {
  skippedFiles: number;
  hide?: boolean;
};

export function SkippedFilesCounter({ skippedFiles, hide = false }: Props) {
  const { translate } = useTranslationContext();

  return (
    <div className="flex w-full flex-row justify-center gap-5" style={{ display: hide ? 'none' : 'flex' }}>
      <div className="flex w-full max-w-[248px] flex-col items-center justify-center gap-1 text-center">
        <p>{skippedFiles}</p>
        <div className="flex items-center gap-1">
          <p>{translate('settings.cleaner.cleaningView.cleaningProcess.skippedFiles')}</p>
        </div>
      </div>
      <div className="flex flex-col border border-gray-10" />
    </div>
  );
}
