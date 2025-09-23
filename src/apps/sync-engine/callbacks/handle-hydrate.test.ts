import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';

describe('handle-hydrate', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const props = mockProps<typeof handleHydrate>({
    ctx: { virtualDrive },
    path: createRelativePath('folder1', 'folder2', 'file.txt'),
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    expect(virtualDrive.hydrateFile).toBeCalledWith({ itemPath: '/folder1/folder2/file.txt' });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
