import { TokenScheduler } from './TokenScheduler';

const dataSet = [
  { daysBefore: 5, day: new Date('2022/11/16') },
  { daysBefore: 1, day: new Date('2022/11/20') },
  { daysBefore: 10, day: new Date('2022/11/11') },
];

describe('Token Scheduler', () => {
  const jwtExpiresTwentyFisrtOfNovember =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwiaWF0IjoxNjY3ODI4MDA2LCJleHAiOjE2NjkwMzc2MDZ9.ErGSmQJ8wMAgInTE-NEErCdBXcbM796jQoWCv2jtwrM';

  const jwtExpiresTwentyNinthOfNovember =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwiaWF0IjoxNjY3ODI4MDA2LCJleHAiOjE2Njk3Mzc2MDZ9.63E7k3ykucHni24UNRapZ8taniiDPDiWyAwabsiK87c';

  const jwtWithoutExpiration =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InV1aWQiOiIzMjE2YzUzNi1kZDJjLTVhNjEtOGM3Ni0yMmU0ZDQ4ZjY4OWUiLCJlbWFpbCI6InRlc3RAaW50ZXJueHQuY29tIiwibmFtZSI6InRlc3QiLCJsYXN0bmFtZSI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RAaW50ZXJueHQuY29tIiwic2hhcmVkV29ya3NwYWNlIjp0cnVlLCJuZXR3b3JrQ3JlZGVudGlhbHMiOnsidXNlciI6InRlc3RAaW50ZXJueHQuY29tIiwicGFzcyI6IiQyYSQwOCQ2QmhjZkRxaDE4c0kwN25kb2x0N29PNEtaTkpVQmpXSzYvZTRxMWppclR2SzdOTWE4dmZpLiJ9fSwiaWF0IjoxNjY3ODI4MDA2fQ.ckwjRsdNu9UUKUtdO3G32SwUUoMj7FAAOuBqVsIemo0';

  const invalidToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.am9hbnZpY2Vuc0Bwcm90b24ubWU.REeEpym9y3IoqMNjyuAGCnhWX7YHH9nA8DREqEqCU5Q';

  const taks = () => {};

  it.each(dataSet)(
    'schedules the token refresh n days before fist token expiration',
    (data) => {
      const scheduler = new TokenScheduler(data.daysBefore, [
        jwtExpiresTwentyNinthOfNovember,
        jwtExpiresTwentyFisrtOfNovember,
      ]);

      const schedule = scheduler.schedule(taks);

      const nextInvocation = schedule?.nextInvocation();

      expect(nextInvocation?.getDay()).toBe(data.day.getDay());
    }
  );

  it('shcedules to refresh even if a token does not expire', () => {
    const scheduler = new TokenScheduler(4, [
      jwtWithoutExpiration,
      jwtExpiresTwentyNinthOfNovember,
    ]);

    const expectedExpireDay = new Date('2022/11/25');

    const schedule = scheduler.schedule(taks);

    const nextInvocation = schedule?.nextInvocation();

    expect(schedule).toBeDefined();
    expect(nextInvocation?.getDay()).toBe(expectedExpireDay.getDay());
  });

  it('schedules to refresh even if a token is not valid', () => {
    const scheduler = new TokenScheduler(4, [
      invalidToken,
      jwtExpiresTwentyNinthOfNovember,
    ]);

    const schedule = scheduler.schedule(taks);

    expect(schedule).toBeDefined();
  });

  it('shedules to refresh even if a token is not valid or does not expire', () => {
    const scheduler = new TokenScheduler(7, [
      jwtWithoutExpiration,
      jwtExpiresTwentyNinthOfNovember,
      invalidToken,
    ]);

    const schedule = scheduler.schedule(taks);

    expect(schedule).toBeDefined();
  });

  it('does not schedule if any token expires', () => {
    const scheduler = new TokenScheduler(7, [jwtWithoutExpiration]);

    const schedule = scheduler.schedule(taks);

    expect(schedule).not.toBeDefined();
  });

  it('does not schedules if any token is valid', () => {
    const scheduler = new TokenScheduler(7, [invalidToken]);

    const schedule = scheduler.schedule(taks);

    expect(schedule).not.toBeDefined();
  });
});
