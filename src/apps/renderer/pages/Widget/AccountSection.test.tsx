import { render, screen } from '@testing-library/react';
import { type Mock } from 'vitest';
import { useTranslationContext } from '../../context/LocalContext';
import { useUsage } from '../../context/UsageContext/useUsage';
import { AccountSection } from './AccountSection';
import { type User } from '../../../main/types';

vi.mock('../../context/LocalContext');
vi.mock('../../context/UsageContext/useUsage');

describe('AccountSection', () => {
  const getUserMock = vi.mocked(window.electron.getUser);

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslationContext as Mock).mockReturnValue({ translate: (key: string) => key });
    getUserMock.mockResolvedValue(null);
  });

  it('renders the account section container', () => {
    (useUsage as Mock).mockReturnValue({ status: 'loading', usage: null });

    render(<AccountSection />);

    expect(document.querySelector('[data-automation-id="headerAccountSection"]')).toBeInTheDocument();
  });

  it('shows user initials when user is loaded', async () => {
    (useUsage as Mock).mockReturnValue({ status: 'ready', usage: null });
    getUserMock.mockResolvedValue({
      name: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
    } as Partial<User> as User);

    render(<AccountSection />);

    expect(await screen.findByText('JD')).toBeInTheDocument();
  });

  it('shows user email when user is loaded', async () => {
    (useUsage as Mock).mockReturnValue({ status: 'ready', usage: null });
    getUserMock.mockResolvedValue({
      name: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
    } as Partial<User> as User);

    render(<AccountSection />);

    expect(await screen.findByTitle('john@example.com')).toBeInTheDocument();
  });

  it('shows "Loading..." when usage status is loading', () => {
    (useUsage as Mock).mockReturnValue({ status: 'loading', usage: null });

    render(<AccountSection />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty usage when status is error', () => {
    (useUsage as Mock).mockReturnValue({ status: 'error', usage: null });

    render(<AccountSection />);

    const usageParagraph = document
      .querySelector('[data-automation-id="headerAccountSection"]')
      ?.querySelector('p:last-child');
    expect(usageParagraph?.textContent).toBe('');
  });

  it('shows formatted usage when usage data is available', () => {
    (useUsage as Mock).mockReturnValue({
      status: 'ready',
      usage: { usageInBytes: 1024 * 1024, limitInBytes: 1024 * 1024 * 1024, isInfinite: false },
    });

    render(<AccountSection />);

    expect(screen.getByText(/1MB/)).toBeInTheDocument();
  });

  it('shows ∞ as limit when plan is infinite', () => {
    (useUsage as Mock).mockReturnValue({
      status: 'ready',
      usage: { usageInBytes: 1024 * 1024, limitInBytes: 0, isInfinite: true },
    });

    render(<AccountSection />);

    expect(screen.getByText(/∞/)).toBeInTheDocument();
  });
});
