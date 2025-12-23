import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { replaceFiles } from './replace-files';
import { Sync } from '@/backend/features/sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('replace-files', () => {
  const replaceFileMock = partialSpyOn(Sync.Actions, 'replaceFile');

  let props: Parameters<typeof replaceFiles>[0];

  beforeEach(() => {
    props = mockProps<typeof replaceFiles>({
      self: { backed: 0 },
      tracker: { currentProcessed: vi.fn() },
      modified: [{ local: { stats: {} }, remote: { uuid: 'uuid' as FileUuid } }],
    });
  });

  it('should increase backed if there is an error', async () => {
    // Given
    replaceFileMock.mockRejectedValue(new Error());
    // When
    await replaceFiles(props);
    // Then
    expect(props.self.backed).toBe(1);
    calls(props.tracker.currentProcessed).toHaveLength(1);
    calls(loggerMock.error).toHaveLength(1);
  });

  it('should increase backed if file is replaced', async () => {
    // Given
    replaceFileMock.mockResolvedValue({});
    // When
    await replaceFiles(props);
    // Then
    expect(props.self.backed).toBe(1);
    calls(props.tracker.currentProcessed).toHaveLength(1);
  });
});
