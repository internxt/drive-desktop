const createClientMock = vi.fn(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('../../drive-server.client', () => ({
  createClient: createClientMock,
}));

describe('authClient', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV, NEW_DRIVE_URL: 'https://api.example.com' };
    createClientMock.mockClear();
  });

  afterAll(() => {
    vi.clearAllMocks();
    process.env = OLD_ENV;
  });

  it('should call createClient with correct baseUrl', async () => {
    const { authClient } = await import('./auth.client');

    expect(authClient).toBeDefined();
    expect(createClientMock).toHaveBeenCalledWith({
      baseUrl: 'https://api.example.com',
    });
  });
});
