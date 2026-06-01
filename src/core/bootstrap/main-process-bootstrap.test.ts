import { bootstrapMainProcess } from './main-process-bootstrap';
import * as registerAppReadyFlowModule from './register-app-ready-flow';
import * as registerMainIpcHandlersModule from './register-main-ipc-handlers';
import * as registerProcessHandlersModule from './register-process-handlers';
import * as registerSecondInstanceFlowModule from './register-second-instance-flow';
import * as registerSessionEventHandlersModule from './register-session-event-handlers';
import * as setupEnvironmentDebugToolsModule from './setup-environment-debug-tools';
import { partialSpyOn } from 'tests/vitest/utils.helper';

describe('main-process-bootstrap', () => {
  const setupEnvironmentDebugToolsMock = partialSpyOn(setupEnvironmentDebugToolsModule, 'setupEnvironmentDebugTools');
  const registerMainIpcHandlersMock = partialSpyOn(registerMainIpcHandlersModule, 'registerMainIpcHandlers');
  const registerAppReadyFlowMock = partialSpyOn(registerAppReadyFlowModule, 'registerAppReadyFlow');
  const registerSecondInstanceFlowMock = partialSpyOn(registerSecondInstanceFlowModule, 'registerSecondInstanceFlow');
  const registerSessionEventHandlersMock = partialSpyOn(
    registerSessionEventHandlersModule,
    'registerSessionEventHandlers',
  );
  const registerProcessHandlersMock = partialSpyOn(registerProcessHandlersModule, 'registerProcessHandlers');

  beforeEach(() => {
    setupEnvironmentDebugToolsMock.mockImplementation(() => undefined);
    registerMainIpcHandlersMock.mockImplementation(() => undefined);
    registerAppReadyFlowMock.mockImplementation(() => undefined);
    registerSecondInstanceFlowMock.mockImplementation(() => undefined);
    registerSessionEventHandlersMock.mockImplementation(() => undefined);
    registerProcessHandlersMock.mockImplementation(() => undefined);
  });

  it('should register all main process bootstrap flows', () => {
    bootstrapMainProcess();

    expect(setupEnvironmentDebugToolsMock).toBeCalled();
    expect(registerMainIpcHandlersMock).toBeCalled();
    expect(registerAppReadyFlowMock).toBeCalled();
    expect(registerSecondInstanceFlowMock).toBeCalled();
    expect(registerSessionEventHandlersMock).toBeCalled();
    expect(registerProcessHandlersMock).toBeCalled();
  });
});
