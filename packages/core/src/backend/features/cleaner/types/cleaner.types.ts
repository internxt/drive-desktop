export type CleanableItem = {
  fullPath: string;
  fileName: string;
  sizeInBytes: number;
};

export type CleanerSection = {
  totalSizeInBytes: number;
  items: CleanableItem[];
};

export type CleanerSectionViewModel = {
  selectedAll: boolean;
  exceptions: string[];
};

export type CleanerSectionKey = 'appCache' | 'logFiles' | 'trash' | 'webStorage' | 'webCache' | 'platformSpecific';
export type CleanerReport = Record<CleanerSectionKey, CleanerSection>;
export type CleanerViewModel = Record<CleanerSectionKey, CleanerSectionViewModel>;

export type CleanupProgress = {
  currentCleaningPath: string;
  progress: number;
  deletedFiles: number;
  spaceGained: number;
  cleaning: boolean;
  cleaningCompleted: boolean;
};

type BrowserContext = {
  criticalExtensions: string[];
  criticalFilenames: string[];
};

type AppCacheContext = {
  criticalExtensions: string[];
  criticalKeywords: string[];
};

type LogFilesContext = {
  safeExtensions: string[];
};

export type CleanerContext = {
  browser: BrowserContext;
  appCache: AppCacheContext;
  logFiles: LogFilesContext;
};
