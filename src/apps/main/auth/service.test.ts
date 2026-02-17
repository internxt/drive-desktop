import { canHisConfigBeRestored, logout } from './service';
import ConfigStore, { AppStore, defaults, fieldsToSave } from '../config';
import { User } from '../types';
import { partialSpyOn } from 'tests/vitest/utils.helper';

vi.mock('../../../infra/drive-server/drive-server.module', () => ({
  driveServerModule: {
    auth: {
      logout: vi.fn(),
    },
  },
}));

describe('saveConfig and canHisConfigBeRestored', () => {
  const mockConfigStoreGet = partialSpyOn(ConfigStore, 'get');
  const mockConfigStoreSet = partialSpyOn(ConfigStore, 'set');

  const fakeUuid = 'user-uuid-1234';

  const fakeUser: User = {
    backupsBucket: 'backups-bucket',
    bridgeUser: 'bridge-user',
    bucket: 'bucket',
    createdAt: '2025-01-01T00:00:00Z',
    credit: 0,
    uuid: fakeUuid,
    email: 'test@test.com',
    hasReferralsProgram: false,
    lastname: 'User',
    mnemonic: 'fake-mnemonic',
    name: 'Test',
    privateKey: '',
    publicKey: '',
    registerCompleted: true,
    revocateKey: '',
    root_folder_id: 1,
    rootFolderId: 'root-folder-uuid',
    sharedWorkspace: false,
    teams: false,
    userId: 'user-id',
    username: 'test-user',
  };

  const fakeBackupList = {
    '/home/user/Documents': {
      enabled: true,
      folderId: 100,
      folderUuid: 'folder-uuid-100',
    },
    '/home/user/Photos': {
      enabled: true,
      folderId: 200,
      folderUuid: 'folder-uuid-200',
    },
  };

  const fakeDeviceUUID = 'device-uuid-5678';

  const createConfigState = (overrides: Partial<AppStore>): AppStore => ({
    ...defaults,
    ...overrides,
  });

  const mockStoreForState = (configState: AppStore) => {
    const storeAsRecord = configState as unknown as Record<string, unknown>;
    mockConfigStoreGet.mockImplementation((key: string) => storeAsRecord[key]);

    function setImpl<Key extends keyof AppStore>(key: Key, value?: AppStore[Key]): void;
    function setImpl(key: string, value: unknown): void;
    function setImpl(object: Partial<AppStore>): void;
    function setImpl(keyOrObject: keyof AppStore | string | Partial<AppStore>, value?: unknown): void {
      if (typeof keyOrObject === 'string') {
        storeAsRecord[keyOrObject] = value;
        return;
      }

      Object.assign(configState, keyOrObject);
    }

    mockConfigStoreSet.mockImplementation(setImpl);
  };

  it('should save backupList and deviceUUID into savedConfigs during logout', () => {
    const configState = createConfigState({
      userData: fakeUser,
      backupList: fakeBackupList,
      deviceUUID: fakeDeviceUUID,
      deviceId: -1,
      backupsEnabled: true,
      backupInterval: 86_400_000,
      lastBackup: 1000,
      syncRoot: '/home/user/Internxt',
      lastSavedListing: '',
      lastSync: -1,
      lastOnboardingShown: '2025-01-01',
      nautilusExtensionVersion: 0,
      discoveredBackup: 1,
      shouldFixDanglingFiles: true,
      savedConfigs: {},
      bearerToken: 'fake-token',
      bearerTokenEncrypted: false,
      newToken: 'fake-new-token',
      newTokenEncrypted: false,
      mnemonic: 'fake-mnemonic',
    });

    mockStoreForState(configState);

    logout();

    const savedConfigs = configState.savedConfigs;
    expect(savedConfigs).toBeDefined();
    expect(savedConfigs[fakeUuid]).toBeDefined();

    expect(savedConfigs[fakeUuid].backupList).toStrictEqual(fakeBackupList);

    expect(savedConfigs[fakeUuid].deviceUUID).toBe(fakeDeviceUUID);

    for (const field of fieldsToSave) {
      expect(savedConfigs[fakeUuid]).toHaveProperty(field);
    }

    expect(configState.backupList).toStrictEqual(defaults.backupList);

    expect(configState.deviceUUID).toStrictEqual(defaults.deviceUUID);
  });

  it('should restore backupList and deviceUUID from savedConfigs on re-login', () => {
    const savedConfigs: AppStore['savedConfigs'] = {
      [fakeUuid]: {
        backupList: fakeBackupList,
        deviceUUID: fakeDeviceUUID,
        deviceId: -1,
        backupsEnabled: true,
        backupInterval: 86_400_000,
        lastBackup: 1000,
        syncRoot: '/home/user/Internxt',
        lastSavedListing: '',
        lastSync: -1,
        lastOnboardingShown: '2025-01-01',
        nautilusExtensionVersion: 0,
        discoveredBackup: 1,
        shouldFixDanglingFiles: true,
      },
    };

    const configState = createConfigState({
      savedConfigs,
      backupList: {},
      deviceUUID: '',
    });

    mockStoreForState(configState);

    const result = canHisConfigBeRestored(fakeUuid);

    expect(result).toBe(true);

    expect(configState.backupList).toStrictEqual(fakeBackupList);

    expect(configState.deviceUUID).toStrictEqual(fakeDeviceUUID);
  });

  it('should return false when no saved config exists for uuid', () => {
    const configState = createConfigState({
      savedConfigs: {},
    });

    mockConfigStoreGet.mockImplementation((key: string) => {
      const storeAsRecord = configState as unknown as Record<string, unknown>;
      return storeAsRecord[key];
    });

    const result = canHisConfigBeRestored('unknown-uuid');

    expect(result).toBe(false);
  });

  it('should preserve backupList through full logout -> re-login cycle', () => {
    const configState = createConfigState({
      userData: fakeUser,
      backupList: fakeBackupList,
      deviceUUID: fakeDeviceUUID,
      deviceId: -1,
      backupsEnabled: true,
      backupInterval: 86_400_000,
      lastBackup: 1000,
      syncRoot: '/home/user/Internxt',
      lastSavedListing: '',
      lastSync: -1,
      lastOnboardingShown: '2025-01-01',
      nautilusExtensionVersion: 0,
      discoveredBackup: 1,
      shouldFixDanglingFiles: true,
      savedConfigs: {},
      bearerToken: 'fake-token',
      bearerTokenEncrypted: false,
      newToken: 'fake-new-token',
      newTokenEncrypted: false,
      mnemonic: 'fake-mnemonic',
    });

    mockStoreForState(configState);

    logout();

    expect(configState.backupList).toStrictEqual({});
    expect(configState.deviceUUID).toStrictEqual('');

    const restored = canHisConfigBeRestored(fakeUuid);

    expect(restored).toBe(true);
    expect(configState.backupList).toStrictEqual(fakeBackupList);
    expect(configState.deviceUUID).toStrictEqual(fakeDeviceUUID);
    expect(configState.backupsEnabled).toBe(true);
  });
});
