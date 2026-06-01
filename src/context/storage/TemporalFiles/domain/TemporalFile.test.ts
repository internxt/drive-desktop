import { TemporalFile } from './TemporalFile';

describe('TemporalFile', () => {
  describe('isTemporaryPath', () => {
    it('should detect vim swap files', () => {
      expect(TemporalFile.isTemporaryPath('/Documents/.test-file.txt.swp')).toBe(true);
      expect(TemporalFile.isTemporaryPath('/Documents/.test-file.txt.swx')).toBe(true);
    });

    it('should detect vim backup files', () => {
      expect(TemporalFile.isTemporaryPath('/Documents/test-file.txt~')).toBe(true);
    });

    it('should detect vim probe files', () => {
      expect(TemporalFile.isTemporaryPath('/Documents/4913')).toBe(true);
    });

    it('should not classify regular files as auxiliary', () => {
      expect(TemporalFile.isTemporaryPath('/Documents/test-file.txt')).toBe(false);
    });
  });
});
