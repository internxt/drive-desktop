import { abs, dirname } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('abs', () => {
    expect(abs('C:\\Users\\user', 'InternxtDrive')).toBe('C:/Users/user/InternxtDrive');
    expect(abs('C:\\\\Users\\\\user\\\\', '\\\\InternxtDrive\\\\')).toBe('C:/Users/user/InternxtDrive');
    expect(abs('C:/Users/user', 'InternxtDrive')).toBe('C:/Users/user/InternxtDrive');
    expect(abs('C://Users//user//', '//InternxtDrive//')).toBe('C:/Users/user/InternxtDrive');
  });

  it('dirname', () => {
    const path = abs('/a/b/c');
    const newPath = dirname(path);
    expect(newPath).toBe('/a/b');
  });
});
