import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
// eslint-disable-next-line import/no-unresolved
import { VibeKanbanWebCompanion } from 'vibe-kanban-web-companion';
import { PersistGate } from 'redux-persist/integration/react';
import returnVar from './store/configureStore';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import React from 'react';

const myVar = returnVar();

declare global {
  interface Window {
    electron: {
      store: {
        getThemeSync?: () => 'dark' | 'light';
        get: (key: string) => any;
        set: (key: string, val: any) => void;
        // any other methods you've defined...
      };
      ipcRenderer: any;
    };
  }
}

const container = document.getElementById('root');
if (container != null) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Router>
        <Provider store={myVar.reduxStore}>
          <PersistGate loading={null} persistor={myVar.persistor}>
            <App />
            <VibeKanbanWebCompanion />
          </PersistGate>
        </Provider>
      </Router>
    </React.StrictMode>,
  );
}
