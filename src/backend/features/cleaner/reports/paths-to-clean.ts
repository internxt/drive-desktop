import { join } from 'node:path/posix';

const localAppData = process.env.LOCALAPPDATA;
const roamingAppData = process.env.APPDATA;
// eslint-disable-next-line sonarjs/publicly-writable-directories
const tempDir = process.env.TEMP;
const windir = process.env.WINDIR;
const programData = process.env.ProgramData;

export const pathsToClean = {
  localAppData,
  roamingAppData,
  programData,
  cache: {
    tempDir,
    systemTmpDir: join(windir, 'Temp'),
  },
  logs: {
    systemLogs: join(windir, 'Logs'),
  },
  webCache: {
    chrome: join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    firefox: join(localAppData, 'Mozilla', 'Firefox', 'Profiles'),
    edge: join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
    edgeIECache: join(localAppData, 'Microsoft', 'Windows', 'INetCache'),
  },
  webStorage: {
    chrome: {
      cookies: join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cookies'),
      localStorage: join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage'),
    },
    edge: {
      cookies: join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cookies'),
      localStorage: join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Local Storage'),
    },
    firefox: join(roamingAppData, 'Mozilla', 'Firefox', 'Profiles'),
  },
  windowsSpecific: {
    windowsUpdateCache: join(windir, 'SoftwareDistribution', 'Download'),
    prefetch: join(windir, 'Prefetch'),
  },
} as const;
