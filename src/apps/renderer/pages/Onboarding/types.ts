type OnboardingImagesItem = {
  light: React.FC<React.SVGProps<SVGSVGElement>>;
  dark: React.FC<React.SVGProps<SVGSVGElement>>;
};

export type OnboardingImages = {
  es: OnboardingImagesItem;
  fr: OnboardingImagesItem;
  en: OnboardingImagesItem;
};
