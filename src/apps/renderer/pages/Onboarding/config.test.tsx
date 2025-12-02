import { SLIDES, getOnboardingSlideByName } from './config';

// Mock the translation context
vi.mock('../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
    language: 'en',
  }),
}));

describe('Onboarding Config', () => {
  describe('SLIDES', () => {
    it('contains all required slides in correct order', () => {
      const slideNames = SLIDES.map((slide) => slide.name);
      expect(slideNames).toEqual([
        'Welcome Slide',
        'Files Organization',
        'Available for Online usage Slide',
        'Available for Offline usage Slide',
        'Context Menu Slide',
        'Antivirus Slide',
        'Cleaner Slide',
        'Onboarding Completed',
      ]);
    });

    it('each slide has required properties', () => {
      SLIDES.forEach((slide) => {
        expect(slide).toHaveProperty('name');
        expect(slide).toHaveProperty('component');
        expect(slide).toHaveProperty('footer');
        expect(slide).toHaveProperty('image');
      });
    });
  });

  describe('getOnboardingSlideByName', () => {
    it('returns correct slide for valid name', () => {
      const slide = getOnboardingSlideByName('Antivirus Slide');
      expect(slide).toBeDefined();
      expect(slide?.name).toBe('Antivirus Slide');
    });

    it('returns undefined for invalid slide name', () => {
      const slide = getOnboardingSlideByName('Invalid Slide');
      expect(slide).toBeUndefined();
    });
  });
});
