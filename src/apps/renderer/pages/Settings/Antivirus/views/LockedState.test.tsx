import { render, screen, fireEvent } from '@testing-library/react';
import { LockedState } from './LockedState';

jest.mock('../../../../context/LocalContext');

const mockOpenUrl = jest.fn();
beforeAll(() => {
  if (!global.window) {
    global.window = {} as any;
  }

  global.window.electron = {
    openUrl: mockOpenUrl,
  } as any;
});

describe('LockedState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders locked state with correct text', () => {
    render(<LockedState />);

    expect(
      screen.getByText('settings.antivirus.featureLocked.title')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.featureLocked.subtitle')
    ).toBeInTheDocument();
  });

  it('shows upgrade button', () => {
    render(<LockedState />);

    const upgradeButton = screen.getByText(
      'settings.antivirus.featureLocked.action'
    );
    expect(upgradeButton).toBeInTheDocument();
  });

  it('opens pricing page when upgrade button is clicked', async () => {
    render(<LockedState />);

    const upgradeButton = screen.getByText(
      'settings.antivirus.featureLocked.action'
    );
    await fireEvent.click(upgradeButton);

    expect(mockOpenUrl).toHaveBeenCalledWith('https://internxt.com/pricing');
  });

  it('renders with correct styling', () => {
    render(<LockedState />);

    const container = screen.getByTestId('locked-state-container');
    expect(container).toHaveClass('flex flex-col items-center p-5');

    const contentContainer = screen.getByTestId('locked-state-content');
    expect(contentContainer).toHaveClass(
      'flex flex-col items-center gap-4 text-center'
    );
  });
});
