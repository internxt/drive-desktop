import { isSyncRootCandidate } from './is-sync-root-candidate';

describe('is-sync-root-candidate', () => {
  it.each([
    'OneDrive!S-1-5-21!Personal',
    'Dropbox!S-1-5-21!Account',
    'OtherProvider!S-1-5-21!Account',
    'unknown-provider-id',
    '',
    '{79b4725e-9b4e-4726-b46d-1a202b28a6cf',
    '79b4725e-9b4e-4726-b46d-1a202b28a6cf}',
    '79b4725e9b4e4726b46d1a202b28a6cf',
    '79b4725e-9b4e-4726-b46d-1a202b28a6cg',
  ])('should reject non-UUID id %s', (id) => {
    // Given
    const candidateId = id;

    // When
    const result = isSyncRootCandidate(candidateId);

    // Then
    expect(result).toBe(false);
  });

  it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', 'f'])('should accept UUID version nibble %s with or without braces', (version) => {
    // Given
    const uuid = `79b4725e-9b4e-${version}726-b46d-1a202b28a6cf`;

    // When
    const result = [uuid, `{${uuid.toUpperCase()}}`].map(isSyncRootCandidate);

    // Then
    expect(result).toStrictEqual([true, true]);
  });
});
