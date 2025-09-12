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
import { jest } from '@jest/globals';

// Mock all dependencies
jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn(),
    emit: jest.fn(),
  },
}));

jest.mock('../event-bus', () => ({
  on: jest.fn(),
}));

jest.mock('./backups/BackupConfiguration/BackupConfiguration', () => ({
  setupBackupConfig: jest.fn(),
}));

jest.mock('./backups/BackupFatalErrors/listenForBackupErrors', () => ({
  listenForBackupsErrors: jest.fn(),
}));

jest.mock('./backups/BackupScheduler/BackupScheduler');

jest.mock('./backups/BackupsProcessStatus/handlers', () => ({
  handleBackupsStatusMessages: jest.fn(),
}));

jest.mock('./backups/BackupsProcessTracker/BackupsProcessTracker', () => ({
  initiateBackupsProcessTracker: jest.fn(),
}));

jest.mock('./backups/BackupsStopController/BackupsStopController');

jest.mock('./backups/launchBackupProcesses', () => ({
  launchBackupProcesses: jest.fn(),
}));

jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  debug: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../config', () => ({
  get: jest.fn(),
}));

jest.mock('../auth/handlers', () => ({
  getIsLoggedIn: jest.fn().mockReturnValue(true),
}));

describe('setUpBackups', () => {
  // Mock objects/returns
  const mockBackupConfig = {
    lastBackup: new Date(),
    backupInterval: 3600000, // 1 hour
    onBackupIntervalChanged: null,
    backupFinished: jest.fn(),
    enabled: true,
    toggleEnabled: jest.fn(),
    obtainBackupsInfo: jest.fn(),
    hasDiscoveredBackups: jest.fn(),
    backupsDiscovered: jest.fn(),
  };
  const mockTracker = {
    reset: jest.fn(),
    progress: jest.fn(),
    track: jest.fn(),
    currentTotal: jest.fn(),
    currentProcessed: jest.fn(),
    getLastExistReason: jest.fn(),
    backing: jest.fn(),
    currentIndex: jest.fn(),
    totalBackups: jest.fn(),
    backupFinished: jest.fn(),
    getExitReason: jest.fn(),
  };
  const mockErrors = {
    clear: jest.fn(),
    add: jest.fn(),
    get: jest.fn(),
  };
  const mockStatus = {
    set: jest.fn(),
    isIn: jest.fn(),
    current: jest.fn(),
  };

  const mockStopController = {
    reset: jest.fn(),
    hasStopped: jest.fn(),
    userCancelledBackup: jest.fn(),
    backupCompleted: jest.fn(),
    failed: jest.fn(),
    on: jest.fn(),
    onFinished: jest.fn(),
  };

  const mockScheduler = {
    start: jest.fn(),
    stop: jest.fn(),
    reschedule: jest.fn(),
    isScheduled: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {{
    jest.clearAllMocks();

    // Reset mock implementations
    (setupBackupConfig as jest.Mock).mockReturnValue(mockBackupConfig);
    (initiateBackupsProcessTracker as jest.Mock).mockReturnValue(mockTracker);
    (listenForBackupsErrors as jest.Mock).mockReturnValue(mockErrors);
    (handleBackupsStatusMessages as jest.Mock).mockReturnValue(mockStatus);

    // Mock BackupScheduler constructor
    (BackupScheduler as unknown as jest.Mock).mockImplementation(
      () => mockScheduler
    );

    // Mock BackupsStopController constructor
    (BackupsStopController as jest.Mock).mockImplementation(() => mockStopController);
  }});

  it('should set up backups when user has backups feature', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Verify initialization
    expect(setupBackupConfig).toHaveBeenCalled();
    expect(initiateBackupsProcessTracker).toHaveBeenCalled();
    expect(listenForBackupsErrors).toHaveBeenCalled();
    expect(handleBackupsStatusMessages).toHaveBeenCalled();
    expect(BackupsStopController).toHaveBeenCalled();

    // Verify BackupScheduler was initialized properly
    expect(BackupScheduler).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );

    // Verify scheduler was started
    expect(mockScheduler.start).toHaveBeenCalled();

    // Verify event listeners were set up
    expect(eventBus.on).toHaveBeenCalledWith('USER_LOGGED_OUT', expect.any(Function));
    expect(eventBus.on).toHaveBeenCalledWith('USER_WAS_UNAUTHORIZED', expect.any(Function));
    expect(eventBus.on).toHaveBeenCalledWith('USER_AVAILABLE_PRODUCTS_UPDATED', expect.any(Function));
    expect(ipcMain.on).toHaveBeenCalledWith('start-backups-process', expect.any(Function));

    // Verify logging
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] Setting up backups');
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] Start service');
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] Backups schedule is set');
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] Backups ready');
  });

  it('should not start scheduler when user does not have backups feature', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    // Verify initialization still happens
    expect(setupBackupConfig).toHaveBeenCalled();
    expect(initiateBackupsProcessTracker).toHaveBeenCalled();
    expect(listenForBackupsErrors).toHaveBeenCalled();
    expect(handleBackupsStatusMessages).toHaveBeenCalled();

    // Verify BackupScheduler was initialized properly
    expect(BackupScheduler).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );


    // Verify scheduler was NOT started
    expect(mockScheduler.start).not.toHaveBeenCalled();

    // Verify logging
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] Setting up backups');
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] User does not have the backup feature available');

    expect(logger.debug).not.toHaveBeenCalledWith('[BACKUPS] Start service');
    expect(logger.debug).not.toHaveBeenCalledWith('[BACKUPS] Backups schedule is set');
    expect(logger.debug).not.toHaveBeenCalledWith('[BACKUPS] Backups ready');
  });

  it('should stop scheduler when backup interval is set to -1', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    const setterCall = (setupBackupConfig as jest.Mock).mock.results[0].value;

    setterCall.onBackupIntervalChanged(-1);

    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] The backups schedule stopped');
  });

  it('should reschedule backups when interval changes and user has backups feature', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    const setterCall = (setupBackupConfig as jest.Mock).mock.results[0].value;

    // Call the callback with a new interval
    setterCall.onBackupIntervalChanged(30000); // 30 seconds

    expect(mockScheduler.reschedule).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('[BACKUPS] The backups has been rescheduled');
  });

  it('should handle USER_LOGGED_OUT event by stopping backups', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the USER_LOGGED_OUT handler
    const userLoggedOutHandler = (eventBus.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'USER_LOGGED_OUT'
    )[1];

    // Call the handler
    userLoggedOutHandler();

    expect(ipcMain.emit).toHaveBeenCalledWith('stop-backups-process');
    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(mockErrors.clear).toHaveBeenCalled();
    expect(mockTracker.reset).toHaveBeenCalled();
  });

  it('should handle USER_AVAILABLE_PRODUCTS_UPDATED event with new backups access', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    const productsUpdatedHandler = (eventBus.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'USER_AVAILABLE_PRODUCTS_UPDATED'
    )[1];

    productsUpdatedHandler({ backups: true });

    expect(logger.debug).toHaveBeenCalledWith(
      '[BACKUPS] User now has the backup feature available, setting up backups'
    );
  });

  it('should handle USER_AVAILABLE_PRODUCTS_UPDATED event with removed backups access', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the USER_AVAILABLE_PRODUCTS_UPDATED handler
    const productsUpdatedHandler = (eventBus.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'USER_AVAILABLE_PRODUCTS_UPDATED'
    )[1];

    // Call the handler with products that don't include backups
    productsUpdatedHandler({ backups: false });

    // Verify backups were stopped and cleaned up
    expect(ipcMain.emit).toHaveBeenCalledWith('stop-backups-process');
    expect(mockScheduler.stop).toHaveBeenCalled();
    expect(mockErrors.clear).toHaveBeenCalled();
    expect(mockTracker.reset).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      '[BACKUPS] User no longer has the backup feature available'
    );
  });

  it('should handle start-backups-process event when user has backups feature', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: true });

    await setUpBackups();

    // Get the start-backups-process handler
    const startBackupsHandler = (ipcMain.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'start-backups-process'
    )[1];

    await startBackupsHandler();

    // Verify launchBackupProcesses was called with the right parameters
    expect(launchBackupProcesses).toHaveBeenCalledWith(
      false,
      mockTracker,
      mockStatus,
      mockErrors,
      mockStopController
    );
    expect(logger.debug).toHaveBeenCalledWith('Backups started manually');
  });

  it('should not launch backup processes when user does not have backups feature', async () => {
    (configStore.get as jest.Mock).mockReturnValue({ backups: false });

    await setUpBackups();

    // Get the start-backups-process handler
    const startBackupsHandler = (ipcMain.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'start-backups-process'
    )[1];


    await startBackupsHandler();

    expect(launchBackupProcesses).not.toHaveBeenCalled();
  });
});
