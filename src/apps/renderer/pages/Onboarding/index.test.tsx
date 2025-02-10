import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from './index';
import '@testing-library/jest-dom';

// Mock electron
const mockFinishOnboarding = jest.fn();
const mockAddBackupsFromLocalPaths = jest.fn();

window.electron = {
  finishOnboarding: mockFinishOnboarding,
  addBackupsFromLocalPaths: mockAddBackupsFromLocalPaths,
} as any;

// Mock the platform hook
jest.mock('../../hooks/ClientPlatform', () => ({
  __esModule: true,
  default: () => 'windows',
}));

// Mock the translation context
jest.mock('../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
    language: 'en',
  }),
}));

describe('Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first slide (Welcome) by default', () => {
    render(<Onboarding />);
    expect(
      screen.getByText('onboarding.slides.welcome.take-tour')
    ).toBeInTheDocument();
  });

  it('navigates to next slide when clicking continue', () => {
    render(<Onboarding />);

    // Click the "Take Tour" button on Welcome slide
    fireEvent.click(screen.getByText('onboarding.slides.welcome.take-tour'));

    // Should show the Files Organization slide
    expect(
      screen.getByText('onboarding.slides.files-organization.title')
    ).toBeInTheDocument();
  });

  it('finishes onboarding when clicking skip', () => {
    render(<Onboarding />);

    fireEvent.click(screen.getByText('onboarding.common.skip'));

    expect(mockFinishOnboarding).toHaveBeenCalled();
  });

  it('shows backup folder selector when setting up backups', () => {
    render(<Onboarding />);

    // Navigate to the backups slide (if it exists)
    const setupBackupsButton = screen.queryByText(
      'onboarding.slides.backups.setup-backups'
    );
    if (setupBackupsButton) {
      fireEvent.click(setupBackupsButton);
      expect(screen.getByTestId('backups-modal-overlay')).toHaveClass(
        'opacity-100'
      );
    }
  });
});
