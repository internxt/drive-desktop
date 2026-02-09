import { createClient } from '../drive-server.client';
import eventBus from '../../../apps/main/event-bus';
import { logout } from '../../../apps/main/auth/service';
import { call } from 'tests/vitest/utils.helper';

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
    call(createClient).toMatchObject({
      baseUrl: expect.any(String),
      onUnauthorized: expect.any(Function),
    });
  });

  it('should call eventBus.emit and logout when onUnauthorized is triggered', async () => {
    await import('./drive-server.client.instance');
    const clientOptions = vi.mocked(createClient).mock.calls[0]![0]!;

    clientOptions.onUnauthorized!();

    call(eventBus.emit).toEqual('USER_WAS_UNAUTHORIZED');
    expect(logout).toHaveBeenCalled();
  });

  it('should use process.env.NEW_DRIVE_URL as baseUrl', async () => {
    process.env.NEW_DRIVE_URL = 'https://mock.api';

    vi.clearAllMocks();
    vi.resetModules();

    await import('./drive-server.client.instance');

    call(createClient).toMatchObject({ baseUrl: 'https://mock.api' });
  });
});
