import { getItemsToRepair, getRepairCandidates } from './get-items-to-repair';

describe('get-items-to-repair', () => {
  const checkpoint = '2026-01-01T00:00:00.000Z';
  const remote = { uuid: 'uuid', status: 'EXISTS' as const, updatedAt: '2025-06-01T00:00:00.000Z' };

  describe('getRepairCandidates', () => {
    it('should keep existing items updated before the checkpoint', () => {
      // When
      const candidates = getRepairCandidates({ remotes: [remote], checkpoint });
      // Then
      expect(candidates).toStrictEqual([remote]);
    });

    it('should leave items at or after the checkpoint to normal sync', () => {
      // Given
      const remotes = [
        { ...remote, uuid: 'at', updatedAt: checkpoint },
        { ...remote, uuid: 'after', updatedAt: '2026-02-01T00:00:00.000Z' },
      ];
      // When
      const candidates = getRepairCandidates({ remotes, checkpoint });
      // Then
      expect(candidates).toStrictEqual([]);
    });

    it('should not repair removed items', () => {
      // Given
      const remotes = [
        { ...remote, uuid: 'trashed', status: 'TRASHED' as const },
        { ...remote, uuid: 'deleted', status: 'DELETED' as const },
      ];
      // When
      const candidates = getRepairCandidates({ remotes, checkpoint });
      // Then
      expect(candidates).toStrictEqual([]);
    });
  });

  describe('getItemsToRepair', () => {
    it('should repair missing local items', () => {
      // When
      const items = getItemsToRepair({ candidates: [remote], locals: [] });
      // Then
      expect(items).toStrictEqual([remote]);
    });

    it('should repair local items older than the remote item', () => {
      // Given
      const locals = [{ uuid: 'uuid', status: 'EXISTS' as const, updatedAt: '2025-01-01T00:00:00.000Z' }];
      // When
      const items = getItemsToRepair({ candidates: [remote], locals });
      // Then
      expect(items).toStrictEqual([remote]);
    });

    it('should not repair up to date local items', () => {
      // Given
      const locals = [{ ...remote }];
      // When
      const items = getItemsToRepair({ candidates: [remote], locals });
      // Then
      expect(items).toStrictEqual([]);
    });

    it('should repair a local item with the same timestamp but a different status', () => {
      // Given
      const locals = [{ ...remote, status: 'TRASHED' as const }];
      // When
      const items = getItemsToRepair({ candidates: [remote], locals });
      // Then
      expect(items).toStrictEqual([remote]);
    });

    it('should keep local items newer than the remote item', () => {
      // Given
      const locals = [{ uuid: 'uuid', status: 'EXISTS' as const, updatedAt: '2025-12-01T00:00:00.000Z' }];
      // When
      const items = getItemsToRepair({ candidates: [remote], locals });
      // Then
      expect(items).toStrictEqual([]);
    });
  });
});
