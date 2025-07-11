import { clearAntivirus } from '../utils/initializeAntivirus';
import { selectAntivirusEngine } from './select-antivirus-engine';
import { createEngine } from './create-antivirus-engine';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusManager } from './antivirus-manager';
import { AntivirusEngine } from './types';

/**
 * Gets the current active antivirus engine, creating one if necessary
 * Always checks Windows Defender availability first
 * @returns Promise<AntivirusEngine | null> - active antivirus engine or null if none available
 */
export async function getActiveEngine(self: AntivirusManager): Promise<AntivirusEngine | null> {
  try {
    // Always check for the best available engine before returning current one
    const selectedType = await selectAntivirusEngine();

    if (!selectedType) {
      // Clean up current engine if no engines are available
      if (self.currentEngine) {
        await self.currentEngine.stop();
        self.currentEngine = null;
        self.currentType = null;
      }
      return null;
    }

    // If we already have the preferred engine running, return it
    if (self.currentEngine && self.currentType === selectedType) {
      return self.currentEngine;
    }

    // Stop current engine if we need to switch
    if (self.currentEngine) {
      await self.currentEngine.stop();
      if (self.currentType === 'clamav') clearAntivirus();
    }

    // Create and initialize new engine
    self.currentEngine = await createEngine(selectedType);
    self.currentType = selectedType;

    logger.info({
      tag: 'ANTIVIRUS',
      msg: `Antivirus engine switched to: ${selectedType}`,
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
