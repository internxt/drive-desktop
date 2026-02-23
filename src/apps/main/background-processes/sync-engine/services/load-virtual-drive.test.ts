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

  const props = mockProps<typeof loadVirtualDrive>({ ctx: { providerId: 'providerId' } });

  beforeEach(() => {
    AddonRegisterSyncRootMock.mockResolvedValue();
    getSyncRootFromPathMock.mockResolvedValue({ id: 'oldProviderId' });
    connectSyncRootMock.mockReturnValue(1n);
  });

  it('should add sync issue if register fails twice', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('UNKNOWN'));
    AddonRegisterSyncRootMock.mockRejectedValue(new Error());
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBeUndefined();
    call(addSyncIssueMock).toMatchObject({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE' });
    call(loggerMock.error).toMatchObject({ msg: 'Error loading virtual drive' });
  });

  it('should unregister with current provider id if no registered sync root', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('UNKNOWN'));
    getSyncRootFromPathMock.mockRejectedValue(new Error());
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBe(1n);
    call(unregisterSyncRootMock).toMatchObject({ providerId: 'providerId' });
    call(AddonRegisterSyncRootMock).toMatchObject({ providerId: 'providerId' });
    call(loggerMock.error).toMatchObject({ msg: 'Error getting sync root from path' });
  });

  it('should unregister with old provider id if registered sync root', async () => {
    // Given
    NodeWinRegisterSyncRootMock.mockResolvedValue(new RegisterSyncRootError('UNKNOWN'));
    // When
    const connectionkey = await loadVirtualDrive(props);
    // Then
    expect(connectionkey).toBe(1n);
    call(unregisterSyncRootMock).toStrictEqual({ providerId: 'oldProviderId' });
    call(AddonRegisterSyncRootMock).toMatchObject({ providerId: 'providerId' });
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
