import { AntivirusType, AntivirusEngine } from './types';
import { getActiveEngine } from './get-active-antivirus-engine';

/**
 * Manager class that handles antivirus selection with Windows Defender as priority
 * and ClamAV as fallback
 */
export class AntivirusManager {
  static instance: AntivirusManager | null = null;
  currentEngine: AntivirusEngine | null = null;
  currentType: AntivirusType | null = null;

  private constructor() {}

  static getInstance(): AntivirusManager {
    if (!AntivirusManager.instance) {
      AntivirusManager.instance = new AntivirusManager();
    }
    return AntivirusManager.instance;
  }

  /**
   * Gets the current active antivirus engine, creating one if necessary
   * Always checks Windows Defender availability first
   * @returns Promise<AntivirusEngine | null> - active antivirus engine or null if none available
   */
  async getActiveEngine(): Promise<AntivirusEngine | null> {
    return await getActiveEngine(this);
  }
}

// Export convenience function for easy access
export const getAntivirusManager = () => AntivirusManager.getInstance();
