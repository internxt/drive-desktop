import { fireEvent, render, screen } from '@testing-library/react';
import { ItemsSection } from './items-section';

vi.mock('../../hooks/useIssues', () => ({
  useIssues: () => ({ issues: [] }),
}));

describe('ItemsSection', () => {
  it('should display the Refer and Earn section', async () => {
    // Given
    const { container } = render(<ItemsSection setIsLogoutModalOpen={vi.fn()} />);
    const menuButton = container.querySelector('[data-automation-id="headerDropdown"] button');

    expect(menuButton).not.toBeNull();

    // When
    fireEvent.click(menuButton as HTMLButtonElement);

    // Then
    const referAndEarnSection = await screen.findByText('Refer and Earn');

    expect(referAndEarnSection.closest('[data-automation-id="menuItemReferAndEarn"]')).toBeInTheDocument();
  });
});
