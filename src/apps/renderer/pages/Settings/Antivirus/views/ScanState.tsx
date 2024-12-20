import { ShieldCheck, ShieldWarning } from 'phosphor-react';
import { useTranslationContext } from '../../../../context/LocalContext';
import Button from '../../../../components/Button';

interface ScanStateProps {
  isScanning: boolean;
  scannedFilesCount: number;
  currentScanPath?: string;
  corruptedFiles: [];
}

const ScanSuccessful = ({
  translate,
}: {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <ShieldCheck size={64} className="text-green" weight="fill" />
      <div className="flex flex-col gap-1 text-center">
        <p className="font-medium text-gray-100">
          {translate('settings.antivirus.scanProcess.noFilesFound.title')}
        </p>
        <p className="text-sm text-gray-80">
          {translate('settings.antivirus.scanProcess.noFilesFound.subtitle')}
        </p>
      </div>
    </div>
  );
};

const CorruptedItemsFound = ({
  translate,
  onRemoveMalwareButtonClicked,
}: {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
  onRemoveMalwareButtonClicked: () => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <ShieldWarning size={64} className="text-red" weight="fill" />
      <div className="flex flex-col gap-1 text-center">
        <p className="font-medium text-gray-100">
          {translate('settings.antivirus.scanProcess.malwareFound.title')}
        </p>
        <p className="text-sm text-gray-80">
          {translate('settings.antivirus.scanProcess.malwareFound.subtitle')}
        </p>
      </div>
      <Button onClick={onRemoveMalwareButtonClicked}>
        {translate('settings.antivirus.scanProcess.malwareFound.action')}
      </Button>
    </div>
  );
};

const ScanResult = ({
  corruptedFiles,
  translate,
  onRemoveMalwareButtonClicked,
}: {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
  onRemoveMalwareButtonClicked: () => void;
  corruptedFiles: [];
}) => {
  if (corruptedFiles.length > 0) {
    return (
      <CorruptedItemsFound
        translate={translate}
        onRemoveMalwareButtonClicked={onRemoveMalwareButtonClicked}
      />
    );
  }

  return <ScanSuccessful translate={translate} />;
};

const ScanProcess = ({
  currentScanPath,
  translate,
}: {
  currentScanPath?: string;
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
}) => {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="line-clamp-2 flex w-full max-w-[450px] flex-col text-center">
        <p>{translate('settings.antivirus.scanProcess.scanning')}</p>
        <p>{currentScanPath}</p>
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex h-1.5 w-full flex-col rounded-full bg-primary/10">
          <div
            className="flex h-full rounded-full bg-primary"
            style={{
              width: '30%',
            }}
          />
        </div>
        <p>30%</p>
      </div>
    </div>
  );
};

export const ScanningState = ({
  isScanning,
  corruptedFiles,
  currentScanPath,
  scannedFilesCount,
}: ScanStateProps) => {
  const { translate } = useTranslationContext();
  return (
    <section className="flex w-full flex-col items-center justify-center">
      <div className="flex h-full max-h-[320px] w-full max-w-[590px] flex-col items-center justify-center gap-10 p-5">
        {isScanning ? (
          <ScanProcess
            currentScanPath={currentScanPath}
            translate={translate}
          />
        ) : (
          <></>
        )}
        {!isScanning && (
          <ScanResult
            corruptedFiles={corruptedFiles}
            translate={translate}
            onRemoveMalwareButtonClicked={() => {
              //
            }}
          />
        )}
        <div className="flex h-full w-full items-stretch  gap-5 rounded-xl bg-surface py-4">
          <div className="flex w-full flex-row justify-center gap-5">
            <div className="flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center">
              <p>{scannedFilesCount}</p>
              <p>{translate('settings.antivirus.scanProcess.scannedFiles')}</p>
            </div>
            <div className="flex flex-col border  border-gray-10" />
            <div className="flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center">
              <p>{corruptedFiles.length}</p>
              <p>{translate('settings.antivirus.scanProcess.detectedFiles')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
