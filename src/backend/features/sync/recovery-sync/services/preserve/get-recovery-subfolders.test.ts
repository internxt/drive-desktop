import { getRecoverySubfolders } from './get-recovery-subfolders';

describe('get-recovery-subfolders', () => {
  let props: Parameters<typeof getRecoverySubfolders>[0];

  beforeEach(() => {
    props = { workspaces: [] };
  });

  it('should not use a subfolder for the personal Drive without workspaces', () => {
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders).toStrictEqual(new Map([['', '']]));
  });

  it('should use the personal Drive and the workspace names with workspaces', () => {
    // Given
    props.workspaces = [{ id: 'id1', name: 'Marketing' }];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders).toStrictEqual(
      new Map([
        ['', 'Personal Drive'],
        ['id1', 'Marketing'],
      ]),
    );
  });

  it('should add a suffix to names already used ignoring case, in id order', () => {
    // Given
    props.workspaces = [
      { id: 'id3', name: 'team' },
      { id: 'id1', name: 'Team' },
      { id: 'id2', name: 'personal drive' },
    ];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders).toStrictEqual(
      new Map([
        ['', 'Personal Drive'],
        ['id1', 'Team'],
        ['id2', 'personal drive (2)'],
        ['id3', 'team (2)'],
      ]),
    );
  });

  it.each([
    ['a<b>c:d"e', 'a_b_c_d_e'],
    [String.raw`a/b\c|d?e*`, 'a_b_c_d_e_'],
    ['tab\there', 'tab_here'],
    ['  name. . ', 'name'],
    ['CON', '_CON'],
    ['lpt1.txt', '_lpt1.txt'],
  ])('should make %s a valid folder name', (name, expected) => {
    // Given
    props.workspaces = [{ id: 'id1', name }];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders.get('id1')).toBe(expected);
  });

  it('should shorten long names so the suffix still fits in 255 characters', () => {
    // Given
    const name = 'a'.repeat(300);
    props.workspaces = [
      { id: 'id1', name },
      { id: 'id2', name },
    ];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders.get('id1')).toBe('a'.repeat(255));
    expect(subfolders.get('id2')).toBe(`${'a'.repeat(251)} (2)`);
  });

  it('should not leave half of a character or a trailing space when shortening', () => {
    // Given
    props.workspaces = [
      { id: 'id1', name: `${'a'.repeat(254)}😀` },
      { id: 'id2', name: `${'a'.repeat(250)} bbbbb` },
      { id: 'id3', name: `${'a'.repeat(250)} bbbbb` },
    ];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders.get('id1')).toBe('a'.repeat(254));
    expect(subfolders.get('id2')).toBe(`${'a'.repeat(250)} bbbb`);
    expect(subfolders.get('id3')).toBe(`${'a'.repeat(250)} (2)`);
  });

  it('should use the workspace id when nothing of the name is left', () => {
    // Given
    props.workspaces = [{ id: 'id1', name: ' . ' }];
    // When
    const subfolders = getRecoverySubfolders(props);
    // Then
    expect(subfolders.get('id1')).toBe('id1');
  });
});
