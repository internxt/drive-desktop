import * as fsPromises from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as serviceModule from './service';
import { calls, deepMocked } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';

vi.mock(import('node:fs/promises'));
vi.mock('node:fs', () => ({ existsSync: vi.fn() }));
vi.mock('node:os', () => ({ homedir: vi.fn().mockReturnValue('/home/user') }));
vi.mock('../../../../package.json', () => ({ default: { name: 'internxt', version: '1.0.0' } }));

const desktopFilePath = '/home/user/.config/autostart';
const desktopFile = `${desktopFilePath}/internxt.desktop`;

describe('auto-launch service', () => {
  let mkdirMock: ReturnType<typeof deepMocked<typeof fsPromises.mkdir>>;
  let writeFileMock: ReturnType<typeof deepMocked<typeof fsPromises.writeFile>>;
  let existsSyncMock: ReturnType<typeof deepMocked<typeof fsSync.existsSync>>;
  let unlinkMock: ReturnType<typeof deepMocked<typeof fsPromises.unlink>>;

  beforeEach(() => {
    mkdirMock = deepMocked(fsPromises.mkdir);
    writeFileMock = deepMocked(fsPromises.writeFile);
    existsSyncMock = deepMocked(fsSync.existsSync);
    unlinkMock = deepMocked(fsPromises.unlink);
  });

  describe('createDesktopEntry', () => {
    it('should create the desktop entry', async () => {
      mkdirMock.mockResolvedValue(undefined);
      writeFileMock.mockResolvedValue(undefined);

      await serviceModule.createDesktopEntry();

      calls(mkdirMock).toContainEqual([desktopFilePath, { recursive: true }]);
      expect(writeFileMock).toBeCalled();
      expect(loggerMock.error).not.toBeCalled();
    });

    it('should log error if createDesktopEntry fails', async () => {
      mkdirMock.mockRejectedValue(new Error('fail'));
      await serviceModule.createDesktopEntry();
      expect(loggerMock.error).toBeCalled();
    });
  });

  describe('deleteDesktopEntry', () => {
    it('should delete the desktop entry if it exists', async () => {
      existsSyncMock.mockReturnValue(true);
      unlinkMock.mockResolvedValue(undefined);
      await serviceModule.deleteDesktopEntry();
      calls(unlinkMock).toContainEqual(desktopFile);
      expect(loggerMock.error).not.toBeCalled();
    });

    it('should not try to delete if desktop entry does not exist', async () => {
      existsSyncMock.mockReturnValue(false);
      await serviceModule.deleteDesktopEntry();
      expect(unlinkMock).not.toBeCalled();
    });

    it('should log error if deleteDesktopEntry fails', async () => {
      existsSyncMock.mockReturnValue(true);
      unlinkMock.mockRejectedValue(new Error('fail'));
      await serviceModule.deleteDesktopEntry();
      expect(loggerMock.error).toBeCalled();
    });
  });

  describe('desktopEntryIsPresent', () => {
    it('should return true if desktop entry exists', () => {
      existsSyncMock.mockReturnValue(true);
      expect(serviceModule.desktopEntryIsPresent()).toBe(true);
    });

    it('should return false if desktop entry does not exist', () => {
      existsSyncMock.mockReturnValue(false);
      expect(serviceModule.desktopEntryIsPresent()).toBe(false);
    });
  });

  describe('toggleDesktopEntry', () => {
    it('should call unlink when entry exists', async () => {
      existsSyncMock.mockReturnValue(true);
      unlinkMock.mockResolvedValue(undefined);
      await serviceModule.toggleDesktopEntry();
      expect(unlinkMock).toBeCalled();
    });

    it('should create entry when it does not exist', async () => {
      existsSyncMock.mockReturnValue(false);
      mkdirMock.mockResolvedValue(undefined);
      writeFileMock.mockResolvedValue(undefined);
      await serviceModule.toggleDesktopEntry();
      expect(mkdirMock).toBeCalled();
      expect(writeFileMock).toBeCalled();
    });
  });
});
