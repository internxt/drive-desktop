import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as store from '@/apps/main/remote-sync/store';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { RecoverySyncSwitch } from './recovery-sync-switch';
import { resumeRecoveryAtStartup, shouldResumeRecovery } from './resume-recovery-at-startup';
import * as withPreservation from './run-recovery-with-preservation';

describe('resume-recovery-at-startup', () => {
  const switchMock = partialSpyOn(RecoverySyncSwitch, 'isPreservationEnabled');
  const hasUnfinishedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'hasUnfinishedRecovery');
  const getContextsMock = partialSpyOn(store, 'getSyncContexts');
  const runMock = partialSpyOn(withPreservation, 'runRecoveryWithPreservation');

  function createContext(rootUuid: string) {
    return mockProps<typeof shouldResumeRecovery>({ ctx: { rootUuid: rootUuid as FolderUuid } }).ctx;
  }

  beforeEach(() => {
    switchMock.mockReturnValue(true);
    hasUnfinishedMock.mockImplementation(({ rootUuid }) => ({ data: rootUuid === 'interrupted' }));
  });

  describe('shouldResumeRecovery', () => {
    it('should resume a root with an unfinished recovery', () => {
      // When
      const result = shouldResumeRecovery({ ctx: createContext('interrupted') });
      // Then
      expect(result).toBe(true);
      call(hasUnfinishedMock).toStrictEqual({ rootUuid: 'interrupted' });
    });

    it('should not resume while the recovery that preserves files is off', () => {
      // Given
      switchMock.mockReturnValue(false);
      // When
      const result = shouldResumeRecovery({ ctx: createContext('interrupted') });
      // Then
      expect(result).toBe(false);
      calls(hasUnfinishedMock).toHaveLength(0);
    });

    it('should not resume when it cannot check the root', () => {
      // Given
      hasUnfinishedMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
      // When
      const result = shouldResumeRecovery({ ctx: createContext('interrupted') });
      // Then
      expect(result).toBe(false);
    });
  });

  describe('resumeRecoveryAtStartup', () => {
    it('should resume only the interrupted contexts using every context for folders and roots', async () => {
      // Given
      const interrupted = createContext('interrupted');
      const finished = createContext('finished');
      getContextsMock.mockReturnValue([finished, interrupted]);
      // When
      await resumeRecoveryAtStartup();
      // Then
      call(runMock).toStrictEqual({ contexts: [interrupted], allContexts: [finished, interrupted] });
    });

    it('should do nothing when no context was interrupted', async () => {
      // Given
      getContextsMock.mockReturnValue([createContext('finished')]);
      // When
      await resumeRecoveryAtStartup();
      // Then
      calls(runMock).toHaveLength(0);
    });
  });
});
