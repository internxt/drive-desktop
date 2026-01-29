import { appCacheFileFilter } from './filters/app-cache/app-cache-filter';
import { isDirectoryWebBrowserRelated } from './filters/app-cache/is-directory-web-browser-related';
import { logFileFilter } from './filters/logs/log-file-filter';
import { scanFirefoxCacheProfiles } from './scan/firefox-web-cache/scan-firefox-cache-profiles';
import { scanFirefoxProfiles } from './scan/firefox-web-storage/scan-firefox-profiles';
import { processDirent } from './scan/process-dirent';
import { scanDirectory } from './scan/scan-directory';
import { scanSingleFile } from './scan/scan-single-file';
import { scanSubDirectory } from './scan/scan-subdirectory';
import { startCleanup } from './services/start-cleanup';
import { stopCleanup } from './services/stop-cleanup';
import { getAllItemsToDelete } from './utils/get-all-items-to-delete';
import { getDiskSpace } from './utils/get-disk-space';
import { getSelectedItemsForSection } from './utils/get-selected-items-for-section';
import { isInternxtRelated } from './utils/is-file-internxt-related';
import { isSafeWebBrowserFile } from './utils/is-safe-web-browser-file';

export const CleanerModule = {
  getDiskSpace,
  isInternxtRelated,
  getAllItemsToDelete,
  getSelectedItemsForSection,
  processDirent,
  scanDirectory,
  scanSingleFile,
  scanSubDirectory,
  startCleanup,
  stopCleanup,
  appCacheFileFilter,
  isDirectoryWebBrowserRelated,
  logFileFilter,
  isSafeWebBrowserFile,
  scanFirefoxCacheProfiles,
  scanFirefoxProfiles,
};
