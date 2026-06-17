const { mkdirMock, linkMock, cpMock, rmMock, execMock } = vi.hoisted(() => ({
  mkdirMock: vi.fn(),
  linkMock: vi.fn(),
  cpMock: vi.fn(),
  rmMock: vi.fn(),
  execMock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: mkdirMock,
    link: linkMock,
    cp: cpMock,
    rm: rmMock,
  },
}));

vi.mock('node:child_process', () => ({
  exec: execMock,
}));

import os from 'node:os';
import * as fileExistsModule from '../../../apps/shared/fs/fileExists';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';
import { copyNautilusExtensionFile, deleteNautilusExtensionFile, isInstalled, reloadNautilus } from './service';
import { loggerMock } from '../../../../tests/vitest/mocks.helper';

describe('service', () => {
  const doesFileExistMock = partialSpyOn(fileExistsModule, 'doesFileExist');

  const destination = `${os.homedir()}/.local/share/nautilus-python/extensions/internxt-virtual-drive.py`;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    Object.defineProperty(process, 'resourcesPath', {
      value: '/tmp/internxt-resources',
      configurable: true,
    });
  });

  it('should return installation state from file existence check', async () => {
    // Given
    doesFileExistMock.mockResolvedValueOnce(true);

    // When
    const result = await isInstalled();

    // Then
    expect(result).toBe(true);
    call(doesFileExistMock).toBe(destination);
  });

  it('should skip copy when extension file already exists', async () => {
    // Given
    doesFileExistMock.mockResolvedValueOnce(true);

    // When
    await copyNautilusExtensionFile();

    // Then
    call(doesFileExistMock).toBe(destination);
    calls(mkdirMock).toHaveLength(0);
    calls(linkMock).toHaveLength(0);
    calls(cpMock).toHaveLength(0);
  });

  it('should link extension file in development mode', async () => {
    // Given
    process.env.NODE_ENV = 'development';
    doesFileExistMock.mockResolvedValueOnce(false);

    // When
    await copyNautilusExtensionFile();

    // Then
    call(mkdirMock).toStrictEqual([`${os.homedir()}/.local/share/nautilus-python/extensions`, { recursive: true }]);

    const linkArgs = calls(linkMock);
    linkArgs.toHaveLength(1);
    linkArgs.toMatchObject([
      [expect.stringContaining('assets/python-nautilus/internxt-virtual-drive.py'), destination],
    ]);
    calls(cpMock).toHaveLength(0);
  });

  it('should copy extension file in production mode and log debug', async () => {
    // Given
    process.env.NODE_ENV = 'production';
    doesFileExistMock.mockResolvedValueOnce(false);

    // When
    await copyNautilusExtensionFile();

    // Then
    call(cpMock).toStrictEqual([
      '/tmp/internxt-resources/assets/python-nautilus/internxt-virtual-drive.py',
      destination,
    ]);
    calls(linkMock).toHaveLength(0);
    call(loggerMock.debug).toMatchObject({
      msg: 'Added extension file to ',
      destination,
    });
  });

  it('should skip delete when extension file does not exist', async () => {
    // Given
    doesFileExistMock.mockResolvedValueOnce(false);

    // When
    await deleteNautilusExtensionFile();

    // Then
    call(doesFileExistMock).toBe(destination);
    calls(rmMock).toHaveLength(0);
  });

  it('should delete extension file and log debug when extension exists', async () => {
    // Given
    doesFileExistMock.mockResolvedValueOnce(true);

    // When
    await deleteNautilusExtensionFile();

    // Then
    call(rmMock).toBe(destination);
    call(loggerMock.debug).toMatchObject({
      msg: 'Deleted extension file from ',
      destination,
    });
  });

  it('should resolve reload when nautilus returns status 255', async () => {
    // Given
    execMock.mockImplementationOnce((_command: string, callback: (...args: unknown[]) => void) => {
      const error = new Error('nautilus quit') as Error & { code?: number };
      error.code = 255;
      callback(error, '', '');
    });

    // When / Then
    await expect(reloadNautilus()).resolves.toBeUndefined();
    call(execMock).toMatchObject(['nautilus -q', expect.any(Function)]);
  });

  it('should reject reload when command returns an unexpected error', async () => {
    // Given
    execMock.mockImplementationOnce((_command: string, callback: (...args: unknown[]) => void) => {
      const error = new Error('boom') as Error & { code?: number };
      error.code = 1;
      callback(error, '', '');
    });

    // When / Then
    await expect(reloadNautilus()).rejects.toThrow('boom');
  });

  it('should reject reload when stderr is present', async () => {
    // Given
    execMock.mockImplementationOnce((_command: string, callback: (...args: unknown[]) => void) => {
      callback(null, '', 'stderr output');
    });

    // When / Then
    await expect(reloadNautilus()).rejects.toThrow('stderr output');
  });
});
