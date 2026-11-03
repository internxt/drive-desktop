import { FileSizeLimitModule } from '@internxt/drive-desktop-core/build/backend';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as getFileSizeLimitAdapterModule from './get-file-size-limit-adapter';
import { watchFileSizeLimitAfterUpgrade } from './watch-file-size-limit-after-upgrade';

describe('watch-file-size-limit-after-upgrade', () => {
  const watchMock = partialSpyOn(FileSizeLimitModule, 'watchFileSizeLimitAfterUpgrade');
  const getFileSizeLimitAdapterMock = partialSpyOn(getFileSizeLimitAdapterModule, 'getFileSizeLimitAdapter');

  it('should watch the file size limit with the adapter of the user', () => {
    // Given
    const adapter = mockProps<typeof FileSizeLimitModule.watchFileSizeLimitAfterUpgrade>({});
    getFileSizeLimitAdapterMock.mockReturnValue(adapter);
    const props = mockProps<typeof watchFileSizeLimitAfterUpgrade>({ ctx: {} });
    // When
    watchFileSizeLimitAfterUpgrade(props);
    // Then
    call(getFileSizeLimitAdapterMock).toStrictEqual({ ctx: props.ctx });
    call(watchMock).toBe(adapter);
  });
});
