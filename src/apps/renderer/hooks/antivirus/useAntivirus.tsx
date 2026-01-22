import { useEffect, useState } from 'react';

export type ScanType = 'files' | 'folders';
export type Views = 'locked' | 'chooseItems' | 'scan' | 'loading';

export type UseAntivirusReturn = {
  infectedFiles: string[];
  currentScanPath?: string;
  countScannedFiles: number;
  view: Views;
  isScanning: boolean;
  countFiles: boolean;
  isScanCompleted: boolean;
  progressRatio: number;
  isAntivirusAvailable: boolean;
  showErrorState: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCancelScan: () => Promise<void>;
  isUserElegible: () => Promise<void>;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => Promise<void>;
};

export const useAntivirus = (): UseAntivirusReturn => {
  const [infectedFiles, setInfectedFiles] = useState<string[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] = useState<boolean>(false);
  const [showErrorState, setShowErrorState] = useState<boolean>(false);
  const [countFiles, setCountFiles] = useState(true);
  const [view, setView] = useState<Views>('locked');

  useEffect(() => {
    globalThis.window.electron.antivirus.onScanProgress(handleProgress);
    return () => {
      globalThis.window.electron.antivirus.removeScanProgressListener();
    };
  }, []);

  useEffect(() => {
    void isUserElegible();
  }, []);

  async function isUserElegible() {
    try {
      setView('loading');
      const isAntivirusAvailable = await globalThis.window.electron.antivirus.isAvailable();

      if (!isAntivirusAvailable) {
        setView('locked');
        return;
      }

      setIsAntivirusAvailable(true);
      setView('chooseItems');
    } catch {
      setIsAntivirusAvailable(false);
      setView('locked');
    }
  }

  function handleProgress(progress: {
    scanId: string;
    currentScanPath: string;
    infectedFiles: string[];
    progress: number;
    totalScannedFiles: number;
    done?: boolean;
  }) {
    if (!progress) return;
    setCountFiles(false);
    setIsScanning(true);

    setCurrentScanPath(progress.currentScanPath);
    setCountScannedFiles(progress.totalScannedFiles);
    setProgressRatio(progress.progress);
    setInfectedFiles(progress.infectedFiles);

    if (progress.done) {
      setIsScanning(false);
      setIsScanCompleted(true);
    }
  }

  function resetStates() {
    setCurrentScanPath('');
    setCountScannedFiles(0);
    setProgressRatio(0);
    setInfectedFiles([]);
    setIsScanning(false);
    setIsScanCompleted(false);
    setShowErrorState(false);
    setCountFiles(true);
  }

  function onScanAgainButtonClicked() {
    setView('chooseItems');
    resetStates();
  }

  async function onSelectItemsButtonClicked(scanType: ScanType) {
    const getFiles = scanType === 'files';
    const items = await globalThis.window.electron.antivirus.addItemsToScan(getFiles);
    if (!items || items.length === 0) return;

    return items;
  }

  async function onCustomScanButtonClicked(scanType: ScanType) {
    resetStates();

    const items = await onSelectItemsButtonClicked(scanType);
    if (!items || items.length === 0) return;
    setView('scan');

    try {
      await globalThis.window.electron.antivirus.scanItems(items);
      setIsScanCompleted(true);
    } catch {
      setShowErrorState(true);
    } finally {
      setIsScanning(false);
    }
  }

  async function onScanUserSystemButtonClicked() {
    resetStates();

    setView('scan');

    try {
      await globalThis.window.electron.antivirus.scanItems();
      setIsScanCompleted(true);
    } catch {
      setShowErrorState(true);
    } finally {
      setIsScanning(false);
    }
  }

  async function onRemoveInfectedItems(infectedFiles: string[]) {
    setView('chooseItems');
    resetStates();
    try {
      await globalThis.window.electron.antivirus.removeInfectedFiles(infectedFiles);
    } catch (error) {
      console.log('ERROR WHILE REMOVING INFECTED ITEMS:', error);
    }
  }

  async function onCancelScan() {
    try {
      resetStates();
      await globalThis.window.electron.antivirus.cancelScan();
      setView('chooseItems');
    } catch (error) {
      console.log('ERROR CANCELING SCAN: ', error);
    }
  }

  return {
    infectedFiles,
    currentScanPath,
    countScannedFiles,
    view,
    isScanning,
    isScanCompleted,
    progressRatio,
    isAntivirusAvailable,
    showErrorState,
    countFiles,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    isUserElegible,
    onRemoveInfectedItems,
    onCancelScan,
  };
};
