import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { renameController } from './rename.controller';
import * as renameServiceModule from '../../services/operations/rename.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';

describe('renameController', () => {
  const renameMock = partialSpyOn(renameServiceModule, 'rename');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno EINVAL when newPath is missing', async () => {
    req.body = { oldPath: '/a/path' };

    await renameController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EINVAL });
    expect(renameMock).not.toBeCalled();
  });

  it('should return errno EINVAL when oldPath is missing', async () => {
    req.body = { newPath: '/a/path' };

    await renameController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EINVAL });
    expect(renameMock).not.toBeCalled();
  });

  it('should return errno 0 when rename succeeds', async () => {
    req.body = { oldPath: '/old/path', newPath: '/new/path' };
    renameMock.mockResolvedValue({ data: undefined });

    await renameController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: 0 });
  });

  it('should return errno from service when rename fails', async () => {
    req.body = { oldPath: '/old/path', newPath: '/new/path' };
    renameMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'rename error') });

    await renameController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EIO });
  });
});
