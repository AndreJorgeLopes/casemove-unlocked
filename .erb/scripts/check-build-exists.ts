import { TextDecoder, TextEncoder } from 'util';

global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;

const ipcRenderer = new Proxy(
  {} as Record<string, (...args: unknown[]) => unknown>,
  {
    get: (_target, prop) => {
      if (prop === 'userEvents') {
        return () => Promise.resolve({ command: '' });
      }
      if (prop === 'needUpdate') {
        return () => Promise.resolve(false);
      }
      return () => Promise.resolve(undefined);
    },
  },
);

const electronMock = {
  ipcRenderer,
  store: {
    get: () => Promise.resolve(undefined),
  },
};

Object.defineProperty(window, 'electron', {
  value: electronMock,
  writable: true,
});
