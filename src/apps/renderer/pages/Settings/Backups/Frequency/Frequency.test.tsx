import { vi, type Mock } from 'vitest';
import { useBackupsInterval } from '../../../../hooks/backups/useBackupsInterval/useBackupsInterval';
import { useUserAvailableProducts } from '../../../../hooks/useUserAvailableProducts/useUserAvailableProducts';
import { render, screen, fireEvent } from '@testing-library/react';
import { Frequency } from './Frequency';

vi.mock('../../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
    language: 'en',
  }),
}));

vi.mock('../../../../hooks/backups/useBackupsInterval/useBackupsInterval', () => ({
  useBackupsInterval: vi.fn(),
}));

vi.mock('../../../../hooks/useUserAvailableProducts/useUserAvailableProducts', () => ({
  useUserAvailableProducts: vi.fn(),
}));

const renderFrequencyComponent = (customProps = {}, backups = true) => {
  (useBackupsInterval as Mock).mockReturnValue({
    backupsInterval: -1,
    updateBackupsInterval: vi.fn(),
    ...customProps,
  });

  (useUserAvailableProducts as Mock).mockReturnValue({
    products: { backups },
  });

  return render(<Frequency />);
};

describe('Frequency', () => {
  it('should render properly', () => {
    renderFrequencyComponent();
    const title = screen.getByText('settings.backups.frequency.title');
    expect(title).toBeInTheDocument();
  });

  it('should render the select', () => {
    renderFrequencyComponent();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should render the manual warning message when the selected backup interval is the manual one', () => {
    renderFrequencyComponent({ backupsInterval: -1 });
    const warning = screen.getByText('settings.backups.frequency.manual-warning');
    expect(warning).toBeInTheDocument();
  });

  it('should not render the manual warning message when the selected backup interval is not the manual one', () => {
    renderFrequencyComponent({ backupsInterval: 86400000 });
    const warning = screen.queryByText('settings.backups.frequency.manual-warning');
    expect(warning).not.toBeInTheDocument();
  });

  it('should properly display the correct value when the user changes the selected value of the component', () => {
    renderFrequencyComponent();
    const BACKUP_6H_INTERVAL = 6 * 3600 * 1000;
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: BACKUP_6H_INTERVAL.toString() } });
    expect(select).toHaveValue(BACKUP_6H_INTERVAL.toString());

    const BACKUP_24H_INTERVAL = 24 * 3600 * 1000;
    fireEvent.change(select, { target: { value: BACKUP_24H_INTERVAL.toString() } });
    expect(select).toHaveValue(BACKUP_24H_INTERVAL.toString());
  });

  it('should disable the select when the user cannot backup', () => {
    renderFrequencyComponent({}, false);

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('pointer-events-none border-gray-5 text-gray-40');
  });

  it('should enable one the user has the backup product availabitly', async () => {
    // Step 1: User has no backups
    const { rerender } = renderFrequencyComponent({}, false);
    const selectBefore = screen.getByRole('combobox');
    expect(selectBefore).toHaveClass('pointer-events-none border-gray-5 text-gray-40');

    // Step 2: User now has backups
    (useUserAvailableProducts as Mock).mockReturnValue({
      products: { backups: true },
    });

    // Rerender the component with updated mocks
    rerender(<Frequency />);

    const selectAfter = screen.getByRole('combobox');
    expect(selectAfter).not.toHaveClass('pointer-events-none');
    expect(selectAfter).toHaveClass('border-gray-20');
    expect(selectAfter).toHaveClass('text-highlight');
  });
});
