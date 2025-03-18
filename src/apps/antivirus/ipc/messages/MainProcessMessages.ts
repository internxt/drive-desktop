import { SelectedItemToScanProps } from '../../../main/antivirus/Antivirus';
import { ScanProgress } from './BackgroundProcessMessages';

/**
 * Messages that can be sent from the main process to the renderer process
 * related to Antivirus functionality
 */
export type MainProcessAntivirusMessages = {
  /**
   * Check if antivirus feature is available for the current user
   * @returns Promise<boolean> Whether antivirus feature is available
   */
  'antivirus:is-available': () => Promise<boolean>;

  /**
   * Cancel an ongoing antivirus scan
   * @returns Promise<void>
   */
  'antivirus:cancel-scan': () => Promise<void>;

  /**
   * Scan selected items for viruses
   * @param items Array of items to scan
   * @returns Promise<void>
   */
  'antivirus:scan-items': (items: SelectedItemToScanProps[]) => Promise<void>;

  /**
   * Open dialog to select additional items to scan
   * @param getFiles Whether to get files (true) or directories (false)
   * @returns Promise with selected paths
   */
  'antivirus:add-items-to-scan': (getFiles: boolean) => Promise<string[]>;

  /**
   * Remove infected files by moving them to trash
   * @param files Array of file paths to remove
   * @returns Promise<void>
   */
  'antivirus:remove-infected-files': (files: string[]) => Promise<void>;

  /**
   * Event emitted to update scan progress
   * @param progress The scan progress information
   */
  'antivirus:scan-progress': (progress: ScanProgress) => void;
};
