import { fireEvent, render, screen } from '@testing-library/react';
import { configStore } from '../../features/config/config.store';
import { ItemsSection } from './items-section';

vi.mock('../../hooks/useIssues', () => ({
  useIssues: () => ({ issues: [] }),
}));

describe('ItemsSection', () => {
  beforeEach(() => {
    configStore.setState({ language: 'en' });
    globalThis.window.electron.syncManually = vi.fn().mockResolvedValue(undefined);
    globalThis.window.electron.recoverySyncManually = vi.fn().mockResolvedValue({ data: true, error: undefined });
    globalThis.window.electron.logger = { ...globalThis.window.electron.logger, error: vi.fn() };
  });

  async function openMenu({ isSyncing = false }: { isSyncing?: boolean } = {}) {
    const { container } = render(<ItemsSection setIsLogoutModalOpen={vi.fn()} isSyncing={isSyncing} />);
    const menuButton = container.querySelector('[data-automation-id="headerDropdown"] button');
    if (!(menuButton instanceof HTMLButtonElement)) throw new Error('Menu button was not found');
    fireEvent.click(menuButton);
    return await screen.findByText('Recovery sync');
  }

  it('places recovery sync below sync and invokes only recovery', async () => {
    // Given
    const recoveryItem = await openMenu();
    const syncButton = screen.getByText('Sync').closest('button');
    const recoveryButton = recoveryItem.closest('button');
    expect(syncButton?.parentElement?.nextElementSibling).toBe(recoveryButton?.parentElement);
    // When
    fireEvent.click(recoveryItem);
    // Then
    expect(globalThis.window.electron.recoverySyncManually).toHaveBeenCalledTimes(1);
    expect(globalThis.window.electron.syncManually).not.toHaveBeenCalled();
  });

  it('uses compact option rows without a scrollable menu', async () => {
    // Given / When
    await openMenu();
    // Then
    const menu = screen.getByRole('menu');
    expect(menu).not.toHaveClass('max-h-80');
    expect(menu).not.toHaveClass('overflow-y-auto');
    for (const option of Array.from(menu.querySelectorAll('button'))) {
      expect(option).toHaveClass('py-1');
    }
    expect(screen.getByText('Quit')).toBeVisible();
  });

  it('keeps regular sync separate from recovery', async () => {
    // Given
    await openMenu();
    // When
    fireEvent.click(screen.getByText('Sync'));
    // Then
    expect(globalThis.window.electron.syncManually).toHaveBeenCalledTimes(1);
    expect(globalThis.window.electron.recoverySyncManually).not.toHaveBeenCalled();
  });

  it('should display the Refer and Earn section', async () => {
    // Given
    const { container } = render(<ItemsSection setIsLogoutModalOpen={vi.fn()} isSyncing={false} />);
    const menuButton = container.querySelector('[data-automation-id="headerDropdown"] button');

    expect(menuButton).not.toBeNull();

    // When
    fireEvent.click(menuButton as HTMLButtonElement);

    // Then
    const referAndEarnSection = await screen.findByText('Refer and Earn');

    expect(referAndEarnSection.closest('[data-automation-id="menuItemReferAndEarn"]')).toBeInTheDocument();
  });

  it('updates the disabled state when syncing starts and finishes', async () => {
    // Given
    const props = { setIsLogoutModalOpen: vi.fn() };
    const { container, rerender } = render(<ItemsSection {...props} isSyncing={false} />);
    const menuButton = container.querySelector('[data-automation-id="headerDropdown"] button');
    if (!(menuButton instanceof HTMLButtonElement)) throw new Error('Menu button was not found');
    fireEvent.click(menuButton);
    const recoveryItem = await screen.findByText('Recovery sync');
    expect(recoveryItem.closest('button')).toBeEnabled();
    expect(recoveryItem.closest('button')?.parentElement).not.toHaveAttribute('title');
    // When
    rerender(<ItemsSection {...props} isSyncing={true} />);
    // Then
    expect(recoveryItem.closest('button')).toBeDisabled();
    expect(recoveryItem.closest('button')?.parentElement).toHaveAttribute('title');
    // When
    rerender(<ItemsSection {...props} isSyncing={false} />);
    expect(recoveryItem.closest('button')?.parentElement).not.toHaveAttribute('title');
    fireEvent.click(recoveryItem);
    // Then
    expect(globalThis.window.electron.recoverySyncManually).toHaveBeenCalledTimes(1);
  });
});
