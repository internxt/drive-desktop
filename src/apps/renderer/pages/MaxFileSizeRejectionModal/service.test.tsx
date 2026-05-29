import { getDescriptionTranslationKey, getModalPropsFromUrlParams, getSuggestedUpgradePlan } from './service';

describe('MaxFileSizeRejectionModal service', () => {
  describe('getModalPropsFromUrlParams', () => {
    it('should return undefined if modal query param is missing', () => {
      globalThis.window.history.replaceState({}, '', '/max-file-size-rejection-modal');

      const res = getModalPropsFromUrlParams();

      expect(res).toBeUndefined();
    });

    it('should parse modal props from query params', () => {
      const modal = { variant: 'multiple', showUpgradeCta: true, fileSize: 20 };
      const query = new URLSearchParams({ modal: JSON.stringify(modal) }).toString();
      globalThis.window.history.replaceState({}, '', `/max-file-size-rejection-modal?${query}`);

      const res = getModalPropsFromUrlParams();

      expect(res).toStrictEqual(modal);
    });

    it('should return undefined if modal query param is not valid JSON', () => {
      const query = new URLSearchParams({ modal: '{invalid' }).toString();
      globalThis.window.history.replaceState({}, '', `/max-file-size-rejection-modal?${query}`);

      const res = getModalPropsFromUrlParams();

      expect(res).toBeUndefined();
    });

    it('should return undefined if modal url is incorrect', () => {
      globalThis.window.history.replaceState({}, '', '/max-file-size-rejection');

      const res = getModalPropsFromUrlParams();

      expect(res).toBeUndefined();
    });
  });

  describe('getSuggestedUpgradePlan', () => {
    it('should return smallest plan that supports file size', () => {
      const res = getSuggestedUpgradePlan(20 * 1024 ** 3);

      expect(res?.name).toBe('Premium');
    });

    it('should return undefined if no plan supports file size', () => {
      const res = getSuggestedUpgradePlan(120 * 1024 ** 3);

      expect(res).toBeUndefined();
    });
  });

  describe('getDescriptionTranslationKey', () => {
    it('should return single description key when upgrade cta is shown and limit is known', () => {
      const res = getDescriptionTranslationKey({ variant: 'single', showUpgradeCta: true, hasKnownLimit: true });

      expect(res).toBe('maxFileSizeRejectionModal.single.description');
    });

    it('should return single no-suggested-plan description key when upgrade cta is hidden and limit is known', () => {
      const res = getDescriptionTranslationKey({ variant: 'single', showUpgradeCta: false, hasKnownLimit: true });

      expect(res).toBe('maxFileSizeRejectionModal.single.description_no_suggested_plan');
    });

    it('should return multiple description key when upgrade cta is shown and limit is known', () => {
      const res = getDescriptionTranslationKey({ variant: 'multiple', showUpgradeCta: true, hasKnownLimit: true });

      expect(res).toBe('maxFileSizeRejectionModal.multiple.description');
    });

    it('should return multiple no-suggested-plan description key when upgrade cta is hidden and limit is known', () => {
      const res = getDescriptionTranslationKey({ variant: 'multiple', showUpgradeCta: false, hasKnownLimit: true });

      expect(res).toBe('maxFileSizeRejectionModal.multiple.description_no_suggested_plan');
    });

    it('should return single unknown-limit description key when limit is unknown', () => {
      const res = getDescriptionTranslationKey({ variant: 'single', showUpgradeCta: true, hasKnownLimit: false });

      expect(res).toBe('maxFileSizeRejectionModal.single.description_unknown_limit');
    });

    it('should return multiple unknown-limit description key when limit is unknown', () => {
      const res = getDescriptionTranslationKey({ variant: 'multiple', showUpgradeCta: true, hasKnownLimit: false });

      expect(res).toBe('maxFileSizeRejectionModal.multiple.description_unknown_limit');
    });
  });
});
