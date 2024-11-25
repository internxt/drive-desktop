import { AntivirusWorker } from '../../../main/antivirus/AntivirusWorker';
import { getPathFromDialog } from '../../../main/device/service';

export const useAntivirus = () => {
  const selectItemsToScan = async () => {
    const selectedPaths = await getPathFromDialog();
    return selectedPaths;
  };

  const scanSingleFile = async (filePath: string) => {
    const antivirusWorker = await AntivirusWorker.getInstance();
    const scannedFile = await antivirusWorker.scanFile(filePath);

    return {
      isFileInfected: scannedFile?.isInfected,
      viruses: scannedFile?.viruses ?? [],
      path: scannedFile?.file,
    };
  };

  const scanSingleDir = async (filePath: string) => {
    const antivirusWorker = await AntivirusWorker.getInstance();
    const scannedFolder = await antivirusWorker.scanFolder(filePath);

    return {
      isFolderInfected: scannedFolder?.isInfected,
      cleanFiles: scannedFolder?.goodFiles,
      filesWithViruses: scannedFolder?.badFiles,
      viruses: scannedFolder?.viruses ?? [],
    };
  };

  return {
    selectItemsToScan,
    scanSingleFile,
    scanSingleDir,
  };
};
