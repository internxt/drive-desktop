import { clearAntivirus } from '../utils/initializeAntivirus';
import { selectAntivirusEngine } from './select-antivirus-engine';
import { createEngine } from './create-antivirus-engine';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusManager } from './antivirus-manager';
import { AntivirusEngine } from './types';

export async function getActiveEngine({ self }: { self: AntivirusManager }): Promise<AntivirusEngine | null> {
  try {
    const selectedType = await selectAntivirusEngine();

    if (!selectedType) {
      if (self.currentEngine) {
        await self.currentEngine.stop();
        self.currentEngine = null;
        self.currentType = null;
      }
      return null;
    }

    if (self.currentEngine && self.currentType === selectedType) {
      return self.currentEngine;
    }

    if (self.currentEngine) {
      await self.currentEngine.stop();
      if (self.currentType === 'clamav') clearAntivirus();
    }

    self.currentEngine = await createEngine({ type: selectedType });
    self.currentType = selectedType;

    logger.info({
      tag: 'ANTIVIRUS',
      msg: 'Antivirus engine switched',
    });

    return self.currentEngine;
  } catch (error) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error getting active antivirus engine',
      exc: error,
    });
    return null;
  }
}
