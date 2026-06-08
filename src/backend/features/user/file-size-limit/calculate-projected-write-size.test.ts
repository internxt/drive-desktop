import { calculateProjectedWriteSize } from './calculate-projected-write-size';

describe('calculateProjectedWriteSize', () => {
  it('should return offset plus incoming bytes when the write extends the file', () => {
    expect(calculateProjectedWriteSize({ currentSize: 10, offset: 10, incomingBytes: 5 })).toBe(15);
  });

  it('should keep current size when the write stays inside the existing file', () => {
    expect(calculateProjectedWriteSize({ currentSize: 10, offset: 2, incomingBytes: 5 })).toBe(10);
  });

  it('should account for sparse writes at a large offset', () => {
    expect(calculateProjectedWriteSize({ currentSize: 0, offset: 1_000, incomingBytes: 5 })).toBe(1_005);
  });

  it('should account for out-of-order writes after a larger write already happened', () => {
    expect(calculateProjectedWriteSize({ currentSize: 1_005, offset: 0, incomingBytes: 5 })).toBe(1_005);
  });
});
