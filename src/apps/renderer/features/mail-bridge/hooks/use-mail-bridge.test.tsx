/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { MailBridgeConnectionSettings } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { act, renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';
import { useMailBridge } from './use-mail-bridge';

describe('use-mail-bridge', () => {
  const connection: MailBridgeConnectionSettings = {
    hostname: '127.0.0.1',
    imapPort: 1143,
    smtpPort: 2025,
    imapSecurity: 'STARTTLS',
    smtpSecurity: 'None',
    username: 'user@internxt.com',
    password: 'local-password',
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

  it('keeps live progress received while the initial state is loading', async () => {
    // Given
    const email = Promise.withResolvers<{ data: string; error: undefined }>();
    globalThis.window.electron.mailBridge.getEmail = vi.fn(() => email.promise);
    const { result } = renderHook(() => useMailBridge());
    const onProgress = vi.mocked(globalThis.window.electron.mailBridge.onSyncProgressChanged).mock.calls[0][0];
    const progress = { percentage: 40, completedMessages: 4, totalMessages: 10 };
    // When
    act(() => onProgress(progress));
    await act(async () => {
      email.resolve({ data: 'user@inxt.me', error: undefined });
      await email.promise;
    });
    // Then
    await vi.waitFor(() => expect(result.current.viewModel).toMatchObject({ status: 'running', syncProgress: progress }));
    expect(globalThis.window.electron.mailBridge.resync).not.toHaveBeenCalled();
  });

  it('keeps a live running status and progress when the initial status snapshot is stopped', async () => {
    // Given
    const email = Promise.withResolvers<{ data: string; error: undefined }>();
    globalThis.window.electron.mailBridge.getEmail = vi.fn(() => email.promise);
    globalThis.window.electron.mailBridge.getStatus = vi.fn().mockResolvedValue({ status: 'stopped', error: undefined });
    const { result } = renderHook(() => useMailBridge());
    const onStatus = vi.mocked(globalThis.window.electron.mailBridge.onStatusChanged).mock.calls[0][0];
    const onProgress = vi.mocked(globalThis.window.electron.mailBridge.onSyncProgressChanged).mock.calls[0][0];
    const progress = { percentage: 40, completedMessages: 4, totalMessages: 10 };
    // When
    act(() => {
      onStatus({ status: 'running', error: undefined, connection });
      onProgress(progress);
    });

    await act(async () => {
      email.resolve({ data: 'user@inxt.me', error: undefined });
      await email.promise;
    });
    // Then
    expect(result.current.viewModel).toMatchObject({ status: 'running', syncProgress: progress });
  });

  it('updates live progress without resync and preserves it across running status events', async () => {
    // Given
    const { result } = renderHook(() => useMailBridge());
    await vi.waitFor(() => expect(result.current.isLoadingInitialStatus).toBe(false));
    const onProgress = vi.mocked(globalThis.window.electron.mailBridge.onSyncProgressChanged).mock.calls[0][0];
    const onStatus = vi.mocked(globalThis.window.electron.mailBridge.onStatusChanged).mock.calls[0][0];
    // When
    act(() => onProgress({ percentage: 40, completedMessages: 4, totalMessages: 10 }));
    act(() => onStatus({ status: 'running', error: undefined, connection }));
    // Then
    expect(result.current.viewModel).toMatchObject({ syncProgress: { percentage: 40 } });
    // When
    act(() => onProgress({ percentage: 80, completedMessages: 8, totalMessages: 10 }));
    // Then
    expect(result.current.viewModel).toMatchObject({ syncProgress: { percentage: 80 } });
    act(() => onProgress(undefined));
    expect(result.current.viewModel).not.toHaveProperty('syncProgress');
    expect(globalThis.window.electron.mailBridge.resync).not.toHaveBeenCalled();
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
