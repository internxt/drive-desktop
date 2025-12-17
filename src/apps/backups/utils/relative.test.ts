import { relative } from './relative';

describe('relative', () => {
  it('should return the relative path when the target is a subdirectory of the root', () => {
    const root = '/home/user/projects';
    const target = '/home/user/projects/my-app/src';
    const expected = '/my-app/src';

    expect(relative(root, target)).toBe(expected);
  });

  it('should return a single slash when the root and target are the same', () => {
    const root = '/home/user/projects';
    const target = '/home/user/projects';
    const expected = '/';

    expect(relative(root, target)).toBe(expected);
  });

  it('should handle paths with trailing slashes correctly', () => {
    const root = '/home/user/projects/';
    const target = '/home/user/projects/my-app/src/';
    const expected = '/my-app/src';

    expect(relative(root, target)).toBe(expected);
  });
});
