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

  let props: Parameters<typeof syncModifiedFile>[0];

  beforeEach(() => {
    pathUtilsMock.mockReturnValue(createRelativePath('/test.txt'));
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });

    props = mockProps<typeof syncModifiedFile>({
      ctx: { virtualDrive },
      localFile: { stats: { size: 1000, mtime: new Date('2000-01-02T00:00:00.000Z') } },
      remoteFile: { size: 1500, updatedAt: '2000-01-01T00:00:00.000Z' },
    });
  });

  it('should not update remote file if local and remote file sizes are equal', async () => {
    // Given
    props.remoteFile.size = 1000;
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should not update remote file if local not hydrated', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.OnlineOnly });
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should not update remote file if remote is newer', async () => {
    // Given
    props.remoteFile.updatedAt = '2000-01-03T00:00:00.000Z';
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should update remote file if local and remote file sizes are different', async () => {
    // When
    await syncModifiedFile(props);
    // Then
    expect(updateContentsIdMock).toBeCalledTimes(1);
    expect(updateContentsIdMock).toBeCalledWith(expect.objectContaining({ stats: props.localFile.stats, path: '/test.txt' }));
  });
});
