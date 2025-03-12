import { useEffect, useState } from 'react';
import log from '../../utils/logger';

export type ScanType = 'files' | 'folders';

export type Views = 'locked' | 'chooseItems' | 'scan';

export interface AntivirusContext {
  infectedFiles: string[];
  currentScanPath?: string;
  countScannedFiles: number;
  view: Views;
  isScanning: boolean;
  isScanCompleted: boolean;
  progressRatio: number;
  isAntivirusAvailable: boolean;
  showErrorState: boolean;
  onScanUserSystemButtonClicked: () => Promise<void>;
  onScanAgainButtonClicked: () => void;
  onCancelScan: () => void;
  onCustomScanButtonClicked: (scanType: ScanType) => Promise<void>;
  onRemoveInfectedItems: (infectedFiles: string[]) => Promise<void>;
}

export const useAntivirus = (): AntivirusContext => {
  const [infectedFiles, setInfectedFiles] = useState<string[]>([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] =
    useState<boolean>(false);
  const [showErrorState, setShowErrorState] = useState<boolean>(false);
  const [view, setView] = useState<Views>('locked');

  useEffect(() => {
    window.electron.antivirus.onScanProgress(handleProgress);
    return () => {
      window.electron.antivirus.removeScanProgressListener();
    };
  }, []);

  const checkAntivirusAvailability = async (): Promise<boolean> => {
    try {
      return await window.electron.antivirus.isAvailable();
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const updateEligibilityStatus = async () => {
      const isAvailable = await checkAntivirusAvailability();

      setIsAntivirusAvailable(isAvailable);
      setView(isAvailable ? 'chooseItems' : 'locked');
    };

    updateEligibilityStatus();
  }, []);

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

    return items;
  };

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
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
      log.error('ERROR WHILE REMOVING INFECTED ITEMS:', error);
    }
  };

  const onCancelScan = async () => {
    try {
      await window.electron.antivirus.cancelScan();
      setView('chooseItems');
      resetStates();
    } catch (error) {
      log.error('ERROR CANCELING SCAN:', error);
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
    showErrorState,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onRemoveInfectedItems,
    onCancelScan,
  };
};
