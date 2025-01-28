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
  isScanCompleted: boolean;
  progressRatio: number;
  isError: boolean;
  isAntivirusAvailable: boolean;
  isDefenderActive: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => void;
  isWinDefenderActive: () => Promise<boolean>;
}

export const useAntivirus = (): UseAntivirusReturn => {
  const [scannedItems, setScannedItems] = useState<ScannedItemsProps[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] =
    useState<boolean>(false);
  const [isDefenderActive, setIsDefenderActive] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [view, setView] = useState<Views>('locked');

  useEffect(() => {
    window.electron.antivirus.onScanProgress(handleProgress);
    return () => {
      window.electron.antivirus.removeScanProgressListener();
    };
  }, []);

  useEffect(() => {
    isUserElegible();
    isWinDefenderActive();
  }, []);

  const isUserElegible = async () => {
    try {
      const isAntivirusAvailable =
        await window.electron.antivirus.isAvailable();

      if (!isAntivirusAvailable) {
        setView('locked');
        return;
      }

      setIsAntivirusAvailable(true);
      setView('chooseItems');
    } catch (error) {
      //
      setIsAntivirusAvailable(false);
      setView('locked');
    }
  };

  const isWinDefenderActive = async () => {
    try {
      const isWinDefenderActive =
        await window.electron.antivirus.isDefenderActive();

      setIsDefenderActive(isWinDefenderActive);
      return isWinDefenderActive;
    } catch (error) {
      setIsDefenderActive(false);
      return false;
    }
  };

  const handleProgress = (progress: {
    err: string;
    file: string;
    isInfected: boolean;
    viruses: string[];
    countScannedItems: number;
    progressRatio: number;
  }) => {
    if (progress.err) setIsError(true);
    setCurrentScanPath(progress.file);
    setCountScannedFiles(progress.countScannedItems);
    setProgressRatio(progress.progressRatio);
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
    setView('chooseItems');
    setScannedItems([]);
    setCurrentScanPath('');
    setCountScannedFiles(0);
    setProgressRatio(0);
    setIsScanning(false);
    setIsScanCompleted(false);
    setIsError(false);
  };

  const onScanAgainButtonClicked = () => {
    resetStates();
  };

  const onSelectItemsButtonClicked = async (scanType: ScanType) => {
    const getFiles = scanType === 'files';
    const items = await window.electron.antivirus.addItemsToScan(getFiles);
    if (!items || items.length === 0) return;

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
      setIsError(true);
      console.error('ERROR WHILE SCANNING ITEMS: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    const items = await onSelectItemsButtonClicked(scanType);
    if (!items || items.length === 0) return;
    setView('scan');
    await onScanItemsButtonClicked(items);
  };

  const getUserSystemPath = async () => {
    const path = await window.electron.getUserSystemPath();

    return path;
  };

  const onScanUserSystemButtonClicked = async () => {
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    const userSystemPath = await getUserSystemPath();
    if (!userSystemPath) return;

    setView('scan');
    scanUserSystem(userSystemPath);
  };

  const scanUserSystem = async (userSystemPath: SelectedItemToScanProps) => {
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanSystem(userSystemPath);
      setIsScanCompleted(true);
    } catch (error) {
      console.error('ERROR WHILE SCANNING SYSTEM: ', error);
      setIsError(true);
    } finally {
      setIsScanning(false);
    }
  };

  const onRemoveInfectedItems = async (infectedFiles: string[]) => {
    if (infectedFiles.length === 0) return;

    try {
      await window.electron.antivirus.removeInfectedFiles(infectedFiles);
      setView('chooseItems');
    } catch (error) {
      console.log('ERROR WHILE REMOVING INFECTED ITEMS:', error);
    }
  };

  return {
    scannedItems,
    currentScanPath,
    countScannedFiles,
    view,
    isScanning,
    isScanCompleted,
    progressRatio,
    isError,
    isAntivirusAvailable,
    isDefenderActive,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onRemoveInfectedItems,
    isWinDefenderActive,
  };
};
