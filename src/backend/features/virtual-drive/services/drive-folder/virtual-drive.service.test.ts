import type { Container } from 'diod';
import { DriveDependencyContainerFactory } from '../../../../../apps/drive/dependency-injection/DriveDependencyContainerFactory';
import { DependencyInjectionUserProvider } from '../../../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import * as stopVirtualDriveModule from './stop-virual-drive';
import * as remountVirtualDriveModule from './remount-virtual-drive';
import * as daemonServiceModule from '../daemon.service';
import * as serverServiceModule from '../server.service';
import * as hydrationApiServiceModule from '../hydration-api.service';
import * as hydrationStateModule from '../../../fuse/on-read/download-cache/hydration-state';
import * as virtualRootFolderModule from '../../../../../apps/main/virtual-root-folder/service';
import * as updateVirtualDriveContainerModule from '../update-virtual-drive-container.service';
import { startVirtualDrive, stopVirtualDriveOnce, remountVirtualDriveOnRootChange } from './virtual-drive.service';
import { partialSpyOn, calls, call } from '../../../../../../tests/vitest/utils.helper';

describe('virtual-drive.service', () => {
  const stopVirtualDrive = partialSpyOn(stopVirtualDriveModule, 'stopVirtualDrive');
  const remountVirtualDrive = partialSpyOn(remountVirtualDriveModule, 'remountVirtualDrive');
  const startDaemon = partialSpyOn(daemonServiceModule, 'startDaemon');
  const startFuseDaemonServer = partialSpyOn(serverServiceModule, 'startFuseDaemonServer');
  const startHydrationApi = partialSpyOn(hydrationApiServiceModule, 'startHydrationApi');
  const clearHydrationState = partialSpyOn(hydrationStateModule, 'clearHydrationState');
  const getRootVirtualDrive = partialSpyOn(virtualRootFolderModule, 'getRootVirtualDrive');
  const updateVirtualDriveContainer = partialSpyOn(updateVirtualDriveContainerModule, 'updateVirtualDriveContainer');
  const buildContainer = partialSpyOn(DriveDependencyContainerFactory, 'build');
  const getUser = partialSpyOn(DependencyInjectionUserProvider, 'get');

  const deleteAll = vi.fn();
  const containerMock = {
    get: vi.fn(() => ({ deleteAll })),
  } as unknown as Container;

  beforeEach(() => {
    stopVirtualDrive.mockResolvedValue(undefined);
    remountVirtualDrive.mockResolvedValue(undefined);
    startDaemon.mockResolvedValue(undefined);
    startFuseDaemonServer.mockResolvedValue(undefined);
    startHydrationApi.mockResolvedValue(undefined);
    getRootVirtualDrive.mockReturnValue('/mock/root/');
    getUser.mockReturnValue({} as never);
    updateVirtualDriveContainer.mockResolvedValue({});
    buildContainer.mockResolvedValue(containerMock);
    deleteAll.mockResolvedValue(undefined);
  });

  describe('startVirtualDrive', () => {
    it('builds container and starts server, hydration api and daemon', async () => {
      // When
      await startVirtualDrive();

      // Then
      calls(buildContainer).toHaveLength(1);
      calls(startFuseDaemonServer).toHaveLength(1);
      calls(startHydrationApi).toHaveLength(1);
      calls(startDaemon).toHaveLength(1);
    });

    it('clears hydration state before starting daemon', async () => {
      // When
      await startVirtualDrive();

      // Then
      expect(clearHydrationState.mock.invocationCallOrder[0]).toBeLessThan(startDaemon.mock.invocationCallOrder[0]);
    });

    it('starts daemon with the virtual drive root path', async () => {
      // When
      await startVirtualDrive();

      // Then
      call(startDaemon).toBe('/mock/root/');
    });
  });

  describe('stopVirtualDriveOnce', () => {
    it('shares in-flight stop when called twice concurrently', async () => {
      // Given
      let resolveStop: () => void;
      stopVirtualDrive.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveStop = resolve;
        }),
      );

      // When
      const first = stopVirtualDriveOnce();
      const second = stopVirtualDriveOnce();

      // Then
      calls(stopVirtualDrive).toHaveLength(1);

      resolveStop!();
      await Promise.all([first, second]);
    });
  });

  describe('remountVirtualDriveOnRootChange', () => {
    it('shares in-flight remount when called twice concurrently', async () => {
      // Given
      let resolveRemount: () => void;
      remountVirtualDrive.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveRemount = resolve;
        }),
      );

      // When
      const first = remountVirtualDriveOnRootChange({ oldPath: '/old/', newPath: '/new/' });
      const second = remountVirtualDriveOnRootChange({ oldPath: '/old/', newPath: '/new/' });

      // Then
      calls(remountVirtualDrive).toHaveLength(1);

      resolveRemount!();
      await Promise.all([first, second]);
    });
  });
});
