import path from 'node:path';
import { cwd } from 'node:process';

export const iconPath =
  process.env.NODE_ENV === 'development' ? path.join(cwd(), 'assets', 'icon.ico') : path.join(process.resourcesPath, 'assets', 'icon.ico');
