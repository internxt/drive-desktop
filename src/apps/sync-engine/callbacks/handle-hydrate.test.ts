import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';

describe('handle-hydrate', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const props = mockProps<typeof handleHydrate>({
    ctx: { virtualDrive },
    path: createAbsolutePath('C:/Drive/folder/file.txt'),
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    expect(virtualDrive.hydrateFile).toBeCalledWith({ itemPath: 'C:/Drive/folder/file.txt' });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
