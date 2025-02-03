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
  infectedFiles: string[];
  currentScanPath?: string;
  countScannedFiles: number;
  view: Views;
  isScanning: boolean;
  isScanCompleted: boolean;
  progressRatio: number;
  isAntivirusAvailable: boolean;
  isDefenderActive: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCancelScan: () => void;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => Promise<void>;
  isWinDefenderActive: () => Promise<boolean>;
}

export const useAntivirus = (): UseAntivirusReturn => {
  const [infectedFiles, setInfectedFiles] = useState<string[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] = useState<boolean>(false);
  const [isDefenderActive, setIsDefenderActive] = useState<boolean>(false);
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
      const isAntivirusAvailable = await window.electron.antivirus.isAvailable();

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
      const isWinDefenderActive = await window.electron.antivirus.isDefenderActive();

      setIsDefenderActive(isWinDefenderActive);
      return isWinDefenderActive;
    } catch (error) {
      setIsDefenderActive(false);
      return false;
    }
  };

  const handleProgress = (progress: {
    scanId: string;
    currentScanPath: string;
    infectedFiles: string[];
    progress: number;
    totalScannedFiles: number;
    done?: boolean;
  }) => {
    if (!progress) return;

    setCurrentScanPath(progress.currentScanPath);
    setCountScannedFiles(progress.totalScannedFiles);
    setProgressRatio(progress.progress);
    setInfectedFiles(progress.infectedFiles);

    if (progress.done) {
      setIsScanning(false);
      setIsScanCompleted(true);
      return;
    }
  };

  const resetStates = () => {
    setCurrentScanPath('');
    setCountScannedFiles(0);
    setProgressRatio(0);
    setInfectedFiles([]);
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

    return items;
  };

  const onScanItemsButtonClicked = async (items?: SelectedItemToScanProps[]) => {
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
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    const items = await onSelectItemsButtonClicked(scanType);
    if (!items || items.length === 0) return;
    setView('scan');
    await onScanItemsButtonClicked(items);
  };

  const onScanUserSystemButtonClicked = async () => {
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    setView('scan');
    await scanUserSystem();
  };

  const scanUserSystem = async () => {
    setView('scan');
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanItems();
    } catch (error) {
      console.error('ERROR WHILE SCANNING SYSTEM: ', error);
    }
  };

  const onRemoveInfectedItems = async (infectedFiles: string[]) => {
    setView('chooseItems');
    resetStates();
    try {
      await window.electron.antivirus.removeInfectedFiles(infectedFiles);
    } catch (error) {
      console.log('ERROR WHILE REMOVING INFECTED ITEMS:', error);
    }
  };

  const onCancelScan = async () => {
    try {
      await window.electron.antivirus.cancelScan();
      setView('chooseItems');
      resetStates();
    } catch (error) {
      console.log('ERROR CANCELING SCAN: ', error);
    }
  };

  return {
    infectedFiles,
    currentScanPath,
    countScannedFiles,
    view,
    isScanning,
    isScanCompleted,
    progressRatio,
    isAntivirusAvailable,
    isDefenderActive,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onRemoveInfectedItems,
    onCancelScan,
    isWinDefenderActive,
  };
};
