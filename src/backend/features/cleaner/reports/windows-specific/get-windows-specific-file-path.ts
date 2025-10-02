import * as path from 'node:path';
import { WindowsSpecificPaths } from '../../cleaner.types';

export function getWindowsSpecificPaths() {
  const windir = process.env.WINDIR || 'C:\\Windows';

  return {
    windowsUpdateCache: path.join(windir, 'SoftwareDistribution', 'Download'),
    prefetch: path.join(windir, 'Prefetch'),
  } as WindowsSpecificPaths;
}
