import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { v4 } from 'uuid';
import { registerSyncRoot, RegisterSyncRootError } from './register-sync-root';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { Addon } from '@/node-win/addon-wrapper';

describe('register-sync-root', () => {
  const providerId = v4();
  const providerName = 'Internxt Drive';
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, v4());

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should return error if path is too short', async () => {
    // Given
    const props = mockProps<typeof registerSyncRoot>({ ctx: { rootPath: abs('/'), providerName, providerId: v4() } });
    // When
    const error = await registerSyncRoot(props);
    // Then
    expect(error).toStrictEqual(
      new RegisterSyncRootError(
        'UNKNOWN',
        '[RegisterSyncRootAsync] WinRT error: The specified path is too short. It must have at least 1 character. (HRESULT: 0x80070057)',
      ),
    );
  });

  it('should return error if path registered with different a provider id', async () => {
    // Given
    const props = mockProps<typeof registerSyncRoot>({ ctx: { rootPath, providerName, providerId: v4() } });
    // When
    const error = await registerSyncRoot(props);
    // Then
    expect(error).toStrictEqual(
      new RegisterSyncRootError('ACCESS_DENIED', '[RegisterSyncRootAsync] WinRT error: Access is denied. (HRESULT: 0x80070005)'),
    );
  });
});
