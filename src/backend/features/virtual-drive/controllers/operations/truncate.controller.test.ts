import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { truncateController } from './truncate.controller';
import * as truncateServiceModule from '../../services/operations/truncate.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('truncateController', () => {
  const truncateMock = partialSpyOn(truncateServiceModule, 'truncate');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno EINVAL when payload is invalid', async () => {
    req.body = { path: '/some/file.txt', size: -1 };

    await truncateController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EINVAL });
    expect(truncateMock).not.toHaveBeenCalled();
  });

  it('should return errno 0 when truncate succeeds', async () => {
    req.body = { path: '/some/file.txt', size: 0 };
    truncateMock.mockResolvedValue({ data: undefined });

    await truncateController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: 0 });
  });

  it('should return errno EIO when truncate fails', async () => {
    req.body = { path: '/some/file.txt', size: 0 };
    truncateMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await truncateController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EIO });
  });
});
