import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { getSyncContextFromPath } from './get-sync-context-from-path';

vi.mock(import('@/apps/main/remote-sync/store'));

describe('getSyncContextFromPath', () => {
  const getSyncContextsMock = vi.mocked(getSyncContexts);

  function createContext(rootPath: string, workspaceId: string) {
    return { rootPath, workspaceId } as SyncContext;
  }

  it('should return the personal sync context that contains the selected path', () => {
    const personal = createContext(String.raw`C:\Users\abc\InternxtDrive`, '');
    const business = createContext(String.raw`C:\Users\abc\InternxtDrive - workspace`, 'workspace');
    getSyncContextsMock.mockReturnValue([personal, business]);

    expect(getSyncContextFromPath(String.raw`C:\Users\abc\InternxtDrive\file.txt`)).toBe(personal);
  });

  it('should return the business sync context that contains the selected path', () => {
    const personal = createContext(String.raw`C:\Users\abc\InternxtDrive`, '');
    const business = createContext(String.raw`C:\Users\abc\InternxtDrive - workspace`, 'workspace');
    getSyncContextsMock.mockReturnValue([personal, business]);

    expect(getSyncContextFromPath(String.raw`C:\Users\abc\InternxtDrive - workspace\folder`)).toBe(business);
  });

  it('should compare Windows paths case-insensitively', () => {
    const context = createContext(String.raw`C:\Users\Abc\InternxtDrive`, '');
    getSyncContextsMock.mockReturnValue([context]);

    expect(getSyncContextFromPath(String.raw`c:\users\abc\internxtdrive\File.txt`)).toBe(context);
  });

  it('should return null for the sync root itself', () => {
    const context = createContext(String.raw`C:\Users\abc\InternxtDrive`, '');
    getSyncContextsMock.mockReturnValue([context]);

    expect(getSyncContextFromPath(String.raw`C:\Users\abc\InternxtDrive`)).toBeNull();
  });

  it('should return null when no sync context contains the selected path', () => {
    const context = createContext(String.raw`C:\Users\abc\InternxtDrive`, '');
    getSyncContextsMock.mockReturnValue([context]);

    expect(getSyncContextFromPath(String.raw`C:\Users\abc\Documents\file.txt`)).toBeNull();
  });

  it('should return null when there are no active sync contexts', () => {
    getSyncContextsMock.mockReturnValue([]);

    expect(getSyncContextFromPath(String.raw`C:\Users\abc\InternxtDrive\file.txt`)).toBeNull();
  });
});
