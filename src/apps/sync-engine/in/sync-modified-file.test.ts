import * as updateContentsIdModule from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';
import { syncModifiedFile } from './sync-modified-file';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { PinState } from '@/node-win/types/placeholder.type';

describe('sync-modified-file', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const updateContentsIdMock = partialSpyOn(updateContentsIdModule, 'updateContentsId');
  const pathUtilsMock = partialSpyOn(pathUtils, 'absoluteToRelative');

  const props = mockProps<typeof syncModifiedFile>({
    localFile: { stats: {} },
    remoteFile: {},
    virtualDrive,
  });

  beforeEach(() => {
    pathUtilsMock.mockReturnValue(createRelativePath('/test.txt'));
  });

  it('should not update remote file if local and remote file sizes are equal', async () => {
    // Given
    props.localFile.stats.size = 1000;
    props.remoteFile.size = 1000;
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should not update remote file if local not hydrated', async () => {
    // Given
    props.localFile.stats.size = 1000;
    props.remoteFile.size = 1500;
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.OnlineOnly });
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should update remote file if local and remote file sizes are different', async () => {
    // Given
    props.localFile.stats.size = 1000;
    props.remoteFile.size = 1500;
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).toBeCalledTimes(1);
    expect(updateContentsIdMock).toBeCalledWith(expect.objectContaining({ stats: props.localFile.stats, path: '/test.txt' }));
  });
});
