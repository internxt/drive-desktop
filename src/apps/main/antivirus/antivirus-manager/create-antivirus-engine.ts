import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';
import { AntivirusClamAV } from '../antivirus-clam-av';
import { AntivirusType, AntivirusEngine } from './types';
import { logger } from '@/apps/shared/logger/logger';

export async function createEngine({ type }: { type: AntivirusType }): Promise<AntivirusEngine> {
  if (type === 'windows-defender') {
    try {
      return await AntivirusWindowsDefender.createInstance();
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error initializing Windows Defender, falling back to ClamAV',
        exc: error,
      });
      return await AntivirusClamAV.createInstance();
    }
  }

  if (type === 'clamav') {
    return await AntivirusClamAV.createInstance();
  }

  throw new Error(`Unsupported antivirus type: ${type}`);
}
