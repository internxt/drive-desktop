import { useEffect, useState } from 'react';
import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';

export const useAntivirus = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItemToScanProps[]>(
    []
  );
  const [scannedItems, setScannedItems] = useState<
    {
      file: string;
      isInfected: boolean | null;
      viruses: string[];
    }[]
  >([]);
  const [currentScanPath, setCurrentScanPath] = useState<string>();
  const [countScannedFiles, setCountScannedFiles] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    window.electron.antivirus.onScanProgress(handleProgress);

    return () => {
      window.electron.antivirus.removeScanProgressListener();
    };
  }, []);

  const handleProgress = (progress: {
    file: string;
    isInfected: boolean;
    viruses: string[];
    countScannedItems: number;
  }) => {
    let scannedCount = 0;
    scannedCount += 1;

    setCurrentScanPath(progress.file);
    setCountScannedFiles(progress.countScannedItems);
  };

  const onSelectFoldersButtonClicked = async () => {
    const items = await window.electron.antivirus.addItemsToScan();
    if (!items) return;
    console.log('SELECTED ITEMS: ', items);
    setSelectedItems((prevItems) => [...prevItems, ...items]);
  };

  const onSelectFilesButtonClicked = async () => {
    const items = await window.electron.antivirus.addItemsToScan(true);
    if (!items) return;
    console.log('SELECTED ITEMS: ', items);
    setSelectedItems((prevItems) => [...prevItems, ...items]);
  };

  const getUserSystemPath = () => {
    console.log('GET USER SYSTEM PATH');
    return window.electron.antivirus.scanSystem();
  };

  const onScanUserSystemButtonClicked = async () => {
    try {
      setIsScanning(true);
      setScannedItems([]);
      await getUserSystemPath();
      setIsScanning(false);
    } catch (error) {
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
      // setIsScanning(false);
    }
  };

  const onScanItemsButtonClicked = async (
    items:
      | {
          path: string;
          itemName: string;
          isDirectory: boolean;
        }[]
      | undefined
  ) => {
    try {
      console.log('ITEMS', { items });

      setIsScanning(true);
      setScannedItems([]);
      if (!items) return;
      await window.electron.antivirus.scanItems(items);
      setIsScanning(false);
    } catch (error) {
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
      // setIsScanning(false);
    }
  };

  return {
    selectedItems,
    scannedItems,
    currentScanPath,
    countScannedFiles,
    isScanning,
    onSelectFoldersButtonClicked,
    onSelectFilesButtonClicked,
    onScanUserSystemButtonClicked,
    onScanItemsButtonClicked,
  };
};
