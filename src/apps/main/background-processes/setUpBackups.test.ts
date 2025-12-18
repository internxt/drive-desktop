import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { setupBackupConfig } from './backups/BackupConfiguration/BackupConfiguration';
import { listenForBackupsErrors } from './backups/BackupFatalErrors/listenForBackupErrors';
import { BackupScheduler } from './backups/BackupScheduler/BackupScheduler';
import { handleBackupsStatusMessages } from './backups/BackupsProcessStatus/handlers';
import { initiateBackupsProcessTracker } from './backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsStopController } from './backups/BackupsStopController/BackupsStopController';
import { launchBackupProcesses } from './backups/launchBackupProcesses';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import configStore from '../config';
import { setUpBackups } from './backups/setUpBackups';
import { Mock } from 'vitest';

// Mock all dependencies
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock('../event-bus', () => ({
  default: {
    on: vi.fn(),
  },
}));

vi.mock('./backups/BackupConfiguration/BackupConfiguration', () => ({
  setupBackupConfig: vi.fn(),
}));

vi.mock('./backups/BackupFatalErrors/listenForBackupErrors', () => ({
  listenForBackupsErrors: vi.fn(),
}));

vi.mock('./backups/BackupScheduler/BackupScheduler');

vi.mock('./backups/BackupsProcessStatus/handlers', () => ({
  handleBackupsStatusMessages: vi.fn(),
}));

vi.mock('./backups/BackupsProcessTracker/BackupsProcessTracker', () => ({
  initiateBackupsProcessTracker: vi.fn(),
}));

vi.mock('./backups/BackupsStopController/BackupsStopController');

vi.mock('./backups/launchBackupProcesses', () => ({
  launchBackupProcesses: vi.fn(),
}));

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../auth/handlers', () => ({
  getIsLoggedIn: vi.fn().mockReturnValue(true),
}));

