import {
  setColumns,
  setCurrencyRate,
  setCurrencyValue,
  setDevmode,
  setFastMove,
  setLocale,
  setOS,
  setSourceValue,
  setSteamLoginShow,
  setTheme,
} from '../../../renderer/store/actions/settings';
import {
  DispatchIPCBuildingObject,
  DispatchIPCHandleBuildingOptionsClass,
  DispatchStoreBuildingObject,
  DispatchStoreHandleBuildingOptionsClass,
} from '../../../shared/Interfaces.tsx/login';

function getElectronBridge() {
  if (window.electron?.ipcRenderer && window.electron?.store) {
    return window.electron;
  }

  throw new Error(
    'Electron preload bridge is unavailable. Ensure preload loaded and contextIsolation is enabled.',
  );
}

export class IPCCommunication {
  ipc = getElectronBridge().ipcRenderer;
  store = getElectronBridge().store;

  async get(command: Function) {
    return await command().then((returnValue) => {
      return returnValue;
    });
  }
  async storeGet(settingToGet: string) {
    return await this.store.get(settingToGet).then((returnValue) => {
      return returnValue;
    });
  }
}

// Dispatch Store
export class DispatchStore extends IPCCommunication {
  dispatch: Function;
  buildingObject: DispatchStoreHandleBuildingOptionsClass = {
    source: {
      name: 'pricing.source',
      action: setSourceValue,
    },
    locale: {
      name: 'locale',
      action: setLocale
    },
    os: {
      name: 'os',
      action: setOS
    },
    columns: {
      name: 'columns',
      action: setColumns
    },
    devmode: {
      name: 'devmode.value',
      action: setDevmode
    },
    fastmove: {
      name: 'fastmove',
      action: setFastMove
    },
    theme: {
      name: 'theme',
      action: setTheme
    },
    currency: {
      name: 'currency',
      action: setCurrencyValue
    },
    steamLoginShow: {
      name: 'steamLogin',
      action: setSteamLoginShow
    }
  };
  constructor(dispatch: Function) {
    super();
    this.dispatch = dispatch;
  }

  async run(buildingObject: DispatchStoreBuildingObject) {
    this.storeGet(buildingObject.name).then((returnValue) => {
      if (returnValue != undefined) {
        this.dispatch(buildingObject.action(returnValue));
      }
    });
  }
}

// Dispatch IPC
export class DispatchIPC extends IPCCommunication {
  dispatch: Function;
  buildingObject: DispatchIPCHandleBuildingOptionsClass = {
    currency: {
      endpoint: this.ipc.getCurrencyRate,
      action: setCurrencyRate,
    },
  };

  constructor(dispatch: Function) {
    super();
    this.dispatch = dispatch;
  }

  async run(buildingObject: DispatchIPCBuildingObject) {
    this.get(buildingObject.endpoint).then((returnValue) => {
      if (returnValue != undefined) {
        this.dispatch(buildingObject.action(returnValue));
      }
    });
  }
}
