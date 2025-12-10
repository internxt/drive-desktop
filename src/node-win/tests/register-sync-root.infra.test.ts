import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '../addon-wrapper';
import { v4 } from 'uuid';

describe('register-sync-root', () => {
  it('should throw error if path is too short', () => {
    // When
    expect(() => {
      Addon.registerSyncRoot({
        rootPath: abs('/'),
        providerName: 'Internxt Drive',
        providerId: v4(),
      });
    }).toThrow(
      '[RegisterSyncRootWrapper] WinRT error: The specified path is too short. It must have at least 1 character. (HRESULT: 0x80070057)',
    );
  });
});
