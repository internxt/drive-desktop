import Button from '../../../components/Button';
import { useAntivirus } from '../../../hooks/antivirus/useAntivirus';

interface AntivirusSectionProps {
  active: boolean;
  showSelectedItemsToScan: () => void;
}

export default function AntivirusSection({
  active,
  showSelectedItemsToScan,
}: AntivirusSectionProps) {
  const {
    countScannedFiles,
    isScanning,
    scannedItems,
    scanningCurrentItem,
    selectedItems,
    onScanItemsButtonClicked,
    onSelectFilesButtonClicked,
    onSelectFoldersButtonClicked,
  } = useAntivirus();

  return (
    <div className={`${active ? 'block' : 'hidden'} h-full w-full`}>
      <section className="flex h-full w-full flex-col">
        <div className="mx-4 flex h-full w-full flex-col items-center justify-center gap-10">
          {scanningCurrentItem && <p>{scanningCurrentItem}</p>}
          {isScanning && <p>Scanning in progress...</p>}
          {countScannedFiles && (
            <p>Current scanned files: {countScannedFiles}</p>
          )}
          {scannedItems.length > 0 && (
            <div className="w-full">
              <h3>Scan Results:</h3>
              <ul>
                {scannedItems.map((item, index) => (
                  <li key={index}>
                    <p>File: {item.file}</p>
                    <p>Status: {item.isInfected ? 'Infected' : 'Clean'}</p>
                    {item.isInfected && (
                      <p>Viruses: {item.viruses.join(', ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isScanning ? (
            <></>
          ) : (
            <div className="flex w-full flex-row items-center justify-center gap-5">
              <Button
                disabled={isScanning}
                onClick={onSelectFoldersButtonClicked}
              >
                Select folder
              </Button>
              <Button
                disabled={isScanning}
                onClick={onSelectFilesButtonClicked}
              >
                Select files
              </Button>
              <Button
                disabled={isScanning}
                hidden={selectedItems.length === 0}
                onClick={onScanItemsButtonClicked}
              >
                Scan folder
              </Button>
              <Button
                disabled={isScanning}
                hidden={selectedItems.length === 0}
                onClick={showSelectedItemsToScan}
              >
                Show selected items
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
