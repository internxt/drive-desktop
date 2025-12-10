import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '../addon-wrapper';

describe('register-sync-root', () => {
  it('should throw error if path is too short', async () => {
    // When
    const promise = Addon.registerSyncRoot({ rootPath: abs('/'), providerName: 'Internxt Drive', providerId: 'providerId' });
    // Then
    await expect(promise).rejects.toThrow('Unknown error');
  });
});
