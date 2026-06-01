import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { getAttributesController } from './get-attributes.controller';
import * as getAttributesServiceModule from '../../services/operations/get-attributes.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FILE_MODE } from '../../constants';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

vi.mock('@internxt/drive-desktop-core/build/backend');
vi.mock('../../services/operations/get-attributes.service');

describe('getAttributesController', () => {
  const getAttributesMock = partialSpyOn(getAttributesServiceModule, 'getAttributes');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno ENOENT when getAttributes returns a not found error', async () => {
    req.body = { path: '/missing.txt' };
    getAttributesMock.mockResolvedValue({
      error: new FuseError(FuseCodes.ENOENT, 'File not found'),
    });

    await getAttributesController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.ENOENT });
  });

  it('should return errno 0 with attributes when file is found', async () => {
    const now = new Date();
    req.body = { path: '/some/file.txt' };
    getAttributesMock.mockResolvedValue({
      data: {
        mode: FILE_MODE,
        size: 1234,
        mtime: now,
        ctime: now,
        uid: 1000,
        gid: 1000,
        nlink: 1,
      },
    });

    await getAttributesController(req, res, container);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errno: 0,
        mode: FILE_MODE,
        size: 1234,
      }),
    );
  });
});
