import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type AppCachePaths = {
  localCache: AbsolutePath;
  roamingCache: AbsolutePath;
  tmpDir: AbsolutePath;
  systemTmpDir: AbsolutePath;
};

export type LogFilesPaths = {
  localLogs: AbsolutePath;
  roamingLogs: AbsolutePath;
  systemLogs: AbsolutePath;
  programDataLogs: AbsolutePath;
  userProfileLogs: AbsolutePath;
};

export type WebCachePaths = {
  chrome: AbsolutePath;
  firefox: AbsolutePath;
  edge: AbsolutePath;
  edgeIECache: AbsolutePath;
};

export type WebStoragePaths = {
  chrome: {
    cookies: AbsolutePath;
    localStorage: AbsolutePath;
  };
  edge: {
    cookies: AbsolutePath;
    localStorage: AbsolutePath;
  };
  firefox: AbsolutePath;
};

export type WindowsSpecificPaths = {
  windowsUpdateCache: AbsolutePath;
  prefetch: AbsolutePath;
};
