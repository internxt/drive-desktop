import { render, screen } from '@testing-library/react';

describe('Test Environment Setup', () => {
  it('should render a simple component', () => {
    render(<div data-testid="test-component">Test Environment</div>);

    const element = screen.getByTestId('test-component');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Test Environment');
  });

  it('should have access to the mocked electron API', () => {
    expect(window.electron).toBeDefined();
    expect(window.electron.antivirus).toBeDefined();
    expect(typeof window.electron.antivirus.isAvailable).toBe('function');
  });
});
