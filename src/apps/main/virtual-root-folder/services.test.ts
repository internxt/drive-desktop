import { MockInstance } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import configStore from '../config';
import { User } from '../types';
import { getRootVirtualDrive } from './service';
import { ROOT_FOLDER_NAME } from '@/core/utils/utils';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';

vi.mock('./service', async () => {
  const actual = await vi.importActual('./service');
  return {
    ...actual,
    setSyncRoot: vi.fn(),
  };
});

const tempDir = path.join(TEST_FILES, 'setup-root-folder');
let renameSpy: MockInstance<(oldPath: string, newPath: string) => void>;

beforeEach(() => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  fs.rm(tempDir, { recursive: true }, () => {
    return;
  });
});

describe('setupRootFolder', () => {
  it('should rename the folder if the current syncRoot matches pathNameWithSepInTheEnd', () => {
    const user = { email: 'test@gmail.com', uuid: '123' } as User;
    const virtualDriveFolder = path.join(tempDir, ROOT_FOLDER_NAME);
    const syncRoot = virtualDriveFolder + path.sep;

    if (!fs.existsSync(virtualDriveFolder)) {
      fs.mkdirSync(virtualDriveFolder);
    }

    configStore.get = vi.fn().mockReturnValue(syncRoot);

    setupRootFolder(user);

    expect(renameSpy).toHaveBeenCalledWith(syncRoot, `${virtualDriveFolder} - ${user.uuid}`);
    expect(configStore.get).toHaveBeenCalledWith('syncRoot');
  });

  it('should set a new syncRoot when the user changes the root', () => {
    const user: User = { email: 'test2@gmail.com', uuid: '456' } as User;
    const virtualDriveFolder = path.join(tempDir, 'virtual-drive');
    const syncRoot = `${virtualDriveFolder} - test@gmail.com`;

    if (!fs.existsSync(virtualDriveFolder)) {
      fs.mkdirSync(virtualDriveFolder);
    }

    configStore.get = vi.fn().mockReturnValue(syncRoot);

    setupRootFolder(user);

    expect(renameSpy).not.toHaveBeenCalled();
  });

  it('should not rename or setSyncRoot if syncRoot is undefined', () => {
    const user: User = { email: 'test4@gmail.com', uuid: '101' } as User;
    configStore.get = vi.fn().mockReturnValue(undefined);

    setupRootFolder(user);

    expect(renameSpy).not.toHaveBeenCalled();
  });
});

describe('getRootVirtualDrive', () => {
  it('should return the current syncRoot if it matches the user email', () => {
    const userEmail = 'test@gmail.com';
    vi.mock('@/apps/main/auth/service', () => {
      return {
        getUser: vi.fn(() => ({
          email: 'test@gmail.com',
          uuid: '123',
          id: 21,
        })),
      };
    });
    const syncRoot = `/test/path - ${userEmail}`;
    configStore.get = vi.fn().mockReturnValue(syncRoot);

    const result = getRootVirtualDrive();
    expect(result).toBe(syncRoot);
  });

  it('should call setupRootFolder and return a new syncRoot if the user email does not match', () => {
    const user: User = { email: 'test2@gmail.com', uuid: '456' } as User;
    vi.mock('@/apps/main/auth/service', () => {
      return {
        getUser: vi.fn(() => ({
          email: 'test2@gmail.com',
          uuid: '123',
          id: 21,
        })),
      };
    });
    const oldSyncRoot = '/test/path - test1@gmail.com';
    const newSyncRoot = `/test/path - ${user.uuid}`;
    configStore.get = vi.fn().mockReturnValueOnce(oldSyncRoot).mockReturnValueOnce(oldSyncRoot).mockReturnValueOnce(newSyncRoot);

    const result = getRootVirtualDrive();

    expect(result).toBe(newSyncRoot);
  });
});
