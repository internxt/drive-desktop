import { loggerMock } from '../../../../tests/vitest/mocks.helper';

describe('reload', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should delete, copy and reload extension then log debug', async () => {
    // Given
    const deleteNautilusExtensionFileMock = vi.fn().mockResolvedValue(undefined);
    const copyNautilusExtensionFileMock = vi.fn().mockResolvedValue(undefined);
    const reloadNautilusMock = vi.fn().mockResolvedValue(undefined);

    vi.doMock('./service', () => ({
      deleteNautilusExtensionFile: deleteNautilusExtensionFileMock,
      copyNautilusExtensionFile: copyNautilusExtensionFileMock,
      reloadNautilus: reloadNautilusMock,
    }));

    // When
    await import('./reload');
    await Promise.resolve();
    await Promise.resolve();

    // Then
    expect(deleteNautilusExtensionFileMock).toHaveBeenCalledTimes(1);
    expect(copyNautilusExtensionFileMock).toHaveBeenCalledTimes(1);
    expect(reloadNautilusMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Nautilus extension reloaded' });
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  it('should log error when reloading flow fails', async () => {
    // Given
    const reloadError = new Error('reload failed');

    vi.doMock('./service', () => ({
      deleteNautilusExtensionFile: vi.fn().mockResolvedValue(undefined),
      copyNautilusExtensionFile: vi.fn().mockResolvedValue(undefined),
      reloadNautilus: vi.fn().mockRejectedValue(reloadError),
    }));

    // When
    await import('./reload');
    await Promise.resolve();
    await Promise.resolve();

    // Then
    expect(loggerMock.error).toHaveBeenCalledWith({
      msg: 'Error while realoading Nautilus extension:',
      error: reloadError,
    });
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });
});
