import { useTranslationContext } from '../../../../context/LocalContext';

interface ScanStatisticsProps {
  scannedFilesCount: number;
  corruptedFilesCount: number;
}

export const ScanStatistics = ({ scannedFilesCount, corruptedFilesCount }: ScanStatisticsProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full items-stretch gap-5 rounded-xl bg-surface py-4">
      <div className="flex w-full flex-row justify-center gap-5">
        <div className="flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center">
          <p>{scannedFilesCount}</p>
          <p>{translate('settings.antivirus.scanProcess.scannedFiles')}</p>
        </div>
        <div className="flex flex-col border border-gray-10" />
        <div className="flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center">
          <p>{corruptedFilesCount}</p>
          <p>{translate('settings.antivirus.scanProcess.detectedFiles')}</p>
        </div>
      </div>
    </div>
  );
};
