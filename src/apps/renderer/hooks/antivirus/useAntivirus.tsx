import { useEffect, useState } from 'react';
import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';

export type ScanType = 'files' | 'folders';
export interface ScannedItemsProps {
  file: string;
  isInfected: boolean | null;
  viruses: string[];
}
export type Views = 'locked' | 'chooseItems' | 'scan';

export const useAntivirus = () => {
  const isFreeUserPlan = false;

  const [selectedItems, setSelectedItems] = useState<SelectedItemToScanProps[]>(
    []
  );
  const [scannedItems, setScannedItems] = useState<ScannedItemsProps[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [view, setView] = useState<Views>('locked');

  useEffect(() => {
    window.electron.antivirus.onScanProgress(handleProgress);

    return () => {
      window.electron.antivirus.removeScanProgressListener();
    };
  }, []);

  //TODO: Implement the call to payments API to check if user is elegible to use the Antivirus
  //TODO: Also implement a loading state while the API call is being made
  useEffect(() => {
    if (isFreeUserPlan) {
      setView('locked');
    } else {
      setView('chooseItems');
    }
  }, []);

  const resetStates = () => {
    setSelectedItems([]);
    setScannedItems([]);
    setCurrentScanPath('');
    setCountScannedFiles(0);
    setIsScanning(false);
    setIsScanCompleted(false);
  };

  const onScanAgainButtonClicked = () => {
    setView('chooseItems');
    resetStates();
  };

  const handleProgress = (progress: {
    file: string;
    isInfected: boolean;
    viruses: string[];
    countScannedItems: number;
  }) => {
    console.log('HANDLE PROGRESS: ', progress);
    setCurrentScanPath(progress.file);
    setCountScannedFiles(progress.countScannedItems);
    setScannedItems((prevItems) => [
      ...prevItems,
      {
        file: progress.file,
        isInfected: progress.isInfected,
        viruses: progress.viruses,
      },
    ]);
  };

  const onSelectItemsButtonClicked = async (scanType: ScanType) => {
    const getFiles = scanType === 'files';
    const items = await window.electron.antivirus.addItemsToScan(getFiles);
    if (!items) return;
    setSelectedItems(items);
    return items;
  };

  const onScanItemsButtonClicked = async (
    items?: SelectedItemToScanProps[]
  ) => {
    if (!items) return;
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanItems(items);
      setIsScanCompleted(true);
    } catch (error) {
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
    const items = await onSelectItemsButtonClicked(scanType);
    setView('scan');
    await onScanItemsButtonClicked(items);
  };

  const onScanUserSystemButtonClicked = async () => {
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanSystem();
      setIsScanCompleted(true);
    } catch (error) {
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  return {
    selectedItems,
    scannedItems,
    currentScanPath,
    countScannedFiles,
    view,
    isScanning,
    isScanCompleted,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
  };
};
