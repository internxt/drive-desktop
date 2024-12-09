import { ipcRenderer } from 'electron';
import { EventEmitter } from 'events';
import { SelectedItemToScanProps } from './Antivirus';

export const antivirusEvents = new EventEmitter();

export const antivirusAPI = {
  scanItems: async (filePaths: SelectedItemToScanProps[]) => {
    try {
      return await ipcRenderer.invoke('antivirus:scan-items', filePaths);
    } catch (error) {
      console.error('Error in scanItems:', error);
      throw error;
    }
  },

  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('antivirus:scan-progress', (_, progress) =>
      callback(progress)
    );
  },

  removeScanProgressListener: () => {
    ipcRenderer.removeAllListeners('antivirus:scan-progress');
  },

  addItemsToScan: async (getFiles?: boolean) => {
    try {
      const result = await ipcRenderer.invoke(
        'antivirus:add-items-to-scan',
        getFiles
      );
      return result;
    } catch (error) {
      console.error('Error in addItemsToScan:', error);
      throw error;
    }
  },
};
