import { abs, AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getPreservedPath, getVolume } from './get-preserved-path';

describe('get-preserved-path', () => {
  describe('getVolume', () => {
    it('should return the drive letter of the path', () => {
      // When
      const { data } = getVolume({ path: abs('d:/Users/user/InternxtDrive/file.txt') });
      // Then
      expect(data).toBe('D:');
    });

    it('should return UNSUPPORTED_VOLUME when the path has no drive letter', () => {
      // When
      const { error } = getVolume({ path: abs('//server/share/file.txt') });
      // Then
      expect(error?.code).toBe('UNSUPPORTED_VOLUME');
    });
  });

  describe('getPreservedPath', () => {
    let props: Parameters<typeof getPreservedPath>[0];

    beforeEach(() => {
      props = {
        rootPath: abs('C:/Users/user/InternxtDrive'),
        rootPaths: [abs('C:/Users/user/InternxtDrive'), abs('C:/Users/user/InternxtDrive - workspace')],
        sourcePath: abs('C:/Users/user/InternxtDrive/Docs/file.txt'),
        destination: abs('C:/Internxt Recovery Sync 2026-01-02 090507'),
      };
    });

    it('should keep the path relative to the sync root inside the destination', () => {
      // When
      const { data } = getPreservedPath(props);
      // Then
      expect(data).toBe('C:/Internxt Recovery Sync 2026-01-02 090507/Docs/file.txt');
    });

    it('should compare the sync root ignoring case', () => {
      // Given
      props.sourcePath = abs('c:/users/user/internxtdrive/Docs/file.txt');
      // When
      const { data } = getPreservedPath(props);
      // Then
      expect(data).toBe('C:/Internxt Recovery Sync 2026-01-02 090507/Docs/file.txt');
    });

    it('should treat a sync root with trailing dots and spaces as the same folder', () => {
      // Given
      props.sourcePath = abs('C:/Users/user/InternxtDrive. /Docs/file.txt');
      // When
      const { data } = getPreservedPath(props);
      // Then
      expect(data).toBe('C:/Internxt Recovery Sync 2026-01-02 090507/Docs/file.txt');
    });

    it.each([
      abs('C:/Users/user/InternxtDrive'),
      abs('C:/Users/user/InternxtDrive - other/file.txt'),
      'C:/Users/user/InternxtDrive/../Other/file.txt' as AbsolutePath,
    ])(
      'should return OUTSIDE_SYNC_ROOT when the source is %s',
      (sourcePath) => {
        // Given
        props.sourcePath = sourcePath;
        // When
        const { error } = getPreservedPath(props);
        // Then
        expect(error?.code).toBe('OUTSIDE_SYNC_ROOT');
      },
    );

    it('should return INSIDE_SYNC_ROOT when a sync root is inside the destination', () => {
      // Given
      props.rootPaths = [...props.rootPaths, abs('C:/Internxt Recovery Sync 2026-01-02 090507/Docs')];
      // When
      const { error } = getPreservedPath(props);
      // Then
      expect(error?.code).toBe('INSIDE_SYNC_ROOT');
    });

    it.each([
      abs('C:/Users/user/InternxtDrive - workspace'),
      abs('c:/users/user/internxtdrive/Recovery'),
      abs('C:/Users/user/InternxtDrive - workspace../Recovery'),
    ])(
      'should return INSIDE_SYNC_ROOT when the destination is %s',
      (destination) => {
        // Given
        props.destination = destination;
        // When
        const { error } = getPreservedPath(props);
        // Then
        expect(error?.code).toBe('INSIDE_SYNC_ROOT');
      },
    );
  });
});