describe('setUpBackups', () => {
  // Mock objects/returns
  const mockBackupConfig = {
    lastBackup: new Date(),
    backupInterval: 3600000, // 1 hour
    onBackupIntervalChanged: null,
    backupFinished: vi.fn(),
    enabled: true,
    toggleEnabled: vi.fn(),
    obtainBackupsInfo: vi.fn(),
    hasDiscoveredBackups: vi.fn(),
    backupsDiscovered: vi.fn(),
  };
  const mockTracker = {
    reset: vi.fn(),
    progress: vi.fn(),
    track: vi.fn(),
    currentTotal: vi.fn(),
    currentProcessed: vi.fn(),
    getLastExistReason: vi.fn(),
    backing: vi.fn(),
    currentIndex: vi.fn(),
    totalBackups: vi.fn(),
    backupFinished: vi.fn(),
    getExitReason: vi.fn(),
  };
  const mockErrors = {
    clear: vi.fn(),
    add: vi.fn(),
    get: vi.fn(),
  };
  const mockStatus = {
    set: vi.fn(),
    isIn: vi.fn(),
    current: vi.fn(),
  };

  const mockStopController = {
    reset: vi.fn(),
    hasStopped: vi.fn(),
    userCancelledBackup: vi.fn(),
    backupCompleted: vi.fn(),
    failed: vi.fn(),
    on: vi.fn(),
    onFinished: vi.fn(),
  };

  const mockScheduler = {
    start: vi.fn(),
    stop: vi.fn(),
    reschedule: vi.fn(),
    isScheduled: vi.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    {
      vi.clearAllMocks();

      // Reset mock implementations
      (setupBackupConfig as Mock).mockReturnValue(mockBackupConfig);
      (initiateBackupsProcessTracker as Mock).mockReturnValue(mockTracker);
      (listenForBackupsErrors as Mock).mockReturnValue(mockErrors);
      (handleBackupsStatusMessages as Mock).mockReturnValue(mockStatus);

      // Mock BackupScheduler constructor
      (BackupScheduler as unknown as Mock).mockImplementation(() => mockScheduler);

      // Mock BackupsStopController constructor
      (BackupsStopController as Mock).mockImplementation(() => mockStopController);
    }
  });

  it('should set up backups when user has backups feature', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Verify initialization
    expect(setupBackupConfig).toHaveBeenCalled();
    expect(initiateBackupsProcessTracker).toHaveBeenCalled();
    expect(listenForBackupsErrors).toHaveBeenCalled();
    expect(handleBackupsStatusMessages).toHaveBeenCalled();
    expect(BackupsStopController).toHaveBeenCalled();

    // Verify BackupScheduler was initialized properly
    expect(BackupScheduler).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.any(Function));

    // Verify scheduler was started
    expect(mockScheduler.start).toHaveBeenCalled();

    // Verify event listeners were set up
    expect(eventBus.on).toHaveBeenCalledWith('USER_LOGGED_OUT', expect.any(Function));
    expect(eventBus.on).toHaveBeenCalledWith('USER_WAS_UNAUTHORIZED', expect.any(Function));
    expect(eventBus.on).toHaveBeenCalledWith('USER_AVAILABLE_PRODUCTS_UPDATED', expect.any(Function));
    expect(ipcMain.on).toHaveBeenCalledWith('start-backups-process', expect.any(Function));

    // Verify logging
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Setting up backups',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Start service',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Backups schedule is set',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Backups ready',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should not start scheduler when user does not have backups feature', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    // Verify initialization still happens
    expect(setupBackupConfig).toHaveBeenCalled();
    expect(initiateBackupsProcessTracker).toHaveBeenCalled();
    expect(listenForBackupsErrors).toHaveBeenCalled();
    expect(handleBackupsStatusMessages).toHaveBeenCalled();

    // Verify BackupScheduler was initialized properly
    expect(BackupScheduler).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.any(Function));

    // Verify scheduler was NOT started
    expect(mockScheduler.start).not.toHaveBeenCalled();

    // Verify logging
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Setting up backups',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'User does not have the backup feature available',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).not.toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Start Service',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).not.toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Backups schedule is set',
        tag: 'BACKUPS',
      }),
    );
    expect(logger.debug).not.toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Backups ready',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should stop scheduler when backup interval is set to -1', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    const setterCall = (setupBackupConfig as Mock).mock.results[0].value;

    setterCall.onBackupIntervalChanged(-1);

    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'The backups schedule stopped',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should reschedule backups when interval changes and user has backups feature', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    const setterCall = (setupBackupConfig as Mock).mock.results[0].value;

    // Call the callback with a new interval
    setterCall.onBackupIntervalChanged(30000); // 30 seconds

    expect(mockScheduler.reschedule).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'The backups has been rescheduled',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should handle USER_LOGGED_OUT event by stopping backups', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the USER_LOGGED_OUT handler
    const userLoggedOutHandler = (eventBus.on as Mock).mock.calls.find(([event]) => event === 'USER_LOGGED_OUT')![1];

    // Call the handler
    userLoggedOutHandler();

    expect(ipcMain.emit).toHaveBeenCalledWith('stop-backups-process');
    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(mockErrors.clear).toHaveBeenCalled();
    expect(mockTracker.reset).toHaveBeenCalled();
  });

  it('should handle USER_AVAILABLE_PRODUCTS_UPDATED event with new backups access', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    const productsUpdatedHandler = (eventBus.on as Mock).mock.calls.find(
      ([event]) => event === 'USER_AVAILABLE_PRODUCTS_UPDATED',
    )![1];

    productsUpdatedHandler({ backups: true });

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'User now has the backup feature available, setting up backups',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should handle USER_AVAILABLE_PRODUCTS_UPDATED event with removed backups access', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the USER_AVAILABLE_PRODUCTS_UPDATED handler
    const productsUpdatedHandler = (eventBus.on as Mock).mock.calls.find(
      ([event]) => event === 'USER_AVAILABLE_PRODUCTS_UPDATED',
    )![1];

    // Call the handler with products that don't include backups
    productsUpdatedHandler({ backups: false });

    // Verify backups were stopped and cleaned up
    expect(ipcMain.emit).toHaveBeenCalledWith('stop-backups-process');
    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(mockErrors.clear).toHaveBeenCalled();
    expect(mockTracker.reset).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'User no longer has the backup feature available',
        tag: 'BACKUPS',
      }),
    );
  });

  it('should handle start-backups-process event when user has backups feature', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the start-backups-process handler
    const startBackupsHandler = (ipcMain.on as Mock).mock.calls.find(
      ([event]) => event === 'start-backups-process',
    )![1];

    await startBackupsHandler();

    // Verify launchBackupProcesses was called with the right parameters
    expect(launchBackupProcesses).toHaveBeenCalledWith(false, mockTracker, mockStatus, mockErrors, mockStopController);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Backups started manually',
      }),
    );
  });

  it('should not launch backup processes when user does not have backups feature', async () => {
    (configStore.get as Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    // Get the start-backups-process handler
    const startBackupsHandler = (ipcMain.on as Mock).mock.calls.find(
      ([event]) => event === 'start-backups-process',
    )![1];

    await startBackupsHandler();

    expect(launchBackupProcesses).not.toHaveBeenCalled();
  });
});
