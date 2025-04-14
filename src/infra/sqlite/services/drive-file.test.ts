import { DriveFileCollection } from './drive-file';

describe('drive-file', () => {
  const collection = new DriveFileCollection();

  it('If no options are provided, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({});

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is empty, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: '' });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is undefined, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: undefined });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is null, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: null as unknown as string });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId has a value, it should return it inside the options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: 'uuid' });

    // Then
    expect(where).toStrictEqual({ workspaceId: 'uuid' });
  });
});
