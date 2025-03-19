import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AntivirusSlide } from './AntivirusSlide';

jest.mock('../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
    language: 'en',
  }),
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('AntivirusSlide', () => {
  const mockProps = {
    onGoNextSlide: jest.fn(),
    onSkipOnboarding: jest.fn(),
    onSetupBackups: jest.fn(),
    onFinish: jest.fn(),
    platform: 'windows',
    currentSlide: 1,
    totalSlides: 7,
    backupFolders: [],
  };

  it('renders with correct structure', () => {
    render(<AntivirusSlide {...mockProps} />);

    // Check if title and description are rendered with correct translation keys
    const title = screen.getByText('onboarding.slides.antivirus.title');
    const description = screen.getByText(
      'onboarding.slides.antivirus.description'
    );

    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-3xl', 'font-semibold', 'text-gray-100');

    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-lg', 'text-gray-100');
  });
});
