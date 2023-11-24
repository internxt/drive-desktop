import packageJson from '../../../../package.json';

export type AppInfo = {
  name: 'drive-desktop';
  version: string;
};

export const appInfo: AppInfo = {
  name: 'drive-desktop',
  version: packageJson.version,
};
