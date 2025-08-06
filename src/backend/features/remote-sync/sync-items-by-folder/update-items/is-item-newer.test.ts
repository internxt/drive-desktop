import { mockProps } from '@/tests/vitest/utils.helper.test';
import { isItemNewer } from './is-item-newer';

describe('is-item-newer', () => {
  describe('same timezone', () => {
    const older = '2025-01-01T00:00:00.000Z';
    const newer = '2025-01-02T00:00:00.000Z';

    it('should return true if item is newer', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: newer }, itemDto: { updatedAt: older } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(true);
    });

    it('should return false if item is older', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: older }, itemDto: { updatedAt: newer } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(false);
    });

    it('should return false if item has the same datetime', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: newer }, itemDto: { updatedAt: newer } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(false);
    });
  });

  describe('different timezone', () => {
    const older = '2025-01-01T10:00:00+02:00'; // 08:00 UTC
    const newer = '2025-01-01T10:00:00.000Z'; // 10:00 UTC
    const same_newer = '2025-01-01T12:00:00+02:00'; // 10:00 UTC → 12:00 at GMT+2

    it('should not return false if item is newer', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: newer }, itemDto: { updatedAt: older } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(true);
    });

    it('should return false if item is older', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: older }, itemDto: { updatedAt: newer } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(false);
    });

    it('should return false if item has the same datetime', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: newer }, itemDto: { updatedAt: newer } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(false);
    });

    it('should return false if item has the same datetime', () => {
      // Given
      const props = mockProps<typeof isItemNewer>({ item: { updatedAt: newer }, itemDto: { updatedAt: same_newer } });
      // When
      const res = isItemNewer(props);
      // Then
      expect(res).toBe(false);
    });
  });
});
