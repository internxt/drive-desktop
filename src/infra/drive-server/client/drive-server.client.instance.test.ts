import { partialSpyOn } from 'tests/vitest/utils.helper';

describe('driveServerClient instance', () => {
  let originalEnv: string | undefined;

  async function importAndSpy() {
    const driveServerClientModule = await import('../drive-server.client');
    const createClientMock = partialSpyOn(driveServerClientModule, 'createClient');

    await import('./drive-server.client.instance');

    const authServiceModule = await import('../../../apps/main/auth/service');
    const authHandlersModule = await import('../../../apps/main/auth/handlers');

    return { createClientMock, authServiceModule, authHandlersModule };
  }

  beforeEach(() => {
    originalEnv = process.env.NEW_DRIVE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEW_DRIVE_URL = originalEnv;
    } else {
      Reflect.deleteProperty(process.env, 'NEW_DRIVE_URL');
    }
  });

  it('should call createClient with expected options', async () => {
    const { createClientMock } = await importAndSpy();

    expect(createClientMock).toBeCalledWith(
      expect.objectContaining({
        baseUrl: expect.any(String),
        authHeadersProvider: expect.any(Function),
        onUnauthorized: expect.any(Function),
      }),
    );
  });

  it('should use getNewApiHeaders as authHeadersProvider', async () => {
    const { createClientMock, authServiceModule } = await importAndSpy();
    const clientOptions = createClientMock.mock.lastCall![0]!;

    expect(clientOptions.authHeadersProvider).toBe(authServiceModule.getNewApiHeaders);
  });

  it('should use closeUserSession as onUnauthorized', async () => {
    const { createClientMock, authHandlersModule } = await importAndSpy();
    const clientOptions = createClientMock.mock.lastCall![0]!;

    expect(clientOptions.onUnauthorized).toBe(authHandlersModule.closeUserSession);
  });

  it('should use process.env.NEW_DRIVE_URL as baseUrl', async () => {
    process.env.NEW_DRIVE_URL = 'https://mock.api';

    const { createClientMock } = await importAndSpy();

    expect(createClientMock).toBeCalledWith(expect.objectContaining({ baseUrl: 'https://mock.api' }));
  });
});
