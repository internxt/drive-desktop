import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getI18nValue } from './use-i18n';
import * as i18nStoreModule from './i18n.store';

describe('use-i18n', () => {
  const i18nStoreMock = partialSpyOn(i18nStoreModule, 'i18nStore');

  beforeEach(() => {
    i18nStoreMock.mockReturnValue('en');
  });

  it('should return key if the key does not exist', () => {
    // When
    const res = getI18nValue('en', 'non.existing.key' as any);
    // Then
    expect(res).toBe('non.existing.key');
  });

  it('should return key if the value is not an string', () => {
    // When
    const res = getI18nValue('en', 'settings.general.language' as any);
    // Then
    expect(res).toBe('settings.general.language');
  });

  it('should return correct translation', () => {
    // When
    const res = getI18nValue('en', 'settings.general.language.label');
    // Then
    expect(res).toBe('Language');
  });

  it('should replace args', () => {
    // When
    const res = getI18nValue('en', 'settings.account.usage.display', { used: 10, total: 90 });
    // Then
    expect(res).toBe('Used 10 of 90');
  });
});
