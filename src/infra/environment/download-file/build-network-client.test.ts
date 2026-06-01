import { Network } from '@internxt/sdk';
import { createHash } from 'node:crypto';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '../../../core/utils/utils';
import { buildNetworkClient } from './build-network-client';

vi.mock('@internxt/sdk', () => ({
  Network: {
    Network: {
      client: vi.fn(() => ({ network: true })),
    },
  },
}));

const networkClientMock = vi.mocked(Network.Network.client);

describe('buildNetworkClient', () => {
  beforeEach(() => {
    process.env.BRIDGE_URL = 'https://bridge.test';
    process.env.INTERNXT_DESKTOP_HEADER_KEY = 'desktop-header';
  });

  it('builds an SDK network client with app metadata and hashed user id', () => {
    const client = buildNetworkClient({
      bridgeUser: 'bridge-user',
      userId: 'user-id',
    });

    expect(client).toStrictEqual({ network: true });
    expect(networkClientMock).toHaveBeenCalledWith(
      'https://bridge.test',
      {
        clientName: INTERNXT_CLIENT,
        clientVersion: INTERNXT_VERSION,
        desktopHeader: 'desktop-header',
      },
      {
        bridgeUser: 'bridge-user',
        userId: createHash('sha256').update('user-id').digest('hex'),
      },
    );
  });
});
