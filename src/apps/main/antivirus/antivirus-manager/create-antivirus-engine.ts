import { logger } from '@/apps/shared/logger/logger';
import { AntivirusClamAV } from '../antivirus-clam-av';
import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';
import { AntivirusType } from './types';

export async function createEngine({ type }: { type: AntivirusType }) {
  if (type === 'windows-defender') {
    try {
      return await AntivirusWindowsDefender.createInstance();
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error initializing antivirus engine, using fallback',
        exc: error,
      });
    }
  }

  return await AntivirusClamAV.createInstance();
}
