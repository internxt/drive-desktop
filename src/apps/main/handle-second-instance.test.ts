import { BrowserWindow } from 'electron';
import { call, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as processDeeplinkModule from './electron/deeplink/process-deeplink';
import { handleSecondInstance } from './handle-second-instance';
import * as quit from './quit';
import * as widget from './windows/widget';

describe('handle-second-instance', () => {
  const quitAppMock = partialSpyOn(quit, 'quitApp');
  const processDeeplinkMock = partialSpyOn(processDeeplinkModule, 'processDeeplink');
  const getWidgetMock = partialSpyOn(widget, 'getWidget');
  const showFrontendMock = partialSpyOn(widget, 'showFrontend');

  const exe = String.raw`C:\Users\user\AppData\Local\Programs\internxt-drive\Internxt.exe`;

  it('should quit the app when the installer asks for it', () => {
    // When
    handleSecondInstance({ argv: [exe, '--quit'] });
    // Then
    expect(quitAppMock).toHaveBeenCalledTimes(1);
  });

  it('should not process the deeplink when the app is asked to quit', () => {
    // When
    handleSecondInstance({ argv: [exe, '--quit'] });
    // Then
    expect(processDeeplinkMock).toHaveBeenCalledTimes(0);
    expect(showFrontendMock).toHaveBeenCalledTimes(0);
  });

  it('should process the deeplink when the app is not asked to quit', () => {
    // Given
    const argv = [exe, 'internxt://notification/https://internxt.com'];
    // When
    handleSecondInstance({ argv });
    // Then
    call(processDeeplinkMock).toStrictEqual({ argv });
    expect(quitAppMock).toHaveBeenCalledTimes(0);
  });

  it('should show the frontend when the widget already exists', () => {
    // Given
    getWidgetMock.mockReturnValue({});
    // When
    handleSecondInstance({ argv: [exe] });
    // Then
    expect(showFrontendMock).toHaveBeenCalledTimes(1);
  });

  it('should not show the frontend when there is no widget', () => {
    // Given
    getWidgetMock.mockReturnValue(undefined as unknown as BrowserWindow);
    // When
    handleSecondInstance({ argv: [exe] });
    // Then
    expect(showFrontendMock).toHaveBeenCalledTimes(0);
  });
});
