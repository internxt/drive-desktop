import { useEffect, useState } from 'react';

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
  showErrorState: boolean;
  showCancelScan: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCancelScan: () => void;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => Promise<void>;
  isWinDefenderActive: () => Promise<boolean>;
  onCancelScanButtonClicked: () => void;
  onContinueWithScan: () => void;
}

export const useAntivirus = (): UseAntivirusReturn => {
  const [infectedFiles, setInfectedFiles] = useState<string[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] =
    useState<boolean>(false);
  const [isDefenderActive, setIsDefenderActive] = useState<boolean>(false);
  const [showErrorState, setShowErrorState] = useState<boolean>(false);
  const [showCancelScan, setShowCancelScan] = useState<boolean>(false);
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
    setShowErrorState(false);
    setShowCancelScan(false);
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

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
    resetStates();
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    const items = await onSelectItemsButtonClicked(scanType);
    if (!items || items.length === 0) return;
    setView('scan');
    setIsScanning(true);
    try {
      await window.electron.antivirus.scanItems(items);
      setIsScanCompleted(true);
    } catch (error) {
      setShowErrorState(true);
    } finally {
      setIsScanning(false);
    }
  };

  const onScanUserSystemButtonClicked = async () => {
    resetStates();
    const isDefenderActive = await isWinDefenderActive();
    if (isDefenderActive) return;

    setView('scan');

    setIsScanning(true);
    try {
      await window.electron.antivirus.scanItems();
      setIsScanCompleted(true);
    } catch (error) {
      setShowErrorState(true);
    } finally {
      setIsScanning(false);
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

  const onCancelScanButtonClicked = () => {
    setShowCancelScan(true);
  };

  const onContinueWithScan = () => {
    setShowCancelScan(false);
  };

  const onCancelScan = async () => {
    try {
      resetStates();
      await window.electron.antivirus.cancelScan();
      setView('chooseItems');
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
    showErrorState,
    showCancelScan,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onRemoveInfectedItems,
    onCancelScan,
    isWinDefenderActive,
    onCancelScanButtonClicked,
    onContinueWithScan,
  };
};
