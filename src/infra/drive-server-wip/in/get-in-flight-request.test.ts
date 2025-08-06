import { getInFlightRequest } from './get-in-flight-request';

describe('get-in-flight-response', () => {
  it('should return the same promise when the same key is used', async () => {
    // When
    const promise1 = Promise.resolve('first');
    const promise2 = Promise.resolve('second');
    const promise3 = Promise.resolve('third');
    const promise4 = Promise.resolve('fourth');

    const { promise: res1 } = getInFlightRequest({ key: 'key1', promiseFn: () => promise1 });
    const { promise: res2 } = getInFlightRequest({ key: 'key1', promiseFn: () => promise2 });
    const { promise: res3 } = getInFlightRequest({ key: 'key2', promiseFn: () => promise3 });

    const val1 = await res1;
    const val2 = await res2;
    const val3 = await res3;

    const { promise: res4 } = getInFlightRequest({ key: 'key1', promiseFn: () => promise4 });

    const val4 = await res4;

    expect(val1).toBe('first');
    expect(val2).toBe('first');
    expect(val3).toBe('third');
    expect(val4).toBe('fourth');
  });
});
