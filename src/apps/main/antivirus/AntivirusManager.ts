import { AntivirusClamAV } from './AntivirusClamAV';
import { AntivirusWindowsDefender } from './AntivirusWindowsDefender';
import { IAntivirusEngine } from './IAntivirusEngine';
import { isWindowsDefenderRealTimeProtectionActive } from '../ipcs/ipcMainAntivirus';
import { initializeClamAV, clearAntivirus } from './utils/initializeAntivirus';
import { checkClamdAvailability } from './ClamAVDaemon';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

type AntivirusType = 'windows-defender' | 'clamav';

/**
 * Manager class that handles antivirus selection with Windows Defender as priority
 * and ClamAV as fallback
 */
class AntivirusManager {
  private static instance: AntivirusManager | null = null;
  private currentEngine: IAntivirusEngine | null = null;
  private currentType: AntivirusType | null = null;

  private constructor() {}

  static getInstance(): AntivirusManager {
    if (!AntivirusManager.instance) {
      AntivirusManager.instance = new AntivirusManager();
    }
    return AntivirusManager.instance;
  }

  /**
   * Determines which antivirus engine to use based on availability
   * Priority: Windows Defender -> ClamAV
   * @returns Promise<AntivirusType | null> - the selected antivirus type or null if none available
   */
  private async selectAntivirusEngine(): Promise<AntivirusType | null> {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Selecting antivirus engine...',
    });

    // First priority: Windows Defender
    if (await isWindowsDefenderRealTimeProtectionActive()) {
      logger.info({
        tag: 'ANTIVIRUS',
        msg: 'Windows Defender selected as primary antivirus',
      });
      return 'windows-defender';
    }

    // Fallback: ClamAV
    if (!(await checkClamdAvailability())) await initializeClamAV();
    sleep(5000); // Wait for ClamAV initialization
    if (await checkClamdAvailability()) {
      logger.info({
        tag: 'ANTIVIRUS',
        msg: 'ClamAV selected as fallback antivirus',
      });
      return 'clamav';
    }

    logger.warn({
      tag: 'ANTIVIRUS',
      msg: 'No antivirus engines available',
    });
    return null;
  }

  /**
   * Creates an antivirus engine instance based on type
   * @param type - the type of antivirus to create
   * @returns Promise<IAntivirusEngine> - initialized antivirus instance
   */
  private async createEngine(type: AntivirusType): Promise<IAntivirusEngine> {
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

  /**
   * Gets the current active antivirus engine, creating one if necessary
   * Always checks Windows Defender availability first
   * @returns Promise<IAntivirusEngine | null> - active antivirus engine or null if none available
   */
  async getActiveEngine(): Promise<IAntivirusEngine | null> {
    try {
      // Always check for the best available engine before returning current one
      const selectedType = await this.selectAntivirusEngine();

      if (!selectedType) {
        // Clean up current engine if no engines are available
        if (this.currentEngine) {
          await this.currentEngine.stop();
          this.currentEngine = null;
          this.currentType = null;
        }
        return null;
      }

      // If we already have the preferred engine running, return it
      if (this.currentEngine && this.currentType === selectedType) {
        return this.currentEngine;
      }

      // Stop current engine if we need to switch
      if (this.currentEngine) {
        await this.currentEngine.stop();
        if (this.currentType === 'clamav') clearAntivirus();
      }

      // Create and initialize new engine
      this.currentEngine = await this.createEngine(selectedType);
      this.currentType = selectedType;

      logger.info({
        tag: 'ANTIVIRUS',
        msg: `Antivirus engine switched to: ${selectedType}`,
      });

      return this.currentEngine;
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error getting active antivirus engine',
        exc: error,
      });
      return null;
    }
  }
}

// Export convenience function for easy access
export const getAntivirusManager = () => AntivirusManager.getInstance();
