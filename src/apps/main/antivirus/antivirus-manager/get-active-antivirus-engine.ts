import { logger } from '@/apps/shared/logger/logger';
import { clearAntivirus } from '../utils/initializeAntivirus';
import { AntivirusManager } from './antivirus-manager';
import { createEngine } from './create-antivirus-engine';
import { selectAntivirusEngine } from './select-antivirus-engine';

export async function getActiveEngine({ self }: { self: AntivirusManager }) {
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

    logger.debug({
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
