import { renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';
import { useMailBridge } from './use-mail-bridge';

describe('use-mail-bridge', () => {
  const connection = {
    imap: { host: '127.0.0.1', port: 1143, startTLS: true },
    smtp: { host: '127.0.0.1', port: 2025 },
    credentials: { username: 'user@internxt.com', password: 'local-password' },
  };

  beforeEach(() => {
    window.electron.mailBridge = {
      start: vi.fn(),
      getStatus: vi.fn().mockResolvedValue({ status: 'running', error: undefined, connection }),
      stop: vi.fn(),
      resync: vi.fn(),
      getSyncProgress: vi.fn().mockResolvedValue(undefined),
      onStatusChanged: vi.fn(() => () => undefined),
      onSyncProgressChanged: vi.fn(() => () => undefined),
    };
  });

  it('restores the running view when it remounts', async () => {
    // Given
    const { result } = renderHook(() => useMailBridge());

    // Then
    await vi.waitFor(() => expect(result.current.viewModel).toEqual({ status: 'running', error: null, connection }));
  });
});
