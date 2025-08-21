import packageJson from '../../../../package.json';

export type AppInfo = {
  name: 'drive-desktop-linux';
  version: string;
};

export const appInfo: AppInfo = {
  name: 'drive-desktop-linux',
  version: packageJson.version,
};
