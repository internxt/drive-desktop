import { clientWrapper } from './in/client-wrapper.service';
import { driveServerWip } from './drive-server-wip.module';
import { clientMock } from 'tests/vitest/mocks.helper.test';
import { FetchResponse } from 'openapi-fetch';

vi.mock(import('./in/client-wrapper.service'));

type TService = keyof typeof driveServerWip;
type TMethod = keyof (typeof driveServerWip)[TService];
type TFunction = (_: unknown, __: unknown) => Promise<{ data: unknown }>;
type TFetchResponse = FetchResponse<Record<string, unknown>, unknown, `${string}/${string}`>;

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
    clientWrapperMock.mockResolvedValue({ error: { code: 'UNKNOWN', message: 'Error', name: 'Error' } });
  });

  it.each(dataset)('%s', async ({ service, method }) => {
    // Given
    clientMock.GET.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.GET.mockResolvedValueOnce({ response: { status: 201 } });
    clientMock.POST.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.POST.mockResolvedValueOnce({ response: { status: 201 } });
    clientMock.PATCH.mockResolvedValueOnce({ response: { status: 200 } } as TFetchResponse);
    clientMock.PATCH.mockResolvedValueOnce({ response: { status: 201 } } as TFetchResponse);
    clientMock.PUT.mockResolvedValueOnce({ response: { status: 200 } } as TFetchResponse);
    clientMock.PUT.mockResolvedValueOnce({ response: { status: 201 } } as TFetchResponse);
    clientMock.DELETE.mockResolvedValueOnce({ response: { status: 200 } });
    clientMock.DELETE.mockResolvedValueOnce({ response: { status: 201 } });

    // When
    const fn: TFunction = driveServerWip[service][method];
    await fn({ ctx: { abortController: new AbortController(), client: clientMock }, context: {} }, {});

    // Then
    const { promiseFn } = clientWrapperMock.mock.calls[0][0];
    const promise1 = await promiseFn();
    const promise2 = await promiseFn();
    expect(promise1).not.toStrictEqual(promise2);
  });
});
