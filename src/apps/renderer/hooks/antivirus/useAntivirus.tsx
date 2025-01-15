import { useEffect, useState } from 'react';
import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';

export type ScanType = 'files' | 'folders';
export interface ScannedItemsProps {
  file: string;
  isInfected: boolean | null;
  viruses: string[];
}
export type Views = 'locked' | 'chooseItems' | 'scan';

export interface UseAntivirusReturn {
  scannedItems: ScannedItemsProps[];
  currentScanPath?: string;
  countScannedFiles: number;
  view: Views;
  isScanning: boolean;
  selectedItems: SelectedItemToScanProps[];
  isScanCompleted: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => void;
}

export const useAntivirus = (): UseAntivirusReturn => {
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

  useEffect(() => {
    if (isFreeUserPlan) {
      setView('locked');
    } else {
      setView('chooseItems');
    }
  }, [isFreeUserPlan]);

  const handleProgress = (progress: {
    file: string;
    isInfected: boolean;
    viruses: string[];
    countScannedItems: number;
  }) => {
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

  const onSelectItemsButtonClicked = async (scanType: ScanType) => {
    const getFiles = scanType === 'files';
    const items = await window.electron.antivirus.addItemsToScan(getFiles);
    if (!items || items.length === 0) return;
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
      console.error('ERROR WHILE SCANNING ITEMS: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
    const items = await onSelectItemsButtonClicked(scanType);
    if (!items || items.length === 0) return;
    setView('scan');
    await onScanItemsButtonClicked(items);
  };

  const onScanUserSystemButtonClicked = async () => {
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanSystem();
      setIsScanCompleted(true);
    } catch (error) {
      console.error('ERROR WHILE SCANNING SYSTEM: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  const onRemoveInfectedItems = async (infectedFiles: string[]) => {
    if (infectedFiles.length === 0) return;

    try {
      window.electron.antivirus.removeInfectedFiles(infectedFiles);
    } catch (error) {
      console.log('ERROR WHILE REMOVING INFECTED ITEMS:', error);
    }
  };

  return {
    scannedItems,
    currentScanPath,
    countScannedFiles,
    view,
    selectedItems,
    isScanning,
    isScanCompleted,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onRemoveInfectedItems,
  };
};
