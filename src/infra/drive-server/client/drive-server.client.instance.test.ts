import { createClient } from '../drive-server.client';
import Bottleneck from 'bottleneck';
import eventBus from '../../../apps/main/event-bus';
import { logout } from '../../../apps/main/auth/service';
import { Mock } from 'vitest';

vi.mock('../drive-server.client', () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock('../../../apps/main/auth/service', () => ({
  logout: vi.fn(),
}));

vi.mock('../../../apps/main/event-bus', () => ({
  default: {
    emit: vi.fn(),
  },
}));

describe('driveServerClient instance', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEW_DRIVE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEW_DRIVE_URL = originalEnv;
    } else {
      delete (process.env as any).NEW_DRIVE_URL;
    }
  });

  it('should call createClient with expected options', async () => {
    await import('./drive-server.client.instance');
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: expect.any(String),
        limiter: expect.any(Bottleneck),
        onUnauthorized: expect.any(Function),
      }),
    );
  });

  it('should call eventBus.emit and logout when onUnauthorized is triggered', async () => {
    await import('./drive-server.client.instance');
    const clientOptionsArg = (createClient as Mock).mock.calls[0][0];

    clientOptionsArg.onUnauthorized();

    expect(eventBus.emit).toHaveBeenCalledWith('USER_WAS_UNAUTHORIZED');
    expect(logout).toHaveBeenCalled();
  });

  it('should use process.env.NEW_DRIVE_URL as baseUrl', async () => {
    process.env.NEW_DRIVE_URL = 'https://mock.api';

    vi.clearAllMocks();
    vi.resetModules();

    await import('./drive-server.client.instance');

    const mostRecentCall = (createClient as Mock).mock.calls[(createClient as Mock).mock.calls.length - 1];
    const clientOptions = mostRecentCall[0];
    expect(clientOptions.baseUrl).toBe('https://mock.api');
  });
});
