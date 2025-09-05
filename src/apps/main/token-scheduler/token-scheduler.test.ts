import jwt from 'jsonwebtoken';
import ms, { StringValue } from 'ms';

import { TokenScheduler } from './TokenScheduler';

function calculateDayFromToday(t: StringValue): Date {
  const today = new Date();

  return new Date(today.getTime() + ms(t));
}

function createToken(expiresIn: StringValue) {
  const email = 'test@inxternxt.com';

  return jwt.sign({ email }, 'JWT_SECRET', { expiresIn });
}

describe('Token Scheduler', () => {
  let scheduler: TokenScheduler;

  const jwtExpiresInThirtyOneDays = createToken('31 day');

  const jwtWithoutExpiration =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InV1aWQiOiIzMjE2YzUzNi1kZDJjLTVhNjEtOGM3Ni0yMmU0ZDQ4ZjY4OWUiLCJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwibmFtZSI6InRlc3QiLCJsYXN0bmFtZSI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RAaW50ZXJueHQuY29tIiwic2hhcmVkV29ya3NwYWNlIjp0cnVlLCJuZXR3b3JrQ3JlZGVudGlhbHMiOnsidXNlciI6InRlc3RAaW50ZXJueHQuY29tIiwicGFzcyI6IiQyYSQwOCQ2QmhjZkRxaDE4c0kwN25kb2x0N29PNEtaTkpVQmpXSzYvZTRxMWppclR2SzdOTWE4dmZpLiJ9fSwiaWF0IjoxNjY3ODI4MDA2fQ.ckwjRsdNu9UUKUtdO3G32SwUUoMj7FAAOuBqVsIemo0';

  const invalidToken = 'invalid';

  const task = () => {
    // no op
  };

  afterEach(() => {
    scheduler.cancelAll();
  });

  it('should schedule if the token is valid', () => {
    scheduler = new TokenScheduler(jwtExpiresInThirtyOneDays);

    const expectedExpireDay = calculateDayFromToday('26 days');

    const schedule = scheduler.schedule(task);

    const nextInvocation = schedule?.nextInvocation();

    expect(schedule).toBeDefined();
    expect(nextInvocation?.getDay()).toBe(expectedExpireDay.getDay());
  });

  it('should not schedule if the token expires', () => {
    scheduler = new TokenScheduler(jwtWithoutExpiration);

    const schedule = scheduler.schedule(task);

    expect(schedule).not.toBeDefined();
  });

  it('should not schedule if the token is invalid', () => {
    scheduler = new TokenScheduler(invalidToken);

    const schedule = scheduler.schedule(task);

    expect(schedule).not.toBeDefined();
  });
});
