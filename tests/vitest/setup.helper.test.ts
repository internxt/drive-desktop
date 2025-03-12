import { vi } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

vi.mock('@/apps/main/auth/service', () => {
  const user = {
    email: 'jonathandanielarce9@gmail.com',
    userId: '$2a$08$qagrvGIzPiL0Qm2/zSqEf.RwaHuGbYcEcooch.RDhZm/NkH7pOdna',
    mnemonic:
      'strategy thought bleak mouse water couch dinosaur orchard syrup into toilet dice squirrel hotel mass wasp camp enhance prevent avocado foam purse cotton royal',
    root_folder_id: 76977090,
    rootFolderId: '928cddab-db8d-4393-8887-22af95bf36df',
    name: 'My',
    lastname: 'Internxt',
    uuid: '53630301-0faa-4b41-816e-600bac2b2aa5',
    credit: 0,
    createdAt: '2024-02-29T13:40:15.000Z',
    privateKey:
      'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCOgG5KJ12gZHOXJGXx4JcMwpeZjAdn0EOX5fKPgt/uMWLppyRh4Jah6M6kTNbiZaMt2fnCc824MZDLVlscZz1TZfgRe8qH5ucQ8s6nK/rjHUl878vAtlccRPEKvwMvNtaBs5ibOOjQYtmCHvgEwiVf8/xBXR+WcvwVJfcJCyVtIFPg+HcWNtux/AAuu9KZAsqs8YDgujSE9de2fqNeecwZ4rrDUMQ+VqwIDVqVeJGNg8/ul3BtVNls1WJiOqEEJdPTbl21+WmvhZBA7RPNOeOSRYtmAqNJuSMxqLJFR+YWtqaqiGL3rzax0bDmvs25Tiw/Vh03JTbfUtTCCQwg19HiGdX8o1kq81EcURZS0QRVYf0z3BCp2iVhmo0ZBzLhie/8RzIkAbsApEZK6B+Z7VIGcyhuwMh50SkJ6i2eNh9CIP6I4/UNuVM/SqRYAfq3n8KB3grLilyiq4DE5ixqLGkiV6qxLhhyp226cFruSaEoPPoNmVxlIoP8qebpXCjbqO8J28AKwLLGcOr9SGHP0TkEvA1k9khBTFyCjtDqjR9xFpyzDPHh6ymEeU6sCVRpO4LZqS/YtAZU3PU3gFH+Robsm0rwi6AnmXOBEFVaz99tBliJGeoGrUXRL4umGLrq+2ZQxUhkS98MEHl5fh6I7w1sq8OUhlto5sWvb9bBFXgrO3/iuJ7fs0JQvxtEB4LMf6hUNSd964cstsVKzZKzHMFdL87ZMUfPmIcqztUotGxvj2yMsOifN8zz7PWNRdtyCZndoX6TSxAE8FkOXl8PUcGr8w7jbZywvgMaJTw/nOLYcOimE3nyBe+kAmhAqe2a5rT+0U2ZsZhVYSDkQ4eAOHtKE8EubenpOcTsl0too2UcI8WmTsCXePIznPrZomsMTs7b16+NtcC8ORLD50dm/LRIZg69gh4L7IkVpIad3Gl6QyS930YpXYfGoGc8ZeQAJsJOctW/lH9awTyNN9G4=',
    publicKey:
      'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tCgp4ak1FWm1kUEtCWUpLd1lCQkFIYVJ3OEJBUWRBN0ZxYW5KblhsUkRSTmlPUFc3WWFxL25DQ2UzcWZzcXUKTEtGNjBlZ2VTL2ZORHp4cGJuaDBRR2x1ZUhRdVkyOXRQc0tNQkJBV0NnQStCWUptWjA4b0JBc0pCd2dKCmtObS8yQUJRL0o4RUF4VUlDZ1FXQUFJQkFoa0JBcHNEQWg0QkZpRUVnQjc4eHJkMG5MbnA5L2FvMmIvWQpBRkQ4bndRQUFJVFpBUUMreDdIV0NWVGk1elNyUlF2eHd2V2d6U0VSV2pBbmdFQ0I4YndaMTRia253RUEKdCtYaWZRZWFLdjhjcjY3b205dzh1NFpVSjV2TkpCM0VhMW9zb21OQUV3ak9PQVJtWjA4b0Vnb3JCZ0VFCkFaZFZBUVVCQVFkQTVqUXBxY2dIT1BzdGdiam5GcVVUek9YU2dqcFUzcWFXRUVLWUU0dlV4MWNEQVFnSAp3bmdFR0JZSUFDb0ZnbVpuVHlnSmtObS8yQUJRL0o4RUFwc01GaUVFZ0I3OHhyZDBuTG5wOS9hbzJiL1kKQUZEOG53UUFBRmVNQVAwVUlKa285WkZoREQrS2Jpb1VmZFpOK0oxNllVT3I5aER1alRqRzIyS3JEd0QrCkxmN3lTVEZIVHdZNENpNVNvL043TjFtLzIzS1BZUmRjTFZTeEN2NGtwd2M9Cj02Z2UvCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0K',
    revocateKey:
      'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tCkNvbW1lbnQ6IFRoaXMgaXMgYSByZXZvY2F0aW9uIGNlcnRpZmljYXRlCgp3bmdFSUJZS0FDb0ZnbVpuVHlnSmtObS8yQUJRL0o4RUFwMEFGaUVFZ0I3OHhyZDBuTG5wOS9hbzJiL1kKQUZEOG53UUFBSGdHQVA0cWNiQWtQaG9XSjF5eXRJUHN4QWZvWEZZLzRUMkZKR2NHTGRtS2pualdnZ0VBCnYvUHNBTktsSEdDbXhJbHJZS3ZaWXQrZjZJUjBtc3dFeXpUaFdDcEVQZ3c9Cj1YRmpLCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0K',
    keys: {
      ecc: {
        publicKey:
          'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tCgp4ak1FWm1kUEtCWUpLd1lCQkFIYVJ3OEJBUWRBN0ZxYW5KblhsUkRSTmlPUFc3WWFxL25DQ2UzcWZzcXUKTEtGNjBlZ2VTL2ZORHp4cGJuaDBRR2x1ZUhRdVkyOXRQc0tNQkJBV0NnQStCWUptWjA4b0JBc0pCd2dKCmtObS8yQUJRL0o4RUF4VUlDZ1FXQUFJQkFoa0JBcHNEQWg0QkZpRUVnQjc4eHJkMG5MbnA5L2FvMmIvWQpBRkQ4bndRQUFJVFpBUUMreDdIV0NWVGk1elNyUlF2eHd2V2d6U0VSV2pBbmdFQ0I4YndaMTRia253RUEKdCtYaWZRZWFLdjhjcjY3b205dzh1NFpVSjV2TkpCM0VhMW9zb21OQUV3ak9PQVJtWjA4b0Vnb3JCZ0VFCkFaZFZBUVVCQVFkQTVqUXBxY2dIT1BzdGdiam5GcVVUek9YU2dqcFUzcWFXRUVLWUU0dlV4MWNEQVFnSAp3bmdFR0JZSUFDb0ZnbVpuVHlnSmtObS8yQUJRL0o4RUFwc01GaUVFZ0I3OHhyZDBuTG5wOS9hbzJiL1kKQUZEOG53UUFBRmVNQVAwVUlKa285WkZoREQrS2Jpb1VmZFpOK0oxNllVT3I5aER1alRqRzIyS3JEd0QrCkxmN3lTVEZIVHdZNENpNVNvL043TjFtLzIzS1BZUmRjTFZTeEN2NGtwd2M9Cj02Z2UvCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0K',
        privateKey:
          'LS0tLS1CRUdJTiBQR1AgUFJJVkFURSBLRVkgQkxPQ0stLS0tLQoKeFZnRVptZFBLQllKS3dZQkJBSGFSdzhCQVFkQTdGcWFuSm5YbFJEUk5pT1BXN1lhcS9uQ0NlM3Fmc3F1CkxLRjYwZWdlUy9jQUFRQ3BHVW9obWl6OFdGa3pwZ3FwZFFjRGl4TTY5Y3kvK05JZCtQWkFpOGNqQWc2UQp6UTg4YVc1NGRFQnBibmgwTG1OdmJUN0NqQVFRRmdvQVBnV0NabWRQS0FRTENRY0lDWkRadjlnQVVQeWYKQkFNVkNBb0VGZ0FDQVFJWkFRS2JBd0llQVJZaEJJQWUvTWEzZEp5NTZmZjJxTm0vMkFCUS9KOEVBQUNFCjJRRUF2c2V4MWdsVTR1YzBxMFVMOGNMMW9NMGhFVm93SjRCQWdmRzhHZGVHNUo4QkFMZmw0bjBIbWlyLwpISyt1Nkp2Y1BMdUdWQ2VielNRZHhHdGFMS0pqUUJNSXgxMEVabWRQS0JJS0t3WUJCQUdYVlFFRkFRRUgKUU9ZMEthbklCemo3TFlHNDV4YWxFOHpsMG9JNlZONm1saEJDbUJPTDFNZFhBd0VJQndBQS8zeUZMRDdiClYwTzBpQSsvMkR0bE1ncU5ndTdoUUc5Q0QraUFzV0J4MXV6UUVQZkNlQVFZRmdnQUtnV0NabWRQS0FtUQoyYi9ZQUZEOG53UUNtd3dXSVFTQUh2ekd0M1NjdWVuMzlxalp2OWdBVVB5ZkJBQUFWNHdBL1JRZ21TajEKa1dFTVA0cHVLaFI5MWszNG5YcGhRNnYyRU82Tk9NYmJZcXNQQVA0dC92SkpNVWRQQmpnS0xsS2o4M3MzCldiL2JjbzloRjF3dFZMRUsvaVNuQnc9PQo9VHE0RQotLS0tLUVORCBQR1AgUFJJVkFURSBLRVkgQkxPQ0stLS0tLQo=',
      },
      kyber: {
        publicKey:
          'HkOuQEtFm6aZY0LCW9k0hOEHiavLgbmchnNguajGkEOtQzB4Ziw3KqEkvnkGLFaWa2semKJbgQp8TxopIyYpqKxNFEMxFzG3V2GJnjS4ndBbP1wJGtJzBVC9+fonZ9V7IYvKCLGQxyZsQzd4ySkQBFqSubYOaRN+rZwQP4w6f9JsdvYyE7Vk7nNzhYt4uMgsm9Ry+3c5ffO5YQwKU+XBeXOPLWljiOOhVYwB3oEy7wccioinEqbFIsFxoLMkg4AIDNmEd7RKKAHHKvnNoBTJROnCRgMGlHt1U7gcbOZgcfYy/PpS2+ypMxwi2JTPCVS9Xxp6AHYcWql08sh0L0d+9CKiwqE0jfdMCHHBvNjEc9dUL2sHZcp9ELyRnBSWlRApldK3TsklwHw6QakIFMJQdRxGKKxuQ6kRk9LLVjVNBxfKqsUd1lPMU1wIK/lDbQkUzlQ3U1xa/XIDYVCskcxZ0NAc/2iUNuR/hIJpe9BvDMjNSCghosk4XrGv5FyaVlAWrqyAUnESaTKL47mGighvJdeVL4galaCI78hrWaxkftW/XoQ1xbibHTOIIHXHYmBIkRO2AhAzF8SsDzE28bla2OMJ98hPaPpRiudL/tmmyyGWL3cHsVko05ONIYB/vEE3Saa/+PVR/3ag31M9cEehKPClbhB+NXAU1JJr37xvUfAymJdb72By4pleCvJ2z/GKHqDFVzBuXtjNUqfMz1ErmJJ42XUf2eQXzTqtD5WvhysrddqesQe8M4cD0ccQ0huRiKlpA7VNBIKGK6QzeJpMy+iXLnACgipbhTAatxiDmlW4PLJe4mdkZfp12cuI6OU9vXgNRfBTZSIMdyMzm4qkTXtZZWymsIurf9yCeVYYENqnzKRuH6VwkOGV1ltttRfN6QBDl+rItACwcjunk9bM4ZI/7+Sr2UMcscCL+sdZ5oXCPlkqLifMqZAFKdl00qYYgqHGirhjEKeKmUGLGxmLo7AGD4p7P5wGaCagIICGnuUge/GaXbs07uBWiDNxlXpU4PIycENaXer+u2W1nZje+Iar5bOdlC0IkAet9XREYkk=',
        privateKey:
          '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',
      },
    },
    bucket: '6fe364ed7c9a3022c1c8decd',
    registerCompleted: true,
    teams: false,
    username: 'jonathandanielarce9@gmail.com',
    bridgeUser: 'jonathandanielarce9@gmail.com',
    sharedWorkspace: false,
    appSumoDetails: null,
    hasReferralsProgram: false,
    backupsBucket: '7642d392264c616acbe62ace',
    avatar: null,
    emailVerified: true,
    lastPasswordChangedAt: '2025-02-17T14:48:24.000Z',
  };

  return {
    getUser: vi.fn(() => user),
  };
});

