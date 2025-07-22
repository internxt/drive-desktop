import { AntivirusManager, getAntivirusManager } from './antivirus-manager';

describe('AntivirusManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AntivirusManager as unknown as { instance: AntivirusManager | null }).instance = null;
  });

  describe('getInstance', () => {
    it('returns a singleton instance', () => {
      // Given/When
      const instance1 = AntivirusManager.getInstance();
      const instance2 = AntivirusManager.getInstance();
      // Then
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAntivirusManager', () => {
    it('provides convenient access to the AntivirusManager instance', () => {
      // Given/When
      const managerFromFunction = getAntivirusManager();
      const managerFromClass = AntivirusManager.getInstance();
      // Then
      expect(managerFromFunction).toBe(managerFromClass);
    });
  });
});
