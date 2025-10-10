import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

export function processRecycleBinOutput(stdout: string, stderr: string): CleanerSection {
  if (stderr) {
    logger.warn({
      tag: 'CLEANER',
      msg: 'PowerShell stderr output',
      stderr,
    });
  }

  const lines = stdout
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const items: CleanableItem[] = [];
  let totalSizeInBytes = 0;

  logger.debug({
    tag: 'CLEANER',
    msg: `PowerShell returned ${lines.length} lines`,
  });

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 3) {
      const name = parts[0].trim();
      const path = parts[1].trim();
      const sizeStr = parts[2].trim();
      const sizeInBytes = parseInt(sizeStr) || 0;

      if (name && path) {
        items.push({
          fullPath: path,
          fileName: name,
          sizeInBytes,
        });
        totalSizeInBytes += sizeInBytes;

        logger.debug({
          tag: 'CLEANER',
          msg: `Added item: ${name} (${sizeInBytes} bytes)`,
        });
      }
    }
  }

  logger.debug({
    tag: 'CLEANER',
    msg: `Recycle Bin scan completed. Found ${items.length} items, total size: ${totalSizeInBytes} bytes`,
  });

  return {
    totalSizeInBytes,
    items,
  };
}
