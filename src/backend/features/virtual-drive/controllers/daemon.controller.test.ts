import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { daemonReadyController } from './daemon.controller';
import * as daemonServiceModule from '../services/daemon.service';
import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';

describe('daemonReadyController', () => {
  const resolveDaemonReadyMock = partialSpyOn(daemonServiceModule, 'resolveDaemonReady');

  it('should resolve the daemon ready signal and return 200', () => {
    const req = mockDeep<Request>();
    req.body = { bootId: 'boot-id-1' };
    const res = mockDeep<Response>();

    daemonReadyController(req, res);

    expect(resolveDaemonReadyMock).toHaveBeenCalledWith({ bootId: 'boot-id-1' });
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });
});
