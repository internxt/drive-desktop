import configStore, { defaults } from '../../../apps/main/config';
import * as serviceModule from './service';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from '../../../../tests/vitest/mocks.helper';
import { uninstallNautilusExtension } from './uninstall';

describe('uninstall', () => {
  const deleteNautilusExtensionFileMock = partialSpyOn(serviceModule, 'deleteNautilusExtensionFile');
  const configSetMock = partialSpyOn(configStore, 'set');

  beforeEach(() => {
    deleteNautilusExtensionFileMock.mockResolvedValue(undefined);
  });

  it('should delete extension, reset version and log success', async () => {
    // When
    await uninstallNautilusExtension();

    // Then
    call(deleteNautilusExtensionFileMock).toStrictEqual([]);
    call(configSetMock).toStrictEqual(['nautilusExtensionVersion', defaults['nautilusExtensionVersion']]);
    call(loggerMock.debug).toMatchObject({
      msg: '[NAUTILUS EXTENSION] Extension uninstalled',
    });
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should log error when delete fails', async () => {
    // Given
    const error = new Error('cannot remove');
    deleteNautilusExtensionFileMock.mockRejectedValueOnce(error);

    // When
    await uninstallNautilusExtension();

    // Then
    call(loggerMock.error).toMatchObject({
      msg: 'Error while uninstalling Nautilus extension: ',
      error,
    });
    calls(configSetMock).toHaveLength(0);
  });
});
