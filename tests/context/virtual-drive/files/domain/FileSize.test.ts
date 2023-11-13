import { FileSize } from '../../../../../src/context/virtual-drive/files/domain/FileSize';

describe('File Size', () => {
  const twentyGB = 20 * 1024 * 1024 * 1024;

  it('can create a file size of 20GB', () => {
    try {
      new FileSize(twentyGB);
    } catch (err) {
      expect(err).not.toBeDefined();
    }
  });

  it('can create a file size of 0', () => {
    try {
      new FileSize(0);
    } catch (err) {
      expect(err).not.toBeDefined();
    }
  });

  it('cannot create a file size of negatives values', () => {
    try {
      new FileSize(-1);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('cannot create a file size greater than 20GB', () => {
    try {
      new FileSize(twentyGB + 1);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
