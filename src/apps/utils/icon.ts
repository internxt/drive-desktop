import path from 'path';

const brandPath = '/brands/pc-cloud/';

export const iconPath =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../../../assets', brandPath, 'icon.ico')
    : path.join(process.resourcesPath, 'assets', brandPath, 'icon.ico');
