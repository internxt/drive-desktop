import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { openDirController } from './opendir.controller';
import * as openDirServiceModule from '../../services/operations/opendir.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FILE_MODE, FOLDER_MODE } from '../../constants';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('openDirController', () => {
  const opendirMock = partialSpyOn(openDirServiceModule, 'opendir');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 with entries when directory is opened successfully', async () => {
    req.body = { path: '/some/folder' };
    opendirMock.mockResolvedValue({
      data: {
        entries: [
          { name: 'file.txt', mode: FILE_MODE },
          { name: 'subdir', mode: FOLDER_MODE },
        ],
      },
    });

    await openDirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({
      errno: 0,
      entries: [
        { name: 'file.txt', mode: FILE_MODE },
        { name: 'subdir', mode: FOLDER_MODE },
      ],
    });
  });

  it('should return errno EIO when directory read fails', async () => {
    req.body = { path: '/broken/folder' };
    opendirMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'IO error') });

    await openDirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });
});
