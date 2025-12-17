/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { IElectronAPI } from './src/apps/main/interface';
// Mock @internxt/drive-desktop-core backend logger
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));
// Type-safe deep mock creator that recursively mocks all properties
type DeepMock<T> = T extends (...args: any[]) => any
  ? ReturnType<typeof vi.fn>
  : T extends object
  ? { [K in keyof T]: DeepMock<T[K]> }
  : T;

function createTypedMock<T extends object>(): DeepMock<T> {
  return new Proxy({} as any, {
    get: (target: any, prop: string | symbol) => {
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch') {
        return undefined;
      }

      if (!target[prop]) {
        // All leaf properties should be mock functions
        // Nested objects (like antivirus, devices) should be Proxies with mock function properties
        target[prop] = vi.fn();

        // Add a Proxy to support nested property access (e.g., antivirus.isAvailable)
        const nestedProxy = new Proxy(target[prop], {
          get: (fnTarget: any, nestedProp: string | symbol) => {
            // Return existing properties of the function itself (like mockReturnValue, etc.)
            if (nestedProp in fnTarget) {
              return fnTarget[nestedProp];
            }
            // For nested API properties, create mock functions
            if (!fnTarget[nestedProp]) {
              fnTarget[nestedProp] = vi.fn();
            }
            return fnTarget[nestedProp];
          },
        });

        target[prop] = nestedProxy;
      }
      return target[prop];
    },
  }) as DeepMock<T>;
}

// Setup global window.electron mock with type safety
// TypeScript will now enforce that only valid IElectronAPI properties are accessed
global.window = global.window || {};
global.window.electron = createTypedMock<IElectronAPI>();

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock @headlessui/react components
vi.mock('@headlessui/react', () => {
  const React = require('react');

  const Dialog = function (props: any) {
    return props.children;
  };

  Dialog.Overlay = function (props: any) {
    return React.createElement('div', {
      className: props.className,
      'data-testid': 'dialog-overlay',
    });
  };

  Dialog.Title = function (props: any) {
    return React.createElement('div', props, props.children);
  };

  const Transition = function (props: any) {
    return props.show !== false ? props.children : null;
  };

  Transition.Child = function (props: any) {
    return props.children;
  };

  const Menu = function (props: any) {
    return React.createElement(
      props.as || 'div',
      { className: props.className },
      props.children
    );
  };

  Menu.Button = function (props: any) {
    return React.createElement('div', props, props.children);
  };

  Menu.Items = function (props: any) {
    return React.createElement('div', props, props.children);
  };

  Menu.Item = function (props: any) {
    return props.children({ active: false });
  };

  const Fragment = function (props: any) {
    return props.children;
  };

  return {
    Dialog,
    Transition,
    Menu,
    Fragment,
  };
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
