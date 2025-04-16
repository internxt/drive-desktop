import crypt from './crypt';

describe('crypt', () => {
  describe('decryptName', () => {
    it('When decrypt successfully it gives the name without the extension', () => {
      const name = crypt.decryptName({
        name: 'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCMXISx1jupcfu5cf5NfzRZF4giI3Tcv',
        parentId: 107892578,
      });

      expect(name).toBe('latest');
    });

    it('When no parentId is provided it throws an error', () => {
      expect(() =>
        crypt.decryptName({
          name: 'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCMXISx1jupcfu5cf5NfzRZF4giI3Tcv',
        }),
      ).toThrowError();
    });

    it('When decrypt fails it throws an error', () => {
      expect(() =>
        crypt.decryptName({
          name: 'invalid',
          parentId: 107892578,
        }),
      ).toThrowError();
    });
  });

  describe('encryptName', () => {
    it('When encrypt successfully it gives the name without the extension', () => {
      const name = crypt.encryptName({
        name: 'latest',
        parentId: 107892578,
      });

      expect(name).toHaveLength(136);
    });

    it('When no parentId is provided it throws an error', () => {
      expect(() =>
        crypt.encryptName({
          name: 'latest',
        }),
      ).toThrowError();
    });
  });
});
