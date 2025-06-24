import { clientWrapper } from './in/client-wrapper.service';
import { driveServerWip } from './drive-server-wip.module';
import { authClientMock, clientMock } from 'tests/vitest/mocks.helper.test';

vi.mock(import('./in/client-wrapper.service'));

type TService = keyof typeof driveServerWip;
type TMethod = keyof (typeof driveServerWip)[TService];
type TFunction = (_: unknown) => Promise<{ data: unknown }>;

describe('drive-server-wip', () => {
  const clientWrapperMock = vi.mocked(clientWrapper);

  const dataset: { service: TService; method: TMethod }[] = [];

  for (const _service of Object.keys(driveServerWip)) {
    const service = _service as TService;
    for (const _method of Object.keys(driveServerWip[service])) {
      const method = _method as TMethod;
      dataset.push({ service, method });
    }
  }

  // dataset.push({ service: 'workspaces', method: 'getWorkspaces' });

  beforeAll(() => {
    clientWrapperMock.mockResolvedValue({ data: {} });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(dataset)('%s', async ({ service, method }) => {
    // Given
    authClientMock.POST.mockResolvedValueOnce({ response: { status: 200 } });
    authClientMock.POST.mockResolvedValueOnce({ response: { status: 201 } });
    clientMock.GET.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.GET.mockResolvedValueOnce({ response: { status: 201 } });
    clientMock.POST.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.POST.mockResolvedValueOnce({ response: { status: 201 } });
    // @ts-expect-error for some reason PATCH and PUT require the whole response
    clientMock.PATCH.mockResolvedValueOnce({ response: { status: 200 } });
    // @ts-expect-error for some reason PATCH and PUT require the whole response
    clientMock.PATCH.mockResolvedValueOnce({ response: { status: 201 } });
    // @ts-expect-error for some reason PATCH and PUT require the whole response
    clientMock.PUT.mockResolvedValueOnce({ response: { status: 200 } });
    // @ts-expect-error for some reason PATCH and PUT require the whole response
    clientMock.PUT.mockResolvedValueOnce({ response: { status: 201 } });
    clientMock.DELETE.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.DELETE.mockResolvedValueOnce({ response: { status: 201 } });

    // When
    const fn: TFunction = driveServerWip[service][method];
    await fn({});

    // Then
    const { promise } = clientWrapperMock.mock.calls[0][0];
    const promise1 = await promise();
    const promise2 = await promise();
    expect(promise1).not.toStrictEqual(promise2);
  });
});
