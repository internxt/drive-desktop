import { trimPlaceholderId } from './placeholder-id';

describe('placeholder-id', () => {
  describe('trimPlaceholderId', () => {
    it('should trim placeholder id with control characters \\x00', () => {
      const placeholderId = 'FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed\x00';
      const trimmedId = trimPlaceholderId({ placeholderId });
      expect(trimmedId).toBe('FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed');
    });

    it('should trim placeholder id with control characters \\n', () => {
      const placeholderId = 'FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed\n';
      const trimmedId = trimPlaceholderId({ placeholderId });
      expect(trimmedId).toBe('FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed');
    });

    it('should trim placeholder id with control characters \\r', () => {
      const placeholderId = 'FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed\r';
      const trimmedId = trimPlaceholderId({ placeholderId });
      expect(trimmedId).toBe('FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed');
    });

    it('should trim placeholder id with control characters \\t', () => {
      const placeholderId = 'FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed\t';
      const trimmedId = trimPlaceholderId({ placeholderId });
      expect(trimmedId).toBe('FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed');
    });
  });
});
