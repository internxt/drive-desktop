export type CleanableItem = {
  /** Absolute file path for deletion operations */
  fullPath: string;
  /** Display name for UI */
  fileName: string;
  /** File size in bytes */
  sizeInBytes: number;
};

export type CleanerSection = {
  /** Total size of all items in bytes */
  totalSizeInBytes: number;
  /** Array of cleanable items in this section */
  items: CleanableItem[];
};
export type CleanerReport = {
  /** App cache files and directories */
  appCache: CleanerSection;
  /** Log files */
  logFiles: CleanerSection;
  /** Trash/recycle bin contents */
  trash: CleanerSection;
  /** Web storage (cookies, local storage) */
  webStorage: CleanerSection;
  /** Web browser cache */
  webCache: CleanerSection;
};

export type CleanerSectionKey = keyof CleanerReport;

export const CLEANER_SECTION_KEYS: readonly CleanerSectionKey[] = [
  'appCache',
  'logFiles',
  'trash',
  'webStorage',
  'webCache'
] as const;

export type AppCachePaths = {
  userCache: string;
  tmpDir: string;
  varTmpDir: string;
  localShareCache: string;
};

export type LogFilesPaths = {
  localShareLogs: string;
  xsessionErrorsFile: string;
  varLogDir: string;
};

export type TrashFilesPaths = {
  localShareTrash: string;
  legacyTrash: string;
  xdgDataTrash?: string;
};

export type WebStorageFilesPaths = {
  chromeCookies: string;
  chromeLocalStorage: string;
  chromeSessionStorage: string;
  chromeIndexedDB: string;
  chromeWebStorage: string;
  firefoxProfile: string;
  braveCookies: string;
  braveLocalStorage: string;
  braveSessionStorage: string;
  braveIndexedDB: string;
  braveWebStorage: string;
};

export type WebCacheFilesPaths = {
  chromeCacheDir: string;
  firefoxCacheDir: string;
  braveCacheDir: string;
};

export type CleanerSectionViewModel = {
  selectedAll: boolean;
  /** item paths that are opposite of selectedAll */
  exceptions: string[];
};

export type CleanerViewModel = {
  [sectionKey: string]: CleanerSectionViewModel;
};

export type CleanupProgress = {
  currentCleaningPath: string;
  progress: number;
  deletedFiles: number;
  spaceGained: number;
  cleaning: boolean;
  cleaningCompleted: boolean;
};
