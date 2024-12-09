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
  const [scanningCurrentItem, setScanningCurrentItem] = useState<string>();
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

    setScanningCurrentItem(progress.file);
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

  const onScanItemsButtonClicked = async () => {
    setIsScanning(true);
    setScannedItems([]);
    if (!selectedItems) return;
    try {
      await window.electron.antivirus.scanItems(selectedItems);
      setIsScanning(false);
    } catch (error) {
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
      // setIsScanning(false);
    }
  };

  const onRemoveItemFromList = (item: SelectedItemToScanProps) => {
    const filteredItemsWithoutSelectedItem = selectedItems.filter(
      (selectedItem) => selectedItem !== item
    );

    setSelectedItems(filteredItemsWithoutSelectedItem);
  };

  return {
    selectedItems,
    scannedItems,
    scanningCurrentItem,
    countScannedFiles,
    isScanning,
    onSelectFoldersButtonClicked,
    onSelectFilesButtonClicked,
    onScanItemsButtonClicked,
    onRemoveItemFromList,
  };
};
