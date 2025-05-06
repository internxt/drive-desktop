import { Device } from '../../../../../main/device/service';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeviceContext, DeviceState } from '../../../../context/DeviceContext';
import { DevicesList } from './DevicesList';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { mockElectron } from '../../../../../__mocks__/mockElectron';


jest.mock('../../../../hooks/devices/useDevices');

jest.mock('../../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key
  })
}));

jest.mock('../../../../components/ScrollableContent', () => ({
  ScrollableContent: ({ children }: { children: React.ReactNode }) => <div data-testid="scrollable-content">{children}</div>
}));

jest.mock('./Help', () => ({
  __esModule: true,
  default: () => <div data-testid="help-component">Help Component</div>
}));



const mockDevices: Array<Device> = [
  {
    id: 1,
    uuid: 'uuid1',
    name: 'Device 1',
    bucket: 'bucket1',
    removed: false,
    hasBackups: true,
  },
  {
    id: 2,
    uuid: 'uuid2',
    name: 'Device 2',
    bucket: 'bucket2',
    removed: false,
    hasBackups: true,
  },
];

const mockDeviceRename = jest.fn(async (): Promise<void> => {});
const mockgetDevices = jest.fn(async (): Promise<void> => {});

const renderComponent = (contextOverrides = {}) => {

  const contextValue = {
    deviceState: { status: 'SUCCESS', device: mockDevices[0] } as DeviceState,
    devices: mockDevices,
    current: mockDevices[0],
    selected: mockDevices[0],
    deviceRename: mockDeviceRename,
    setSelected: jest.fn(),
    setCurrent: jest.fn(),
    getDevices: mockgetDevices,
    ...contextOverrides,
  };

  return {
    ...render(
      <DeviceContext.Provider value={contextValue}>
        <DevicesList />
      </DeviceContext.Provider>
    ),
    contextValue,
  };
};

describe('DevicesList', () => {

  beforeAll(() => {
    window.electron = mockElectron;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // @ts-ignore
    delete window.electron;
  });

  it('should render properly', () => {
    renderComponent();
    // Should render the title
    expect(screen.getByText('settings.backups.devices')).toBeInTheDocument();

    // Should render both devices
    expect(screen.getByText('Device 1')).toBeInTheDocument();
    expect(screen.getByText('Device 2')).toBeInTheDocument();
  });

  it('should render the Help component', () => {
    renderComponent();
    expect(screen.getByTestId('help-component')).toBeInTheDocument();
  });

  it('should call setSelected when a device is clicked', () => {
    const setSelectedMock = jest.fn();

    const { getByTestId } = renderComponent({
      setSelected: setSelectedMock,
    });

    const pill = getByTestId('device-pill-2');
    fireEvent.click(pill);

    expect(setSelectedMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 2,
      name: 'Device 2',
    }));
  });

  it('should mark the selected device', () => {
    renderComponent({ selected: mockDevices[1] });
    const selectedPillClassnames = 'rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5';

    const selectedPill = screen.getByTestId('device-pill-2');
    const unselectedPill = screen.getByTestId('device-pill-1');

    expect(selectedPill).toHaveClass(selectedPillClassnames);
    expect(unselectedPill).not.toHaveClass(selectedPillClassnames);
  });

  it('should properly mark the current device', () => {
    renderComponent({ current: mockDevices[0] });

    const currentPill = screen.getByTestId('device-pill-1');
    const notCurrentPill = screen.getByTestId('device-pill-2');

    expect(currentPill).toBeInTheDocument();
    expect(currentPill).toHaveTextContent('settings.backups.this-device');
    expect(notCurrentPill).not.toHaveTextContent('settings.backups.this-device');
  });
});
