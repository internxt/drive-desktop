import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { partialSpyOn } from '@/tests/vitest/partial-spy-on.helper';
import { ProcessRepository } from '../../repository';
import { advanceProcess } from './advance-process';
import { RECOVERY_SYNC_STAGES } from './constants';

describe('advance-process', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    database.close();
  });

  it.each([
    { stage: RECOVERY_SYNC_STAGES.SCANNING, expectedStage: 'preparing', requiredScanStage: 'scanning' },
    { stage: RECOVERY_SYNC_STAGES.PRESERVING, expectedStage: 'scanning', requiredScanStage: 'completed' },
    { stage: RECOVERY_SYNC_STAGES.REPORTING, expectedStage: 'preserving', requiredScanStage: 'completed' },
  ] as const)('requires $expectedStage and $requiredScanStage scans to enter $stage', ({ stage, expectedStage, requiredScanStage }) => {
    // Given
    const saved = Result.ok(undefined);
    const update = partialSpyOn(ProcessRepository, 'updateProcessStage').mockReturnValue(saved);

    // When
    const result = advanceProcess({ database, rootUuid: 'root', stage });

    // Then
    expect(update).toHaveBeenCalledExactlyOnceWith({ database, rootUuid: 'root', stage, expectedStage, requiredScanStage });
    expect(result).toBe(saved);
  });

  it.each(Object.values(RECOVERY_SYNC_STAGES))('returns repository errors unchanged when entering %s', (stage) => {
    // Given
    const error = new Error('Recovery stage conflict or unfinished work');
    const failed = Result.err(error);
    const update = partialSpyOn(ProcessRepository, 'updateProcessStage').mockReturnValue(failed);

    // When
    const result = advanceProcess({ database, rootUuid: 'root', stage });

    // Then
    expect(result).toBe(failed);
    expect(result.error).toBe(error);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
