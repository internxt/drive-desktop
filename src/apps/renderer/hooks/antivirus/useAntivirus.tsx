import { useEffect, useState } from 'react';
import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';

export type ScanType = 'files' | 'folders';

export type Views = 'loading' | 'locked' | 'chooseItems' | 'scan';

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
  const [currentScanPath, setCurrentScanPath] = useState<string>('');
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAntivirusAvailable, setIsAntivirusAvailable] = useState<boolean>(false);
  const [showErrorState, setShowErrorState] = useState<boolean>(false);
  const [view, setView] = useState<Views>('loading');

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
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error checking availability:',
        error,
      });
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
    scanId?: string;
    currentScanPath?: string;
    infectedFiles?: string[];
    progress?: number;
    totalScannedFiles?: number;
    done?: boolean;
  }) => {
    if (!progress) return;

    if (progress.currentScanPath) {
      setCurrentScanPath(progress.currentScanPath);
    }

    if (typeof progress.totalScannedFiles === 'number') {
      setCountScannedFiles(progress.totalScannedFiles);
    }

    if (typeof progress.progress === 'number') {
      setProgressRatio(progress.progress);
    }

    if (Array.isArray(progress.infectedFiles) && progress.infectedFiles.length > 0) {
      setInfectedFiles(progress.infectedFiles);
    }

    if (progress.done) {
      setProgressRatio(100);
      setTimeout(() => {
        setIsScanning(false);
        setIsScanCompleted(true);
      }, 500);
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
    try {
      const getFiles = scanType === 'files';
      const items = await window.electron.antivirus.addItemsToScan(getFiles);
      if (!items || !Array.isArray(items) || items.length === 0) {
        return null;
      }

      return items;
    } catch (error) {
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error selecting items:',
        error,
      });
      setShowErrorState(true);
      return null;
    }
  };

  const onCustomScanButtonClicked = async (scanType: ScanType) => {
    try {
      const items = await onSelectItemsButtonClicked(scanType);

      if (!items || !Array.isArray(items) || items.length === 0) {
        return;
      }

      setView('scan');
      setIsScanning(true);
      setShowErrorState(false);

      const scanItems = items.map((item: string | SelectedItemToScanProps) => {
        if (typeof item === 'string') {
          const path = item;
          const cleanPath = path.replace(/\/+$/, '');
          const seemsLikeFile = cleanPath.includes('.') && !cleanPath.endsWith('.');
          const isDirectory = scanType === 'folders' || !seemsLikeFile;

          return {
            path: path,
            itemName: cleanPath.split('/').pop() || cleanPath,
            isDirectory: isDirectory,
          };
        }
        return item;
      });

      await window.electron.antivirus.scanItems(scanItems);
    } catch (error) {
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error in custom scan:',
        error,
      });
      setShowErrorState(true);
    } finally {
      setIsScanning(false);
    }
  };

  const onScanUserSystemButtonClicked = async () => {
    setView('scan');
    setIsScanning(true);
    setShowErrorState(false);
    try {
      await window.electron.antivirus.scanItems([]);
    } catch (error) {
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error in system scan:',
        error,
      });
      setShowErrorState(true);
      setIsScanning(false);
    }
  };

  const onRemoveInfectedItems = async (filesToRemove: string[]) => {
    if (!filesToRemove || !Array.isArray(filesToRemove) || filesToRemove.length === 0) {
      return Promise.resolve();
    }

    setView('chooseItems');
    resetStates();
    try {
      await window.electron.antivirus.removeInfectedFiles(filesToRemove);
    } catch (error) {
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'ERROR WHILE REMOVING INFECTED ITEMS:',
        error,
      });
    }

    return Promise.resolve();
  };

  const onCancelScan = async () => {
    try {
      await window.electron.antivirus.cancelScan();
      setView('chooseItems');
      resetStates();
    } catch (error) {
      window.electron.logger.error({
        tag: 'ANTIVIRUS',
        msg: 'ERROR CANCELING SCAN:',
        error,
      });
    }
  };

  return {
    infectedFiles: infectedFiles || [],
    currentScanPath: currentScanPath || '',
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
