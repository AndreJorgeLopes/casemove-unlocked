// configureStore.js

import { createStore } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import rootReducers from './reducer'

function isObject(value: any) {
  return value != null && typeof value == 'object' && !Array.isArray(value)
}

function ensureArray(value: any, fallback: any[] = []) {
  return Array.isArray(value) ? value : fallback
}

function ensureObject(value: any, fallback: Record<string, any> = {}) {
  return isObject(value) ? value : fallback
}

function sanitizePersistedState(state: any) {
  if (state == null) {
    return {}
  }
  if (!isObject(state)) {
    return state
  }

  const nextState = { ...state } as any

  const settingsReducer = ensureObject(nextState.settingsReducer)
  nextState.settingsReducer = {
    ...settingsReducer,
    columns: ensureArray(settingsReducer.columns, [
      'Price',
      'Stickers/patches',
      'Storage',
      'Tradehold',
      'Moveable',
      'Inventory link',
    ]),
    currencyPrice: ensureObject(settingsReducer.currencyPrice),
    source: ensureObject(settingsReducer.source, {
      title: 'steam_listing',
      name: 'Steam Community Market',
      avatar: 'https://steamcommunity.com/favicon.ico',
    }),
    overview: ensureObject(settingsReducer.overview, {
      by: 'price',
      chartleft: 'overall',
      chartRight: 'itemDistribution',
    }),
  }

  const tradeUpReducer = ensureObject(nextState.tradeUpReducer)
  nextState.tradeUpReducer = {
    ...tradeUpReducer,
    tradeUpProducts: ensureArray(tradeUpReducer.tradeUpProducts),
    tradeUpProductsIDS: ensureArray(tradeUpReducer.tradeUpProductsIDS),
    possibleOutcomes: ensureArray(tradeUpReducer.possibleOutcomes),
    collections: ensureArray(tradeUpReducer.collections),
    options: ensureArray(tradeUpReducer.options, ['Hide equipped']),
  }

  const inventoryFiltersReducer = ensureObject(nextState.inventoryFiltersReducer)
  nextState.inventoryFiltersReducer = {
    ...inventoryFiltersReducer,
    inventoryFilter: ensureArray(inventoryFiltersReducer.inventoryFilter, [
      {
        include: true,
        label: 'Storage moveable',
        valueToCheck: 'item_moveable',
        commandType: 'checkBooleanVariable',
      },
    ]),
    storageFilter: ensureArray(inventoryFiltersReducer.storageFilter),
    inventoryFiltered: ensureArray(inventoryFiltersReducer.inventoryFiltered),
    storageFiltered: ensureArray(inventoryFiltersReducer.storageFiltered),
    categoryFilter: ensureArray(inventoryFiltersReducer.categoryFilter),
    rarityFilter: ensureArray(inventoryFiltersReducer.rarityFilter),
  }

  const inventoryReducer = ensureObject(nextState.inventoryReducer)
  nextState.inventoryReducer = {
    ...inventoryReducer,
    inventory: ensureArray(inventoryReducer.inventory),
    combinedInventory: ensureArray(inventoryReducer.combinedInventory),
    storageInventory: ensureArray(inventoryReducer.storageInventory),
    storageInventoryRaw: ensureArray(inventoryReducer.storageInventoryRaw),
    itemsLookUp: ensureObject(inventoryReducer.itemsLookUp),
  }

  const moveFromReducer = ensureObject(nextState.moveFromReducer)
  nextState.moveFromReducer = {
    ...moveFromReducer,
    activeStorages: ensureArray(moveFromReducer.activeStorages),
    totalToMove: ensureArray(moveFromReducer.totalToMove),
  }

  const moveToReducer = ensureObject(nextState.moveToReducer)
  nextState.moveToReducer = {
    ...moveToReducer,
    activeStorages: ensureArray(moveToReducer.activeStorages),
    totalToMove: ensureArray(moveToReducer.totalToMove),
  }

  const modalMoveReducer = ensureObject(nextState.modalMoveReducer)
  nextState.modalMoveReducer = {
    ...modalMoveReducer,
    storageIdsToClearFrom: ensureArray(modalMoveReducer.storageIdsToClearFrom),
    doCancel: ensureArray(modalMoveReducer.doCancel),
    query: ensureArray(modalMoveReducer.query),
    modalPayload: ensureObject(modalMoveReducer.modalPayload, {
      number: 0,
      itemID: '',
      isLast: false,
    }),
  }

  const modalTradeReducer = ensureObject(nextState.modalTradeReducer)
  nextState.modalTradeReducer = {
    ...modalTradeReducer,
    inventoryFirst: ensureArray(modalTradeReducer.inventoryFirst),
    rowToMatch: ensureObject(modalTradeReducer.rowToMatch),
  }

  const pricingReducer = ensureObject(nextState.pricingReducer)
  nextState.pricingReducer = {
    ...pricingReducer,
    prices: ensureObject(pricingReducer.prices),
    productsRequested: ensureArray(pricingReducer.productsRequested),
  }

  return nextState
}

const persistConfig = {
  key: 'root',
  storage,
  migrate: (state) => Promise.resolve(sanitizePersistedState(state)),
}

const persistedReducer = persistReducer(persistConfig, rootReducers)

export default () => {
  let reduxStore = createStore(persistedReducer)
  if (process.env.NODE_ENV === 'development') {
    reduxStore = createStore(persistedReducer,
      // @ts-ignore
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
  }
  
  const persistor = persistStore(reduxStore)
  return { reduxStore, persistor }
}
