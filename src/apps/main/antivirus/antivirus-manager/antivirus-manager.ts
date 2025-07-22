import { AntivirusType, AntivirusEngine } from './types';
import { getActiveEngine } from './get-active-antivirus-engine';

export class AntivirusManager {
  static instance: AntivirusManager | null = null;
  currentEngine: AntivirusEngine | null = null;
  currentType: AntivirusType | null = null;

  private constructor() {}

  static getInstance() {
    if (!AntivirusManager.instance) {
      AntivirusManager.instance = new AntivirusManager();
    }
    return AntivirusManager.instance;
  }

  async getActiveEngine() {
    return await getActiveEngine({ self: this });
  }
}
