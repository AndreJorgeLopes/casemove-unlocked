import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from '../renderer/App';
import configureStore from '../renderer/store/configureStore';

type MockFunction = jest.Mock<unknown, unknown[]>;
type ElectronWindow = Window & {
  electron: {
    ipcRenderer: Record<string, MockFunction>;
    store: {
      get: MockFunction;
      set: MockFunction;
    };
  };
};

const createIpcRendererMock = () =>
  new Proxy<Record<string, MockFunction>>(
    {},
    {
      get: (target, prop) => {
        const key = String(prop);
        if (!target[key]) {
          target[key] = jest.fn().mockResolvedValue(undefined);
        }
        return target[key];
      },
    },
  );

const setupElectronMock = () => {
  const electronWindow = window as unknown as ElectronWindow;
  const ipcRenderer = createIpcRendererMock();
  ipcRenderer.userEvents = jest.fn().mockResolvedValue({ command: 'noop' });
  ipcRenderer.needUpdate = jest
    .fn()
    .mockResolvedValue({ currentVersion: '0.0.0', requireUpdate: false });
  ipcRenderer.on = jest.fn();
  ipcRenderer.once = jest.fn();
  electronWindow.electron = {
    ipcRenderer,
    store: {
      get: jest.fn().mockResolvedValue([]),
      set: jest.fn().mockResolvedValue(undefined),
    },
  };
};

describe('App', () => {
  beforeEach(() => {
    setupElectronMock();
  });

  it('should render', () => {
    const { reduxStore } = configureStore();
    expect(
      render(
        <Provider store={reduxStore}>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </Provider>,
      ),
    ).toBeTruthy();
  });
});
