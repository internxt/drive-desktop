import { createTokenScheduleWithRetry } from './create-token-schedule-with-retry';
import * as authServiceModule from '../service';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import { TokenScheduler } from '../../token-scheduler/TokenScheduler';
import { Job } from 'node-schedule';

describe('createTokenScheduleWithRetry', () => {
  const obtainTokensMock = partialSpyOn(authServiceModule, 'obtainTokens');
  const scheduleMock = partialSpyOn(TokenScheduler.prototype, 'schedule');

  const jobMock: Partial<Job> = {
    cancel: vi.fn(),
  };
  const validTokens = ['token-1', 'token-2'];

  beforeEach(() => {
    scheduleMock.mockReturnValue(jobMock as Job);
  });

  it('should create token schedule with provided refreshedTokens parameter', async () => {
    await createTokenScheduleWithRetry({ refreshedTokens: validTokens });

    calls(scheduleMock).toHaveLength(1);
    calls(obtainTokensMock).toHaveLength(0);
  });

  it('should create token schedule using obtainStoredTokens when no parameter provided', async () => {
    obtainTokensMock.mockReturnValue(validTokens);

    await createTokenScheduleWithRetry();

    calls(obtainTokensMock).toHaveLength(1);
    calls(scheduleMock).toHaveLength(1);
  });

  it('should attempt to schedule only once when schedule() succeeds immediately', async () => {
    scheduleMock.mockReturnValue(jobMock);

    await createTokenScheduleWithRetry({ refreshedTokens: validTokens });

    calls(scheduleMock).toHaveLength(1);
    calls(loggerMock.debug).toHaveLength(0);
  });

  it('should retry when schedule() fails and succeed on second attempt', async () => {
    scheduleMock.mockReturnValueOnce(undefined).mockReturnValueOnce(jobMock);

    await createTokenScheduleWithRetry({ refreshedTokens: validTokens });

    calls(scheduleMock).toHaveLength(2);
    calls(loggerMock.debug).toHaveLength(1);
    call(loggerMock.debug).toMatchObject({
      msg: '[TOKEN] Failed to create token schedule, retrying...',
      tag: 'AUTH',
    });
  });
});
