/* TODO: DELETE DEAD CODE */
import path from 'path';

export const iconPath =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../../../../assets', 'icon.ico')
    : path.join(process.resourcesPath, 'assets', 'icon.ico');
