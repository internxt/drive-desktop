import path from 'node:path';
import { cwd } from 'node:process';

export const iconPath =
  process.env.NODE_ENV === 'production' ? path.join(process.resourcesPath, 'assets', 'icon.ico') : path.join(cwd(), 'assets', 'icon.ico');
