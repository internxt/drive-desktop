import { Device } from '../../../../../main/device/service';
import { screen, render, fireEvent } from '@testing-library/react';
import DevicePill from './DevicePill';

vi.mock('../../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
  }),
}));

const mockDevice: Device = {
  id: 1,
  uuid: 'uuid1',
  name: 'Device 1',
  bucket: 'bucket1',
  removed: false,
  hasBackups: true,
};

describe('DevicePill', () => {
  afterAll(() => {
    // @ts-ignore
    delete window.electron;
  });

  it('should render the component properly', () => {
    render(<DevicePill device={mockDevice} setSelected={vi.fn()} />);
    expect(screen.getByText('Device 1')).toBeInTheDocument();
  });

  it('should show the "this device" label if current is true', () => {
    render(<DevicePill device={mockDevice} current={true} setSelected={vi.fn()} />);

    expect(screen.getByText('settings.backups.this-device')).toBeInTheDocument();
  });

  it('should have selected styling when selected is true', () => {
    render(<DevicePill device={mockDevice} selected={true} setSelected={vi.fn()} />);

    const pill = screen.getByTestId('device-pill-1');
    expect(pill).toHaveClass('border-gray-10');
    expect(pill).toHaveClass('bg-surface');
    expect(pill).toHaveClass('rounded-lg');
  });

  it('should call setSelected with the device on click', () => {
    const mockSetSelected = vi.fn();

    render(<DevicePill device={mockDevice} setSelected={mockSetSelected} />);

    const pill = screen.getByTestId('device-pill-1');
    fireEvent.click(pill);

    expect(mockSetSelected).toHaveBeenCalledWith(mockDevice);
  });
});
