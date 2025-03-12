/* eslint-disable */
require('@testing-library/jest-dom');

global.window = global.window || {};
global.window.electron = {
  antivirus: {
    onScanProgress: jest.fn(),
    removeScanProgressListener: jest.fn(),
    isAvailable: jest.fn(),
    addItemsToScan: jest.fn(),
    scanItems: jest.fn(),
    removeInfectedFiles: jest.fn(),
    cancelScan: jest.fn(),
  },
  ipc: {
    invoke: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock @headlessui/react components
jest.mock('@headlessui/react', () => {
  const React = require('react');

  const Dialog = function (props) {
    return props.children;
  };

  Dialog.Overlay = function (props) {
    return React.createElement('div', {
      className: props.className,
      'data-testid': 'dialog-overlay',
    });
  };

  Dialog.Title = function (props) {
    return React.createElement('div', props, props.children);
  };

  const Transition = function (props) {
    return props.show !== false ? props.children : null;
  };

  Transition.Child = function (props) {
    return props.children;
  };

  const Menu = function (props) {
    return React.createElement(
      props.as || 'div',
      { className: props.className },
      props.children
    );
  };

  Menu.Button = function (props) {
    return React.createElement('div', props, props.children);
  };

  Menu.Items = function (props) {
    return React.createElement('div', props, props.children);
  };

  Menu.Item = function (props) {
    return props.children({ active: false });
  };

  const Fragment = function (props) {
    return props.children;
  };

  return {
    Dialog,
    Transition,
    Menu,
    Fragment,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});
