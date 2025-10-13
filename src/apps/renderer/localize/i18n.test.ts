import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { i18n } from './i18n';
import * as i18nStoreModule from './i18n.store';

describe('i18n', () => {
  const i18nStoreMock = partialSpyOn(i18nStoreModule, 'i18nStore');

  beforeEach(() => {
    i18nStoreMock.mockReturnValue('en');
  });

  it('should return key if the key does not exist', () => {
    // When
    const res = i18n('non.existing.key' as any);
    // Then
    expect(res).toBe('non.existing.key');
  });

  it('should return key if the value is not an string', () => {
    // When
    const res = i18n('settings.general.language' as any);
    // Then
    expect(res).toBe('settings.general.language');
  });

  it('should return correct translation', () => {
    // When
    const res = i18n('settings.general.language.label');
    // Then
    expect(res).toBe('Language');
  });
});
