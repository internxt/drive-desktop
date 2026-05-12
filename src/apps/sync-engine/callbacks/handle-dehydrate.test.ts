import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleDehydrate } from './handle-dehydrate';

describe('handle-dehydrate', () => {
  const dehydrateFileMock = partialSpyOn(Addon, 'dehydrateFile');

  const path = '/folder/file.txt' as AbsolutePath;
  const props = mockProps<typeof handleDehydrate>({ path });

  it('should call dehydrateFile', async () => {
    // When
    await handleDehydrate(props);
    // Then
    expect(dehydrateFileMock).toBeCalledWith({ path });
    call(loggerFn).toMatchObject({ msg: 'Dehydrating file' });
  });

  it('should call logger.error if dehydrateFile throws', async () => {
    // Given
    dehydrateFileMock.mockRejectedValue(new Error());
    // When
    await handleDehydrate(props);
    // Then
    expect(dehydrateFileMock).toBeCalledWith({ path });
    calls(loggerFn).toMatchObject([{ msg: 'Dehydrating file' }, { msg: 'Error dehydrating file' }]);
  });
});
