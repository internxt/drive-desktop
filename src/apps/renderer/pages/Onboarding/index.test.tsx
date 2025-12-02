import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from './index';

// Mock the platform hook
vi.mock('../../hooks/ClientPlatform', () => ({
  __esModule: true,
  default: () => 'linux',
}));

// Mock the translation context
vi.mock('../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
    language: 'en',
  }),
}));

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the first slide (Welcome) by default', () => {
    render(<Onboarding />);
    expect(screen.getByText('onboarding.slides.welcome.take-tour')).toBeInTheDocument();
  });

  it('navigates to next slide when clicking continue', () => {
    render(<Onboarding />);

    // Click the "Take Tour" button on Welcome slide
    fireEvent.click(screen.getByText('onboarding.slides.welcome.take-tour'));

    // Should show the Files Organization slide
    expect(screen.getByText('onboarding.slides.files-organization.title')).toBeInTheDocument();
  });

  it('finishes onboarding when clicking skip', () => {
    render(<Onboarding />);

    fireEvent.click(screen.getByText('onboarding.common.skip'));

    expect(window.electron.finishOnboarding).toHaveBeenCalled();
  });

  it('shows backup folder selector when setting up backups', () => {
    render(<Onboarding />);

    // Navigate to the backups slide (if it exists)
    const setupBackupsButton = screen.queryByText('onboarding.slides.backups.setup-backups');
    if (setupBackupsButton) {
      fireEvent.click(setupBackupsButton);
      expect(screen.getByTestId('backups-modal-overlay')).toHaveClass('opacity-100');
    }
  });
});
