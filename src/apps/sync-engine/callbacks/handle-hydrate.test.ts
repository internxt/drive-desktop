import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('handle-hydrate', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const props = mockProps<typeof handleHydrate>({
    ctx: { virtualDrive },
    path: '/folder1/folder2/file.txt' as AbsolutePath,
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    expect(virtualDrive.hydrateFile).toBeCalledWith({ path: '/folder1/folder2/file.txt' });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
