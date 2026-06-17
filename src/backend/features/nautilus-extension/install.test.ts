import { logger } from '@internxt/drive-desktop-core/build/backend';
import configStore from '../../../apps/main/config';
import * as isNautilusAvailableModule from './is-nautilus-available';
import * as serviceModule from './service';
import { LATEST_NAUTILUS_EXTENSION_VERSION } from './version';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';
import { installNautilusExtension } from './install';

describe('install', () => {
  const isNautilusAvailableMock = partialSpyOn(isNautilusAvailableModule, 'isNautilusAvailable');
  const isInstalledMock = partialSpyOn(serviceModule, 'isInstalled');
  const copyNautilusExtensionFileMock = partialSpyOn(serviceModule, 'copyNautilusExtensionFile');
  const deleteNautilusExtensionFileMock = partialSpyOn(serviceModule, 'deleteNautilusExtensionFile');
  const reloadNautilusMock = partialSpyOn(serviceModule, 'reloadNautilus');
  const configGetMock = partialSpyOn(configStore, 'get');
  const configSetMock = partialSpyOn(configStore, 'set');
  const loggerDebugMock = partialSpyOn(logger, 'debug');
  const loggerErrorMock = partialSpyOn(logger, 'error');

  beforeEach(() => {
    process.env.NODE_ENV = 'development';

    isNautilusAvailableMock.mockResolvedValue(true);
    isInstalledMock.mockResolvedValue(false);
    copyNautilusExtensionFileMock.mockResolvedValue(undefined);
    deleteNautilusExtensionFileMock.mockResolvedValue(undefined);
    reloadNautilusMock.mockResolvedValue(undefined);
    configGetMock.mockReturnValue(0);
  });

  it('should skip installation when nautilus is unavailable', async () => {
    // Given
    isNautilusAvailableMock.mockResolvedValueOnce(false);

    // When
    await installNautilusExtension();

    // Then
    call(isNautilusAvailableMock).toStrictEqual([]);
    calls(isInstalledMock).toHaveLength(0);
    calls(copyNautilusExtensionFileMock).toHaveLength(0);
    calls(deleteNautilusExtensionFileMock).toHaveLength(0);
    calls(configSetMock).toHaveLength(0);
    calls(reloadNautilusMock).toHaveLength(0);
  });

  it('should install and reload when extension is not installed', async () => {
    // Given
    isInstalledMock.mockResolvedValueOnce(false);

    // When
    await installNautilusExtension();

    // Then
    call(copyNautilusExtensionFileMock).toStrictEqual([]);
    call(configSetMock).toStrictEqual(['nautilusExtensionVersion', LATEST_NAUTILUS_EXTENSION_VERSION]);
    call(reloadNautilusMock).toStrictEqual([]);
    calls(deleteNautilusExtensionFileMock).toHaveLength(0);
    calls(loggerErrorMock).toHaveLength(0);
  });

  it('should log reload error and continue when reload fails after install', async () => {
    // Given
    const reloadError = new Error('reload failed');
    reloadNautilusMock.mockRejectedValueOnce(reloadError);

    // When
    await installNautilusExtension();

    // Then
    call(loggerErrorMock).toMatchObject({
      msg: 'catched error while reloading nautilus extension',
      error: reloadError,
    });
  });

  it('should replace installed extension when there is a newer version', async () => {
    // Given
    process.env.NODE_ENV = 'production';
    isInstalledMock.mockResolvedValueOnce(true);
    configGetMock.mockReturnValueOnce(LATEST_NAUTILUS_EXTENSION_VERSION - 1);

    // When
    await installNautilusExtension();

    // Then
    call(deleteNautilusExtensionFileMock).toStrictEqual([]);
    call(copyNautilusExtensionFileMock).toStrictEqual([]);
    call(configSetMock).toStrictEqual(['nautilusExtensionVersion', LATEST_NAUTILUS_EXTENSION_VERSION]);
    calls(reloadNautilusMock).toHaveLength(0);
  });

  it('should skip installation when extension is already up to date', async () => {
    // Given
    process.env.NODE_ENV = 'production';
    isInstalledMock.mockResolvedValueOnce(true);
    configGetMock.mockReturnValueOnce(LATEST_NAUTILUS_EXTENSION_VERSION);

    // When
    await installNautilusExtension();

    // Then
    calls(copyNautilusExtensionFileMock).toHaveLength(0);
    calls(deleteNautilusExtensionFileMock).toHaveLength(0);
    calls(configSetMock).toHaveLength(0);
    call(loggerDebugMock).toMatchObject({
      msg: '[NAUTILUS EXTENSION] Extension already installed with the version',
    });
  });

  it('should log error when installation flow throws', async () => {
    // Given
    const installError = new Error('install failed');
    copyNautilusExtensionFileMock.mockRejectedValueOnce(installError);

    // When
    await installNautilusExtension();

    // Then
    call(loggerErrorMock).toMatchObject({
      msg: '[NAUTILUS EXTENSION] Error while installing Nautilus extension: ',
      error: installError,
    });
  });
});
