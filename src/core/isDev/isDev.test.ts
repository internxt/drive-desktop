import isDev from './isDev';

describe('isDev function', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return false when process.env.NODE_ENV is not defined', () => {
    delete process.env.NODE_ENV;
    expect(isDev()).toBe(false);
  });

  it('should return true when process.env.NODE_ENV is "development"', () => {
    process.env.NODE_ENV = 'development';
    expect(isDev()).toBe(true);
  });

  it('should return false when process.env.NODE_ENV is "production"', () => {
    process.env.NODE_ENV = 'production';
    expect(isDev()).toBe(false);
  });

  it('should return false for any other value of NODE_ENV', () => {
    process.env.NODE_ENV = 'staging';
    expect(isDev()).toBe(false);
  });
});
