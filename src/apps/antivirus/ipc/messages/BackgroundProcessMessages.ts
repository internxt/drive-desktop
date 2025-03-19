import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';

/**
 * Progress information for antivirus scanning
 */
export interface ScanProgress {
  currentPath?: string;
  scannedFiles: number;
  progressRatio: number;
  infected: string[];
  isCompleted: boolean;
}

/**
 * Messages that can be sent from the background process to the main process
 * related to Antivirus functionality
 */
export type BackgroundProcessAntivirusMessages = {
  /**
   * Scan selected items for viruses
   * @param items Array of items to scan
   * @returns Promise<void>
   */
  'antivirus:scan-items': (items: SelectedItemToScanProps[]) => Promise<void>;

  /**
   * Update scan progress to the main process
   * @param progress The scan progress information
   */
  'antivirus:scan-progress': (progress: ScanProgress) => void;
};
