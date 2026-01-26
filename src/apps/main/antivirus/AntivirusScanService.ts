import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';
import { ScanOrchestrator } from './ScanOrchestrator';
import { SelectedItemToScanProps } from './Antivirus';
import { getUserSystemPath } from '../../main/device/service';

let currentScan: ScanOrchestrator | null = null;

export class AntivirusScanService {
  public static async performScan(items: SelectedItemToScanProps[]): Promise<void> {
    if (currentScan) {
      await currentScan.cancel();
    }

    const paths = items.length === 0 ? await this.getSystemScanPaths() : this.extractPaths(items);

    if (paths.length === 0) {
      logger.warn({ tag: 'ANTIVIRUS', msg: 'No paths to scan' });
      return;
    }

    currentScan = new ScanOrchestrator();

    await currentScan.scanPaths(paths);
    currentScan = null;
  }

  public static async cancelScan(): Promise<void> {
    if (currentScan) {
      await currentScan.cancel();
      currentScan = null;
    }
  }

  private static async getSystemScanPaths(): Promise<string[]> {
    const userSystemPath = await getUserSystemPath();

    if (!userSystemPath) {
      logger.error({ tag: 'ANTIVIRUS', msg: 'Could not get user system path' });
      return [];
    }

    return [userSystemPath.path];
  }

  private static extractPaths(items: SelectedItemToScanProps[]): string[] {
    return items.map((item) => item?.path).filter(Boolean);
  }

  public static async removeInfectedFiles(infectedFiles: string[]): Promise<boolean> {
    try {
      const filesToRemove = Array.isArray(infectedFiles) ? infectedFiles : [];

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Removing ${filesToRemove.length} infected files`,
      });

      if (filesToRemove.length === 0) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'No infected files to remove',
        });
        return true;
      }

      await Promise.all(
        filesToRemove.map(async (infectedFile: string) => {
          if (!infectedFile) {
            logger.warn({
              tag: 'ANTIVIRUS',
              msg: 'Invalid file path, skipping',
            });
            return;
          }

          try {
            await shell.trashItem(infectedFile);
            logger.debug({
              tag: 'ANTIVIRUS',
              msg: `Moved to trash: ${infectedFile}`,
            });
          } catch (fileError) {
            logger.error({
              tag: 'ANTIVIRUS',
              msg: `Failed to trash file ${infectedFile}:`,
              error: fileError,
            });
          }
        }),
      );

      return true;
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error removing infected files:',
        error,
      });
      return false;
    }
  }
}
