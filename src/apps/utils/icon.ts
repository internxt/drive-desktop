import { ENV } from '@/core/env/env';
import path from 'path';

export const iconPath =
  ENV.NODE_ENV === 'development'
    ? path.join(__dirname, '../../../../assets', 'icon.ico')
    : path.join(process.resourcesPath, 'assets', 'icon.ico');