vi.mock('../event-bus', () => {
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  return {
    default: {
      emit: vi.fn((event, ...args) => listeners[event] && listeners[event].forEach((listener) => listener(...args))),
      on: vi.fn((event, callback) => listeners[event] && listeners[event].push(callback)),
    },
  };
});

vi.mock('@apps/main/analytics/rudderstack-client', () => {
  return {
    client: {
      identify: vi.fn().mockReturnValue(Promise.resolve()),
      track: vi.fn().mockReturnValue(Promise.resolve()),
      page: vi.fn().mockReturnValue(Promise.resolve()),
      alias: vi.fn().mockReturnValue(Promise.resolve()),
      group: vi.fn().mockReturnValue(Promise.resolve()),
      flush: vi.fn().mockReturnValue(Promise.resolve()),
    },
  };
});

vi.mock('electron', async () => {
  const ipcMainHandlers: Record<string, (...args: any[]) => void> = {};
  const actual = await vi.importActual<typeof import('electron')>('electron');
  return {
    ...actual,
    app: {
      ...actual.app,
      getPath: vi.fn(() => '/mock/path'),
      on: vi.fn(),
    },
    ipcMain: {
      on: vi.fn((event, callback) => {
        ipcMainHandlers[event] = callback;
      }),
      emit: vi.fn((event, ...args) => ipcMainHandlers[event] && ipcMainHandlers[event](...args)),
      handle: vi.fn((event, callback) => {
        ipcMainHandlers[event] = callback;
      }),
      invoke: vi.fn((event, ...args) => ipcMainHandlers[event] && ipcMainHandlers[event](...args)),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadFile: vi.fn(),
      webContents: {
        send: vi.fn(),
        on: vi.fn(),
        getOSProcessId: vi.fn().mockReturnValue(1234),
      },
      destroy: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
    })),
    ipcRenderer: {
      on: vi.fn(
        (event, callback) =>
          ipcMainHandlers[event] &&
          ipcMainHandlers[event]({
            sender: {
              send: vi.fn(),
            },
          }),
      ),
      send: vi.fn(
        (event, ...args) =>
          ipcMainHandlers[event] &&
          ipcMainHandlers[event](
            {
              sender: {
                send: vi.fn(),
              },
            },
            ...args,
          ),
      ),
      handle: vi.fn(
        (event, callback) =>
          ipcMainHandlers[event] &&
          ipcMainHandlers[event]({
            sender: {
              send: vi.fn(),
            },
          }),
      ),
      invoke: vi.fn(
        (event, ...args) =>
          ipcMainHandlers[event] &&
          ipcMainHandlers[event]({
            sender: {
              send: vi.fn(),
            },
          }),
      ),
    },
  };
});

vi.mock('@/apps/main/virtual-root-folder/service.ts', () => {
  return {
    getLoggersPaths: vi.fn(() => '/mock/logs'),
    getRootVirtualDrive: vi.fn(() => '/mock/path'),
    getRootWorkspace: vi.fn(() => ({
      logEnginePath: '/mock/logs',
      logWatcherPath: '/mock/logs',
      persistQueueManagerPath: '/mock/logs',
      syncRoot: '/mock/path',
      lastSavedListing: '/mock/logs',
    })),
  };
});
