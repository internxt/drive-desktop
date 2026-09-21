/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { MailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { startMailBridge, stopMailBridge } from './mail-bridge.service';
import * as startRuntimeModule from './start-mail-bridge';
import * as stopResourcesModule from './stop-mail-bridge';

describe('mail-bridge.service', () => {
  const startRuntimeMock = partialSpyOn(startRuntimeModule, 'startMailBridge');
  const stopResourcesMock = partialSpyOn(stopResourcesModule, 'stopMailBridgeResources');

  const session: MailBridgeSession = {
    account_id: 'account-id',
    addresses: ['user@internxt.com'],
    backend_session: { token: 'token', encryption_private_key: 'private-key' },
    mail_client: { username: 'user@internxt.com', password: 'password' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stopResourcesMock.mockResolvedValue({ data: undefined, error: undefined });
  });

  it('waits for a cancelled startup before allowing a fresh startup', async () => {
    const cancelledStartup = Promise.withResolvers<Awaited<ReturnType<typeof startRuntimeModule.startMailBridge>>>();
    startRuntimeMock.mockImplementationOnce(async () => await cancelledStartup.promise);
    startRuntimeMock.mockResolvedValueOnce({ data: undefined, error: new Error('second startup') });

    const firstStartup = startMailBridge(session);
    const stopping = stopMailBridge();
    let hasStopped = false;
    void stopping.then(() => {
      hasStopped = true;
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(hasStopped).toBe(false);

    cancelledStartup.resolve({ data: undefined, error: new Error('startup cancelled') });
    await stopping;
    await firstStartup;
    await startMailBridge(session);

    expect(startRuntimeMock).toHaveBeenCalledTimes(2);
  });
});
