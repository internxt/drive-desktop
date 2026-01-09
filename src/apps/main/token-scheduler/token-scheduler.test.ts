import jwt from 'jsonwebtoken';
import ms, { StringValue } from 'ms';
import { TokenScheduler } from './TokenScheduler';
import { calls } from 'tests/vitest/utils.helper';

function createTokenExpiringIn(expiresIn: StringValue): string {
  const email = 'test@internxt.com';
  const milliseconds = ms(expiresIn);
  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn: milliseconds / 1000 });
}

function createExpiredToken(): string {
  const email = 'test@internxt.com';
  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn: -1 });
}

function getDateInFuture(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

describe('TokenScheduler', () => {
  let scheduler: TokenScheduler;
  const unauthorizedCallbackMock = vi.fn();
  const refreshCallback = vi.fn();

  const jwtWithoutExpiration =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InV1aWQiOiIzMjE2YzUzNi1kZDJjLTVhNjEtOGM3Ni0yMmU0ZDQ4ZjY4OWUiLCJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwibmFtZSI6InRlc3QiLCJsYXN0bmFtZSI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RAaW50ZXJueHQuY29tIiwic2hhcmVkV29ya3NwYWNlIjp0cnVlLCJuZXR3b3JrQ3JlZGVudGlhbHMiOnsidXNlciI6InRlc3RAaW50ZXJueHQuY29tIiwicGFzcyI6IiQyYSQwOCQ2QmhjZkRxaDE4c0kwN25kb2x0N29PNEtaTkpVQmpXSzYvZTRxMWppclR2SzdOTWE4dmZpLiJ9fSwiaWF0IjoxNjY3ODI4MDA2fQ.ckwjRsdNu9UUKUtdO3G32SwUUoMj7FAAOuBqVsIemo0';

  const invalidToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.am9hbnZpY2Vuc0Bwcm90b24ubWU.REeEpym9y3IoqMNjyuAGCnhWX7YHH9nA8DREqEqCU5Q';

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    scheduler?.cancelAll();
  });

  describe('schedule()', () => {
    describe('when tokens are valid', () => {
      it('executes the refresh callback when the scheduled time arrives', () => {
        vi.useFakeTimers();

        const token30Days = createTokenExpiringIn('30d');
        const daysBefore = 5;

        scheduler = new TokenScheduler(daysBefore, [token30Days], unauthorizedCallbackMock);
        scheduler.schedule(refreshCallback);

        calls(refreshCallback).toHaveLength(0);
        vi.advanceTimersByTime(24 * 24 * 60 * 60 * 1000);
        calls(refreshCallback).toHaveLength(0);
        vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000);
        calls(refreshCallback).toHaveLength(1);
      });

      it('executes the refresh callback immediately when renewal date is in the past', async () => {
        vi.useFakeTimers();

        const token2Days = createTokenExpiringIn('2d');
        const daysBefore = 5;

        scheduler = new TokenScheduler(daysBefore, [token2Days], unauthorizedCallbackMock);
        scheduler.schedule(refreshCallback);

        calls(refreshCallback).toHaveLength(0);
        vi.advanceTimersByTime(300);
        calls(refreshCallback).toHaveLength(1);
      });

      it('schedules refresh N days before the earliest expiration date', () => {
        const token30Days = createTokenExpiringIn('30d');
        const token31Days = createTokenExpiringIn('31d');
        const daysBefore = 5;

        scheduler = new TokenScheduler(daysBefore, [token30Days, token31Days], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());
        const nextInvocation = schedule?.nextInvocation();

        const expectedDate = getDateInFuture(30 - daysBefore);

        expect(schedule).toBeDefined();
        expect(nextInvocation?.getDate()).toBe(expectedDate.getDate());
      });

      it('executes callback based on the token that expires first when multiple tokens exist', () => {
        vi.useFakeTimers();

        const token10Days = createTokenExpiringIn('10d');
        const token20Days = createTokenExpiringIn('20d');
        const token30Days = createTokenExpiringIn('30d');
        const daysBefore = 3;

        scheduler = new TokenScheduler(daysBefore, [token30Days, token10Days, token20Days], unauthorizedCallbackMock);
        scheduler.schedule(refreshCallback);

        calls(refreshCallback).toHaveLength(0);
        vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);
        calls(refreshCallback).toHaveLength(1);
      });

      it('ignores tokens without expiration field and uses valid tokens', () => {
        const token30Days = createTokenExpiringIn('30d');
        const daysBefore = 5;

        scheduler = new TokenScheduler(daysBefore, [jwtWithoutExpiration, token30Days], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());

        expect(schedule).toBeDefined();
      });

      it('ignores invalid tokens and uses valid tokens', () => {
        const token30Days = createTokenExpiringIn('30d');
        const daysBefore = 5;

        scheduler = new TokenScheduler(daysBefore, [invalidToken, token30Days], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());

        expect(schedule).toBeDefined();
      });
    });

    describe('when tokens are expired or about to expire', () => {
      it('calls unauthorized callback and does not schedule when token is already expired', () => {
        const expiredToken = createExpiredToken();

        scheduler = new TokenScheduler(5, [expiredToken], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());

        expect(schedule).toBeUndefined();
        calls(unauthorizedCallbackMock).toHaveLength(1);
      });

      it('schedules for 300ms from now when renewal date would be in the past (bug: should be 5 minutes)', () => {
        const token2Days = createTokenExpiringIn('2d');
        const daysBefore = 5;

        const beforeSchedule = Date.now();

        scheduler = new TokenScheduler(daysBefore, [token2Days], unauthorizedCallbackMock);
        const schedule = scheduler.schedule(vi.fn());

        const afterSchedule = Date.now();

        const nextInvocation = schedule?.nextInvocation();
        const invocationTime = nextInvocation?.getTime() || 0;

        const expectedMinTime = beforeSchedule;
        const expectedMaxTime = afterSchedule + 1000;

        expect(schedule).toBeDefined();
        expect(invocationTime).toBeGreaterThanOrEqual(expectedMinTime);
        expect(invocationTime).toBeLessThanOrEqual(expectedMaxTime);
      });
    });

    describe('when no valid tokens exist', () => {
      it('does not schedule when all tokens are invalid', () => {
        scheduler = new TokenScheduler(5, [invalidToken, invalidToken], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());

        expect(schedule).toBeUndefined();
        calls(unauthorizedCallbackMock).toHaveLength(0);
      });

      it('does not schedule when all tokens have no expiration', () => {
        scheduler = new TokenScheduler(5, [jwtWithoutExpiration], unauthorizedCallbackMock);

        const schedule = scheduler.schedule(vi.fn());

        expect(schedule).toBeUndefined();
        calls(unauthorizedCallbackMock).toHaveLength(0);
      });
    });
  });

  describe('cancelAll()', () => {
    it('cancels all scheduled jobs', () => {
      const token30Days = createTokenExpiringIn('30d');
      const refreshCallback = vi.fn();

      scheduler = new TokenScheduler(5, [token30Days], unauthorizedCallbackMock);

      const schedule1 = scheduler.schedule(refreshCallback);
      const schedule2 = scheduler.schedule(refreshCallback);

      expect(schedule1).toBeDefined();
      expect(schedule2).toBeDefined();

      scheduler.cancelAll();

      expect(schedule1?.nextInvocation()).toBeNull();
      expect(schedule2?.nextInvocation()).toBeNull();
    });
  });
});
