import { createClient } from '../drive-server.client';
import Bottleneck from 'bottleneck';
import eventBus from '../../../apps/main/event-bus';
import { logout } from '../../../apps/main/auth/service';

jest.mock('../drive-server.client', () => ({
  createClient: jest.fn(() => ({}))
}));

jest.mock('../../../apps/main/auth/service', () => ({
  logout: jest.fn()
}));

jest.mock('../../../apps/main/event-bus', () => ({
  emit: jest.fn()
}));


describe('driveServerClient instance', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEW_DRIVE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEW_DRIVE_URL = originalEnv;
    } else {
      delete process.env.NEW_DRIVE_URL;
    }
  });

  it('should call createClient with expected options', async () => {
    await import('./drive-server.client.instance');
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: expect.any(String),
        limiter: expect.any(Bottleneck),
        onUnauthorized: expect.any(Function)
      })
    );
  });

  it('should call eventBus.emit and logout when onUnauthorized is triggered', () => {
    const clientOptionsArg = (createClient as jest.Mock).mock.calls[0][0];

    clientOptionsArg.onUnauthorized();

    expect(eventBus.emit).toHaveBeenCalledWith('USER_WAS_UNAUTHORIZED');
    expect(logout).toHaveBeenCalled();
  });

  it('should use process.env.NEW_DRIVE_URL as baseUrl', async () => {
    process.env.NEW_DRIVE_URL = 'https://mock.api';

    jest.resetModules();
    const { createClient } = await import('../drive-server.client');
    await import('./drive-server.client.instance');

    const clientOptions = (createClient as jest.Mock).mock.calls[0][0];
    expect(clientOptions.baseUrl).toBe('https://mock.api');
  });
});
