import { Container } from 'diod';
import { NextFunction, Request, Response } from 'express';
import { mockDeep } from 'vitest-mock-extended';
import { call } from 'tests/vitest/utils.helper';
import { buildContentsController } from './contents';
import { StorageFileDeleter } from '../../../../context/storage/StorageFiles/application/delete/StorageFileDeleter';
import { AllFilesInFolderAreAvailableOffline } from '../../../../context/storage/StorageFolders/application/offline/AllFilesInFolderAreAvailableOffline';
import { MakeStorageFileAvaliableOffline } from '../../../../context/storage/StorageFiles/application/offline/MakeStorageFileAvaliableOffline';
import { StorageFileIsAvailableOffline } from '../../../../context/storage/StorageFiles/application/offline/StorageFileIsAvailableOffline';
import { MakeFolderAvaliableOffline } from '../../../../context/storage/StorageFolders/application/offline/MakeFolderAvaliableOffline';
import { StorageFolderDeleter } from '../../../../context/storage/StorageFolders/application/delete/StorageFolderDeleter';
import * as generateLinkModule from '../../../../backend/features/nautilus-extension/create-sharing-link/generate-link';

describe('contents', () => {
  const generateLinkMock = vi.spyOn(generateLinkModule, 'generateLink');

  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let next: NextFunction;

  const storageFileIsAvailableRun = vi.fn();
  const allFilesInFolderAreAvailableRun = vi.fn();
  const storageFileDeleterRun = vi.fn();
  const makeStorageFileAvaliableOfflineRun = vi.fn();
  const makeFolderAvaliableOfflineRun = vi.fn();
  const storageFolderDeleterRun = vi.fn();

  function createContainer() {
    const services = new Map<unknown, { run: (...args: unknown[]) => unknown }>([
      [StorageFileIsAvailableOffline, { run: storageFileIsAvailableRun }],
      [AllFilesInFolderAreAvailableOffline, { run: allFilesInFolderAreAvailableRun }],
      [StorageFileDeleter, { run: storageFileDeleterRun }],
      [MakeStorageFileAvaliableOffline, { run: makeStorageFileAvaliableOfflineRun }],
      [MakeFolderAvaliableOffline, { run: makeFolderAvaliableOfflineRun }],
      [StorageFolderDeleter, { run: storageFolderDeleterRun }],
    ]);

    return {
      get: vi.fn((token: unknown) => {
        const service = services.get(token);

        if (!service) throw new Error('Service not mocked');

        return service;
      }),
    } as unknown as Container;
  }

  function encodePath(path: string) {
    return Buffer.from(path, 'utf-8').toString('base64');
  }

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    next = vi.fn((error?: unknown) => error) as unknown as NextFunction;

    req.params = { path: encodePath('/folder/file.txt') };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    storageFileIsAvailableRun.mockResolvedValue(false);
    allFilesInFolderAreAvailableRun.mockResolvedValue(false);
    storageFileDeleterRun.mockResolvedValue(undefined);
    makeStorageFileAvaliableOfflineRun.mockResolvedValue(undefined);
    makeFolderAvaliableOfflineRun.mockResolvedValue(undefined);
    storageFolderDeleterRun.mockResolvedValue(undefined);
    generateLinkMock.mockResolvedValue({ data: 'https://link.test' });
  });

  it('should return generated link in copyLink', async () => {
    req.params.path = encodePath('/folder/my%20file.txt');

    const controller = buildContentsController(createContainer());

    await controller.copyLink(req, res, next);

    call(generateLinkMock).toStrictEqual({ path: '/folder/my file.txt' });
    call(res.status).toBe(202);
    call(res.json).toStrictEqual({ path: '/folder/my file.txt', link: 'https://link.test' });
  });

  it('should call next when copyLink fails', async () => {
    const error = new Error('copy failed');
    generateLinkMock.mockRejectedValue(error);

    const controller = buildContentsController(createContainer());

    await controller.copyLink(req, res, next);

    call(next).toBe(error);
  });

  it('should return 500 when copyLink returns an error result', async () => {
    generateLinkMock.mockResolvedValue({ error: new Error('copy failed') });

    const controller = buildContentsController(createContainer());

    await controller.copyLink(req, res, next);

    call(res.status).toBe(500);
    call(res.json).toStrictEqual({ error: 'Error generating sharing link' });
  });

  it('should resolve file availability in get', async () => {
    storageFileIsAvailableRun.mockResolvedValue(true);

    const controller = buildContentsController(createContainer());

    await controller.get(req, res);

    call(res.json).toStrictEqual({ locallyAvaliable: true });
  });

  it('should fallback to folder availability in get when file lookup fails', async () => {
    storageFileIsAvailableRun.mockRejectedValue(new Error('not a file'));
    allFilesInFolderAreAvailableRun.mockResolvedValue(true);

    const controller = buildContentsController(createContainer());

    await controller.get(req, res);

    call(res.json).toStrictEqual({ locallyAvaliable: true });
  });

  it('should return false in getFile when file lookup fails', async () => {
    storageFileIsAvailableRun.mockRejectedValue(new Error('not found'));

    const controller = buildContentsController(createContainer());

    await controller.getFile(req, res);

    call(res.json).toStrictEqual({ locallyAvaliable: false });
  });

  it('should return false in getFolder when folder lookup fails', async () => {
    allFilesInFolderAreAvailableRun.mockRejectedValue(new Error('not found'));

    const controller = buildContentsController(createContainer());

    await controller.getFolder(req, res);

    call(res.json).toStrictEqual({ locallyAvaliable: false });
  });

  it('should remove file and return 201', async () => {
    req.params.path = encodePath('/folder/to-delete.txt');

    const controller = buildContentsController(createContainer());

    await controller.removeFile(req, res);

    call(storageFileDeleterRun).toBe('/folder/to-delete.txt');
    call(res.status).toBe(201);
    expect(res.send).toHaveBeenCalled();
  });

  it('should download file and return 202', async () => {
    req.params.path = encodePath('/folder/to-download.txt');

    const controller = buildContentsController(createContainer());

    await controller.downloadFile(req, res, next);

    call(makeStorageFileAvaliableOfflineRun).toBe('/folder/to-download.txt');
    call(res.status).toBe(202);
    expect(res.send).toHaveBeenCalled();
  });

  it('should call next when downloadFile fails', async () => {
    const error = new Error('download file failed');

    const container = {
      get: vi.fn(() => {
        throw error;
      }),
    } as unknown as Container;

    const controller = buildContentsController(container);

    await controller.downloadFile(req, res, next);

    call(next).toBe(error);
  });

  it('should remove folder and return 201', async () => {
    req.params.path = encodePath('/folder/to-delete');

    const controller = buildContentsController(createContainer());

    await controller.removeFolder(req, res);

    call(storageFolderDeleterRun).toBe('/folder/to-delete');
    call(res.status).toBe(201);
    expect(res.send).toHaveBeenCalled();
  });

  it('should download folder and return 202', async () => {
    req.params.path = encodePath('/folder/to-download');

    const controller = buildContentsController(createContainer());

    await controller.downloadFolder(req, res, next);

    call(makeFolderAvaliableOfflineRun).toBe('/folder/to-download');
    call(res.status).toBe(202);
    expect(res.send).toHaveBeenCalled();
  });

  it('should call next when downloadFolder fails', async () => {
    const error = new Error('download folder failed');

    const container = {
      get: vi.fn(() => {
        throw error;
      }),
    } as unknown as Container;

    const controller = buildContentsController(container);

    await controller.downloadFolder(req, res, next);

    call(next).toBe(error);
  });
});
