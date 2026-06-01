import { createAbsolutePath } from './AbsolutePath';

describe('AbsolutePath', () => {
  it('should join path parts', () => {
    const result = createAbsolutePath('/home', 'dev', 'Documents');

    expect(result).toBe('/home/dev/Documents');
  });

  it('should normalize dot segments and duplicated separators', () => {
    const result = createAbsolutePath('/home//dev', './Documents', '../Pictures');

    expect(result).toBe('/home/dev/Pictures');
  });

  it('should remove trailing slash', () => {
    const result = createAbsolutePath('/home/dev/Documents/');

    expect(result).toBe('/home/dev/Documents');
  });
});
