import { AbsolutePathToRelativeConverter } from './AbsolutePathToRelativeConverter';

describe('AbsolutePathToRelativeConverter', () => {
  it('works', () => {
    const absolute = 'C\\:Users\\JWcer\\InternxtDrive\\\\New folder (4)\\';

    const sut = new AbsolutePathToRelativeConverter('C\\:Users\\JWcer\\InternxtDrive');

    const relative = sut.run(absolute);

    expect(relative).toBe('\\New folder (4)');
  });
});
