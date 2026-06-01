import { BLOCK_SIZE } from './constants';
import { expandToBlockBoundaries } from './expand-to-block-boundaries';

describe('expandToBlockBoundaries', () => {
  it('expands a small read inside the first block to the full first block', () => {
    const result = expandToBlockBoundaries({
      range: { position: 100, length: 4096 },
      fileSize: BLOCK_SIZE * 3,
    });

    expect(result).toStrictEqual({ blockStart: 0, blockLength: BLOCK_SIZE });
  });

  it('starts at the containing block boundary for reads after the first block', () => {
    const result = expandToBlockBoundaries({
      range: { position: BLOCK_SIZE + 100, length: 4096 },
      fileSize: BLOCK_SIZE * 3,
    });

    expect(result).toStrictEqual({ blockStart: BLOCK_SIZE, blockLength: BLOCK_SIZE });
  });

  it('expands reads crossing a block boundary to cover every touched block', () => {
    const result = expandToBlockBoundaries({
      range: { position: BLOCK_SIZE - 100, length: 200 },
      fileSize: BLOCK_SIZE * 3,
    });

    expect(result).toStrictEqual({ blockStart: 0, blockLength: BLOCK_SIZE * 2 });
  });

  it('expands a read inside a partial last block to that whole partial block', () => {
    const partialLastBlockLength = 500;
    const fileSize = BLOCK_SIZE + partialLastBlockLength;

    const result = expandToBlockBoundaries({
      range: { position: BLOCK_SIZE + 100, length: 100 },
      fileSize,
    });

    expect(result).toStrictEqual({ blockStart: BLOCK_SIZE, blockLength: partialLastBlockLength });
  });
});
