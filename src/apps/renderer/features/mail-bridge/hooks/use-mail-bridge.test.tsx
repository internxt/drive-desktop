/* eslint-disable sonarjs/no-hardcoded-passwords */
import { act, renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';
import { useMailBridge } from './use-mail-bridge';

describe('use-mail-bridge', () => {
  const connection = {
    imap: { host: '127.0.0.1', port: 1143, startTLS: true },
    smtp: { host: '127.0.0.1', port: 2025 },
    credentials: { username: 'user@internxt.com', password: 'local-password' },
  };

  beforeEach(() => {
    globalThis.window.electron.mailBridge = {
      start: vi.fn(),
      getStatus: vi.fn().mockResolvedValue({ status: 'running', error: undefined, connection }),
      getEmail: vi.fn().mockResolvedValue({ data: 'user@inxt.me', error: undefined }),
      getStartOnLogin: vi.fn().mockResolvedValue(false),
      setStartOnLogin: vi.fn(),
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
    expect(result.current.accountEmail).toBe('user@inxt.me');
  });

  it('shows Mail setup only when the Mail account is missing', async () => {
    globalThis.window.electron.mailBridge.getEmail = vi.fn().mockResolvedValue({
      data: undefined,
      error: { code: 'mail-not-setup', message: 'Mail account has not been set up' },
    });

    const { result } = renderHook(() => useMailBridge());

    await vi.waitFor(() => expect(result.current.viewModel).toEqual({ status: 'setup-required', error: null }));
  });

  it('shows an error when retrieving the Mail account fails', async () => {
    globalThis.window.electron.mailBridge.getEmail = vi.fn().mockResolvedValue({
      data: undefined,
      error: { code: 'mail-key-fetch-failed', message: 'Mail service is unavailable' },
    });

    const { result } = renderHook(() => useMailBridge());

    await vi.waitFor(() => expect(result.current.viewModel).toEqual({ status: 'error', error: 'Mail service is unavailable' }));
  });

  it('loads and changes the start-on-login preference', async () => {
    // Given
    const setStartOnLogin = vi.fn().mockResolvedValue(undefined);
    globalThis.window.electron.mailBridge.getStartOnLogin = vi.fn().mockResolvedValue(true);
    globalThis.window.electron.mailBridge.setStartOnLogin = setStartOnLogin;

    const { result } = renderHook(() => useMailBridge());
    await vi.waitFor(() => expect(result.current.isStartOnLoginEnabled).toBe(true));

    // When
    await act(async () => await result.current.setStartOnLogin(false));

    // Then
    expect(setStartOnLogin).toHaveBeenCalledWith(false);
    expect(result.current.isStartOnLoginEnabled).toBe(false);
  });
});
