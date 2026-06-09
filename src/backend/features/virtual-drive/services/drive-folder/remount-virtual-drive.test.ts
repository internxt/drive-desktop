import * as virtualDriveServiceModule from './virtual-drive.service';
import * as removePreviousRootFolderModule from './remove-previous-root-folder';
import { remountVirtualDrive } from './remount-virtual-drive';
import { partialSpyOn, calls, call } from '../../../../../../tests/vitest/utils.helper';

describe('remount-virtual-drive', () => {
  const stopVirtualDriveOnce = partialSpyOn(virtualDriveServiceModule, 'stopVirtualDriveOnce');
  const startVirtualDrive = partialSpyOn(virtualDriveServiceModule, 'startVirtualDrive');
  const removePreviousRootFolder = partialSpyOn(removePreviousRootFolderModule, 'removePreviousRootFolder');

  type Props = Parameters<typeof remountVirtualDrive>[0];

  beforeEach(() => {
    stopVirtualDriveOnce.mockResolvedValue(undefined);
    startVirtualDrive.mockResolvedValue(undefined);
    removePreviousRootFolder.mockResolvedValue(undefined);
  });

  it('skips remount when oldPath and newPath are the same', async () => {
    // Given
    const props: Props = { oldPath: '/same/path/', newPath: '/same/path/' };

    // When
    await remountVirtualDrive(props);

    // Then
    calls(stopVirtualDriveOnce).toHaveLength(0);
    calls(startVirtualDrive).toHaveLength(0);
  });

  it('stops the drive before removing the old folder', async () => {
    // Given
    const props: Props = { oldPath: '/old/root/', newPath: '/new/root/' };

    // When
    await remountVirtualDrive(props);

    // Then
    expect(stopVirtualDriveOnce.mock.invocationCallOrder[0]).toBeLessThan(
      removePreviousRootFolder.mock.invocationCallOrder[0],
    );
  });

  it('removes the old folder before starting the drive', async () => {
    // Given
    const props: Props = { oldPath: '/old/root/', newPath: '/new/root/' };

    // When
    await remountVirtualDrive(props);

    // Then
    expect(removePreviousRootFolder.mock.invocationCallOrder[0]).toBeLessThan(
      startVirtualDrive.mock.invocationCallOrder[0],
    );
  });

  it('passes oldPath and newPath to removePreviousRootFolder', async () => {
    // Given
    const props: Props = { oldPath: '/old/root/', newPath: '/new/root/' };

    // When
    await remountVirtualDrive(props);

    // Then
    call(removePreviousRootFolder).toMatchObject({ oldPath: '/old/root/', newPath: '/new/root/' });
  });
});
