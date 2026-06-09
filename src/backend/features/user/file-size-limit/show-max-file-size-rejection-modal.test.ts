import { BrowserWindow } from 'electron';
import * as mainUtil from '@/apps/main/util';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { showMaxFileSizeRejectionModal } from './show-max-file-size-rejection-modal';

describe('showMaxFileSizeRejectionModal', () => {
  const browserWindowMock = vi.mocked(BrowserWindow);
  const resolveHtmlPathMock = partialSpyOn(mainUtil, 'resolveHtmlPath');

  function mockBrowserWindow() {
    const windowMock = {
      loadURL: vi.fn().mockResolvedValue(undefined),
      show: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
      on: vi.fn(),
    };

    browserWindowMock.mockImplementation(
      class {
        constructor() {
          return windowMock;
        }
      } as unknown as typeof BrowserWindow,
    );

    return windowMock;
  }

  function closeWindow(windowMock: ReturnType<typeof mockBrowserWindow> | undefined) {
    const closedHandler = windowMock?.on.mock.calls.find(([eventName]) => eventName === 'closed')?.[1] as (() => void) | undefined;

    closedHandler?.();
  }

  beforeEach(() => {
    resolveHtmlPathMock.mockReturnValue('resolved-modal-url');
  });

  afterEach(() => {
    closeWindow(browserWindowMock.mock.results.at(-1)?.value as ReturnType<typeof mockBrowserWindow> | undefined);
  });

  it('should create modal window and show it after loading url', async () => {
    const windowMock = mockBrowserWindow();

    await showMaxFileSizeRejectionModal({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });

    call(browserWindowMock).toMatchObject({
      width: 539,
      height: 277,
      show: false,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        preload: mainUtil.preloadPath,
        nodeIntegration: true,
      },
    });

    call(resolveHtmlPathMock).toStrictEqual([
      'max-file-size-rejection-modal',
      new URLSearchParams({
        modal: JSON.stringify({
          variant: 'single',
          showUpgradeCta: true,
          maxFileSize: 5,
          fileSize: 6,
        }),
      }).toString(),
    ]);
    call(windowMock.loadURL).toBe('resolved-modal-url');
    calls(windowMock.show).toHaveLength(1);
  });

  it('should not create another modal if current modal is still open', async () => {
    mockBrowserWindow();

    await showMaxFileSizeRejectionModal({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });

    await showMaxFileSizeRejectionModal({
      variant: 'multiple',
      showUpgradeCta: false,
      maxFileSize: 100,
      fileSize: 101,
    });

    calls(browserWindowMock).toHaveLength(1);
    calls(resolveHtmlPathMock).toHaveLength(1);
  });

  it('should allow creating another modal after current modal is closed', async () => {
    const firstWindowMock = mockBrowserWindow();

    await showMaxFileSizeRejectionModal({
      variant: 'single',
      showUpgradeCta: true,
      maxFileSize: 5,
      fileSize: 6,
    });

    closeWindow(firstWindowMock);
    mockBrowserWindow();

    await showMaxFileSizeRejectionModal({
      variant: 'multiple',
      showUpgradeCta: false,
      maxFileSize: 100,
      fileSize: 101,
    });

    calls(browserWindowMock).toHaveLength(2);
  });
});
