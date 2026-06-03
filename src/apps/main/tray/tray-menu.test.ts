import { calls } from 'tests/vitest/utils.helper';
import PackageJson from '../../../../package.json';

const { trayHandlers, trayInstance, buildFromTemplateMock, createFromPathMock, TrayMock } = vi.hoisted(() => {
  const trayHandlers = new Map<string, (...args: unknown[]) => unknown>();
  const trayInstance = {
    getBounds: vi.fn(() => ({ x: 1, y: 2, width: 3, height: 4 })),
    setIgnoreDoubleClickEvents: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      trayHandlers.set(event, handler);
    }),
    setContextMenu: vi.fn(),
    setImage: vi.fn(),
    setToolTip: vi.fn(),
    destroy: vi.fn(),
  };

  const buildFromTemplateMock = vi.fn((template) => ({ template }));
  const createFromPathMock = vi.fn((imagePath: string) => ({ imagePath }));
  const TrayMock = vi.fn(function TrayMock() {
    return trayInstance;
  });

  return {
    trayHandlers,
    trayInstance,
    buildFromTemplateMock,
    createFromPathMock,
    TrayMock,
  };
});

vi.mock('electron', () => ({
  Menu: {
    buildFromTemplate: buildFromTemplateMock,
  },
  nativeImage: {
    createFromPath: createFromPathMock,
  },
  Tray: TrayMock,
}));

import { TrayMenu } from './tray-menu';

describe('tray-menu', () => {
  beforeEach(() => {
    trayHandlers.clear();
  });

  it('should initialize the tray with context menu in loading state', () => {
    // Given
    const onClick = vi.fn();
    const onQuit = vi.fn();

    // When
    new TrayMenu('/icons', onClick, onQuit);
    const expectedContextMenu = [
      {
        label: `Internxt ${PackageJson.version}`,
        click: expect.any(Function),
      },
      {
        label: 'Quit',
        click: expect.any(Function),
      },
    ];
    // Then
    expect(TrayMock).toBeCalledWith('/icons/loading.png');
    expect(createFromPathMock).toBeCalledWith('/icons/loading.png');
    expect(trayInstance.setImage).toBeCalledWith({ imagePath: '/icons/loading.png' });
    expect(trayInstance.setToolTip).toBeCalledWith('Loading Internxt...');
    expect(buildFromTemplateMock).toBeCalledWith(expectedContextMenu);
    expect(trayInstance.setContextMenu).toBeCalledWith({
      template: expectedContextMenu,
    });
  });

  it('should invoke onClick when the context menu Open app item is clicked', async () => {
    // Given
    const onClick = vi.fn().mockResolvedValue(undefined);
    const onQuit = vi.fn();
    new TrayMenu('/icons', onClick, onQuit);

    // When – simulate clicking the first (only) menu item
    const [[menuTemplate]] = buildFromTemplateMock.mock.calls as [[Electron.MenuItemConstructorOptions[]]];
    await (menuTemplate[0].click as () => Promise<void>)();

    // Then
    expect(onClick).toBeCalled();
  });

  it('should update the tooltip for idle state', () => {
    // Given
    const trayMenu = new TrayMenu('/icons', vi.fn().mockResolvedValue(undefined), vi.fn());

    // When
    trayMenu.setState('IDLE');

    // Then
    expect(trayInstance.setToolTip).toBeCalledWith(`Internxt ${PackageJson.version}`);
  });

  it('should not update the image or tooltip when called with the same state twice', () => {
    // Given
    const trayMenu = new TrayMenu('/icons', vi.fn().mockResolvedValue(undefined), vi.fn());
    trayMenu.setState('SYNCING'); // first call — state changes LOADING→SYNCING
    trayInstance.setImage.mockClear();
    trayInstance.setToolTip.mockClear();

    // When — same state again
    trayMenu.setState('SYNCING');

    // Then — no native tray calls should be made
    calls(trayInstance.setImage).toHaveLength(0);
    calls(trayInstance.setToolTip).toHaveLength(0);
  });
});
