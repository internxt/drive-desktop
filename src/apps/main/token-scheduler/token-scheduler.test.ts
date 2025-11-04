import jwt from 'jsonwebtoken';
import ms from 'ms';

import { TokenScheduler } from './TokenScheduler';

function calculateDayFromToday(t: string): Date {
  const today = new Date();

  return new Date(today.getTime() + ms(t));
}

const dataSet = [
  { daysBefore: 5, day: calculateDayFromToday('25 days') },
  { daysBefore: 1, day: calculateDayFromToday('29 day') },
  { daysBefore: 10, day: calculateDayFromToday('20 days') },
];

function createToken(expiresIn: string) {
  const email = 'test@inxternxt.com';

  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn });
}

describe('Token Scheduler', () => {
  let scheduler: TokenScheduler;

  const jwtExpiresInThirtyDays = createToken('30 days');

  const jwtExpiresInThirtyOneDays = createToken('31 day');

  const jwtWithoutExpiration =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InV1aWQiOiIzMjE2YzUzNi1kZDJjLTVhNjEtOGM3Ni0yMmU0ZDQ4ZjY4OWUiLCJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwibmFtZSI6InRlc3QiLCJsYXN0bmFtZSI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RAaW50ZXJueHQuY29tIiwic2hhcmVkV29ya3NwYWNlIjp0cnVlLCJuZXR3b3JrQ3JlZGVudGlhbHMiOnsidXNlciI6InRlc3RAaW50ZXJueHQuY29tIiwicGFzcyI6IiQyYSQwOCQ2QmhjZkRxaDE4c0kwN25kb2x0N29PNEtaTkpVQmpXSzYvZTRxMWppclR2SzdOTWE4dmZpLiJ9fSwiaWF0IjoxNjY3ODI4MDA2fQ.ckwjRsdNu9UUKUtdO3G32SwUUoMj7FAAOuBqVsIemo0';

  const invalidToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.am9hbnZpY2Vuc0Bwcm90b24ubWU.REeEpym9y3IoqMNjyuAGCnhWX7YHH9nA8DREqEqCU5Q';

  const task = () => {
    // no op
  };

  afterEach(() => {
    scheduler.cancelAll();
  });

  it.each(dataSet)('schedules the token refresh n days before fist token expiration', (data) => {
    scheduler = new TokenScheduler(data.daysBefore, [jwtExpiresInThirtyDays, jwtExpiresInThirtyOneDays], () => {
      // no op
    });

    const schedule = scheduler.schedule(task);

    const nextInvocation = schedule?.nextInvocation();

    expect(nextInvocation?.getDate()).toBe(data.day.getDate());
  });

  it('shcedules to refresh even if a token does not expire', () => {
    scheduler = new TokenScheduler(4, [jwtWithoutExpiration, jwtExpiresInThirtyDays, jwtExpiresInThirtyOneDays], () => {
      // no op
    });

    const expectedExpireDay = calculateDayFromToday('26 days');

    const schedule = scheduler.schedule(task);

    const nextInvocation = schedule?.nextInvocation();

    expect(schedule).toBeDefined();
    expect(nextInvocation?.getDay()).toBe(expectedExpireDay.getDay());
  });

  it('schedules to refresh even if a token is not valid', () => {
    scheduler = new TokenScheduler(4, [invalidToken, jwtExpiresInThirtyDays, jwtExpiresInThirtyOneDays], () => {
      // no op
    });

    const schedule = scheduler.schedule(task);

    expect(schedule).toBeDefined();
  });

  it('shedules to refresh even if a token is not valid or does not expire', () => {
    scheduler = new TokenScheduler(
      7,
      [jwtWithoutExpiration, jwtExpiresInThirtyDays, invalidToken, jwtExpiresInThirtyOneDays],
      () => {
        // no op
      },
    );

    const schedule = scheduler.schedule(task);

    expect(schedule).toBeDefined();
  });

  it('does not schedule if any token expires', () => {
    scheduler = new TokenScheduler(7, [jwtWithoutExpiration], () => {
      // no op
    });

    const schedule = scheduler.schedule(task);

    expect(schedule).not.toBeDefined();
  });

  it('does not schedules if any token is valid', () => {
    scheduler = new TokenScheduler(7, [invalidToken], () => {
      // no op
    });

    const schedule = scheduler.schedule(task);

    expect(schedule).not.toBeDefined();
  });
});
