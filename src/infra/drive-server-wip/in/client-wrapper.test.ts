import { mockProps } from 'tests/vitest/utils.helper.test';
import { clientWrapper } from './client-wrapper.service';
import { handleRemoveErrors } from './helpers/error-helpers';
import { errorWrapper } from './error-wrapper';
import { DriveServerWipError } from '../out/error.types';
import { sleep } from '@/apps/main/util';
import { exceptionWrapper } from './exception-wrapper';
import { getInFlightRequest } from './get-in-flight-request';

vi.mock(import('./error-wrapper'));
vi.mock(import('./exception-wrapper'));
vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/in/helpers/error-helpers'));
vi.mock(import('./get-in-flight-request'));

describe('client-wrapper', () => {
  const handleRemoveErrorsMock = vi.mocked(handleRemoveErrors);
  const errorWrapperMock = vi.mocked(errorWrapper);
  const exceptionWrapperMock = vi.mocked(exceptionWrapper);
  const sleepMock = vi.mocked(sleep);
  const getInFlightRequestMock = vi.mocked(getInFlightRequest);

  const response = {} as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
    getInFlightRequestMock.mockImplementation(({ promiseFn }) => ({ reused: false, promise: promiseFn() }));
  });

  it('If promise returns data, then return data', async () => {
    // Given
    const props = mockProps<typeof clientWrapper>({
      promiseFn: () => Promise.resolve({ data: 'data', response }),
    });

    // When
    const { data, error } = await clientWrapper(props);

    // Then
    expect(data).toStrictEqual('data');
    expect(error).toStrictEqual(undefined);
    expect(handleRemoveErrorsMock).toBeCalledTimes(1);
  });

  it('If promise returns error and is not server error (5XX), then return error', async () => {
    // Given
    const driveServerWipError = new DriveServerWipError('UNKNOWN', 'cause');
    errorWrapperMock.mockReturnValueOnce(driveServerWipError);

    const props = mockProps<typeof clientWrapper>({
      promiseFn: () => Promise.resolve({ error: 'error', response }),
    });

    // When
    const { data, error } = await clientWrapper(props);

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(driveServerWipError);
    expect(sleepMock).toBeCalledTimes(0);
    expect(handleRemoveErrorsMock).toBeCalledTimes(0);
  });

  it('If promise throws exception and is not network error, then retry 3 times', async () => {
    // Given
    const driveServerWipError = new DriveServerWipError('UNKNOWN', 'cause');
    exceptionWrapperMock.mockReturnValue(driveServerWipError);

    const props = mockProps<typeof clientWrapper>({
      promiseFn: () => Promise.reject(),
    });

    // When
    const { data, error } = await clientWrapper(props);

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(driveServerWipError);
    expect(sleepMock).toBeCalledTimes(2);
    expect(sleepMock).toBeCalledWith(5_000);
    expect(sleepMock).toBeCalledWith(10_000);
    expect(handleRemoveErrorsMock).toBeCalledTimes(0);
  });

  it('If promise returns error and is server error (5XX), then retry until success', async () => {
    // Given
    errorWrapperMock.mockReturnValue(new DriveServerWipError('SERVER', 'cause'));

    let i = 0;
    const props = mockProps<typeof clientWrapper>({
      promiseFn: () =>
        new Promise((resolve) => {
          i += 1;
          if (i === 1) resolve({ error: 'error', response });
          if (i === 2) resolve({ error: 'error', response });
          resolve({ data: 'data', response });
        }),
    });

    // When
    const { data, error } = await clientWrapper(props);

    // Then
    expect(data).toStrictEqual('data');
    expect(error).toStrictEqual(undefined);
    expect(sleepMock).toBeCalledTimes(2);
    expect(sleepMock).toBeCalledWith(5_000);
    expect(sleepMock).toBeCalledWith(10_000);
    expect(handleRemoveErrorsMock).toBeCalledTimes(1);
  });

  it('If promise throws exception and is network error, then retry until success', async () => {
    // Given
    exceptionWrapperMock.mockReturnValue(new DriveServerWipError('NETWORK', 'cause'));

    let i = 0;
    const props = mockProps<typeof clientWrapper>({
      promiseFn: () =>
        new Promise((resolve, reject) => {
          i += 1;
          if (i === 1) reject();
          if (i === 2) reject();
          resolve({ data: 'data', response });
        }),
    });

    // When
    const { data, error } = await clientWrapper(props);

    // Then
    expect(data).toStrictEqual('data');
    expect(error).toStrictEqual(undefined);
    expect(sleepMock).toBeCalledTimes(2);
    expect(sleepMock).toBeCalledWith(5_000);
    expect(sleepMock).toBeCalledWith(10_000);
    expect(handleRemoveErrorsMock).toBeCalledTimes(1);
  });
});
