import { nativeImage } from 'electron';
import * as clientCompatibilityModule from '@/backend/features/client-compatibility';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { setTrayStatus, setupTrayIcon } from './tray';

describe('tray', () => {
  const isClientUnsupportedMock = partialSpyOn(clientCompatibilityModule, 'isClientUnsupported');
  const createFromPathMock = vi.mocked(nativeImage.createFromPath);

  function lastIcon() {
    return createFromPathMock.mock.calls.at(-1)?.[0];
  }

  it('should show the loading icon when the tray is created and the client is compatible', () => {
    // Given
    isClientUnsupportedMock.mockReturnValue(false);
    // When
    setupTrayIcon();
    // Then
    expect(lastIcon()).toMatch(/loading\.png$/);
  });

  it('should show the requested status when the client is compatible', () => {
    // Given
    isClientUnsupportedMock.mockReturnValue(false);
    setupTrayIcon();
    // When
    setTrayStatus('SYNCING');
    // Then
    expect(lastIcon()).toMatch(/syncing\.png$/);
  });

  it('should show the alert as soon as the tray is created when the version is unsupported', () => {
    // Given
    isClientUnsupportedMock.mockReturnValue(true);
    // When
    setupTrayIcon();
    // Then
    expect(lastIcon()).toMatch(/alert\.png$/);
  });

  it('should keep the alert when other statuses are set while the version is unsupported', () => {
    // Given
    isClientUnsupportedMock.mockReturnValue(true);
    setupTrayIcon();
    // When
    setTrayStatus('IDLE');
    // Then
    expect(lastIcon()).toMatch(/alert\.png$/);
  });
});
