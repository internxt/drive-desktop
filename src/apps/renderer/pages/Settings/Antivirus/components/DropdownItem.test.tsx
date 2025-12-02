import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownItem } from './DropdownItem';

describe('DropdownItem', () => {
  it('renders children correctly', () => {
    render(
      <DropdownItem>
        <span>Test Item</span>
      </DropdownItem>,
    );

    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('applies active class when active prop is true', () => {
    render(
      <DropdownItem active>
        <span>Active Item</span>
      </DropdownItem>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-1');
  });

  it('does not apply active class when active prop is false', () => {
    render(
      <DropdownItem active={false}>
        <span>Inactive Item</span>
      </DropdownItem>,
    );

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('bg-gray-1');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <DropdownItem onClick={handleClick}>
        <span>Clickable Item</span>
      </DropdownItem>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when key is pressed', () => {
    const handleClick = vi.fn();
    render(
      <DropdownItem onClick={handleClick}>
        <span>Keyboard Item</span>
      </DropdownItem>,
    );

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
