describe('authClient', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEW_DRIVE_URL: 'https://api.example.com' };
  });

  afterAll(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it('should call createClient with correct baseUrl', async () => {
    const createClientMock = jest.fn(() => ({ get: jest.fn(), post: jest.fn() }));

    jest.mock('openapi-fetch', () => ({
      __esModule: true,
      default: createClientMock
    }));

    const { authClient } = await import('./auth.client');

    expect(authClient).toBeDefined();
    expect(createClientMock).toHaveBeenCalledWith({
      baseUrl: 'https://api.example.com'
    });
  });
});
