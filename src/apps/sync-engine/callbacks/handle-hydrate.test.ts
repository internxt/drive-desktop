import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('handle-hydrate', () => {
  const props = mockProps<typeof handleHydrate>({
    drive: { hydrateFile: vi.fn() },
    task: {
      path: createRelativePath('folder1', 'folder2', 'file.txt'),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    expect(props.drive.hydrateFile).toBeCalledWith({ itemPath: '/folder1/folder2/file.txt' });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
