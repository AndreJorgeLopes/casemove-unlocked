import { Settings } from "../../../renderer/interfaces/states";

const initialState: Settings = {
  fastMove: false,
  theme: 'dark',
  currency: 'USD',
  locale: 'EN-GB',
  os: '',
  steamLoginShow: true,
  devmode: false,
  columns: ["Price", "Stickers/patches", "Storage", "Tradehold", 'Moveable', 'Inventory link'],
  currencyPrice: {},
  source: {
    title: 'steam_listing',
    name: 'Steam Community Market',
    avatar: 'https://steamcommunity.com/favicon.ico'
  },
  overview: {
    by: 'price',
    chartleft: 'overall',
    chartRight: 'itemDistribution'
  }
};

function normalizeState(state: Settings = initialState): Settings {
  return {
    ...initialState,
    ...state,
    columns: Array.isArray(state?.columns) ? state.columns : initialState.columns,
    currencyPrice:
      state?.currencyPrice && typeof state.currencyPrice === 'object'
        ? state.currencyPrice
        : initialState.currencyPrice,
    source:
      state?.source && typeof state.source === 'object'
        ? state.source
        : initialState.source,
    overview:
      state?.overview && typeof state.overview === 'object'
        ? state.overview
        : initialState.overview,
  };
}

const settingsReducer = (state = initialState, action) => {
  const safeState = normalizeState(state);
  switch (action.type) {
    case 'SETTINGS_SET_FASTMOVE':
      return {
        ...safeState,
        fastMove: action.payload,
      };
    case 'SETTINGS_SET_THEME':
      return {
        ...safeState,
        theme: action.payload,
      };
    case 'SETTINGS_SET_COLUMNS':
      return {
        ...safeState,
        columns: action.payload,
      };
    case 'SETTINGS_SET_CURRENCY':
      if (action.payload == true) {
        return {
          ...safeState
        }
      }
      return {
        ...safeState,
        currency: action.payload,
      };

    case 'SETTINGS_SET_STEAMLOGINSHOW':
      return {
        ...safeState,
        steamLoginShow: action.payload,
      };

    case 'SETTINGS_SET_SOURCE':
      return {
        ...safeState,
        source: action.payload,
      };
      case 'SETTINGS_SET_LOCALE':
      return {
        ...safeState,
        locale: action.payload,
      };
      case 'SETTINGS_SET_OS':
      return {
        ...safeState,
        os: action.payload,
      };
      case 'SETTINGS_SET_DEVMODE':
      return {
        ...safeState,
        devmode: action.payload,
      };
      case 'SETTINGS_SET_OVERVIEW':
        return {
          ...safeState,
          overview: action.payload,
        };
      case 'SETTINGS_ADD_CURRENCYPRICE':
        const currencyDict = { ...safeState.currencyPrice }
        currencyDict[action.payload.currency] = action.payload.rate
      return {
        ...safeState,
        currency: action.payload.currency,
        currencyPrice: currencyDict,
      };

    default:
      return { ...safeState };
  }
};

export default settingsReducer;
