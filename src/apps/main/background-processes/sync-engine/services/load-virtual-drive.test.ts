import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loadVirtualDrive } from './load-virtual-drive';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import * as addSyncIssue from '../../issues';
import { RegisterSyncRootError } from '@/infra/node-win/services/register-sync-root';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { Addon } from '@/node-win/addon-wrapper';

describe('load-virtual-drive', () => {
  partialSpyOn(VirtualDrive, 'createSyncRootFolder');
  const NodeWinRegisterSyncRootMock = partialSpyOn(NodeWin, 'registerSyncRoot');
  const AddonRegisterSyncRootMock = partialSpyOn(Addon, 'registerSyncRoot');
  const getSyncRootFromPathMock = partialSpyOn(Addon, 'getSyncRootFromPath');
  const unregisterSyncRootMock = partialSpyOn(Addon, 'unregisterSyncRoot');
  const connectSyncRootMock = partialSpyOn(Addon, 'connectSyncRoot');
  const addSyncIssueMock = partialSpyOn(addSyncIssue, 'addSyncIssue');

  const props = mockProps<typeof loadVirtualDrive>({ ctx: { providerId: 'syncRootId' } });

  beforeEach(() => {
    getSyncRootFromPathMock.mockResolvedValue({ id: 'oldSyncRootId' });
    connectSyncRootMock.mockReturnValue(1n);
  });

  it('should add sync issue if register sync root gives UNKNOWN error', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('UNKNOWN'));
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBeUndefined();
    call(addSyncIssueMock).toMatchObject({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE' });
    call(loggerMock.error).toMatchObject({ msg: 'Error loading virtual drive' });
  });

  it('should add sync issue if there is no old sync root registered when ACCESS_DENIED', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('ACCESS_DENIED'));
    getSyncRootFromPathMock.mockRejectedValue(new Error());
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBeUndefined();
    call(addSyncIssueMock).toMatchObject({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE' });
    calls(loggerMock.error).toMatchObject([{ msg: 'Error getting sync root from path' }, { msg: 'Error loading virtual drive' }]);
  });

  it('should unregister and register if there is an old sync root registered when ACCESS_DENIED', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('ACCESS_DENIED'));
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBe(1n);
    call(unregisterSyncRootMock).toStrictEqual({ providerId: 'oldSyncRootId' });
    call(AddonRegisterSyncRootMock).toMatchObject({ providerId: 'syncRootId' });
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should register and connect if no error happens', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(undefined);
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBe(1n);
    calls(unregisterSyncRootMock).toHaveLength(0);
    calls(AddonRegisterSyncRootMock).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });
});
