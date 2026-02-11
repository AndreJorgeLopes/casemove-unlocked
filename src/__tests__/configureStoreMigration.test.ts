import { sanitizePersistedState } from '../renderer/store/configureStore';

describe('sanitizePersistedState', () => {
  it('returns empty object for null persisted state', () => {
    expect(sanitizePersistedState(null)).toEqual({});
  });

  it('returns non-object values unchanged', () => {
    expect(sanitizePersistedState('legacy-state')).toBe('legacy-state');
  });

  it('coerces nullable persisted slices to iterable-safe contracts', () => {
    const sanitized = sanitizePersistedState({
      settingsReducer: {
        columns: null,
        currencyPrice: null,
        source: null,
        overview: null,
      },
      tradeUpReducer: {
        tradeUpProducts: null,
        tradeUpProductsIDS: null,
        possibleOutcomes: null,
        collections: null,
        options: null,
      },
      inventoryFiltersReducer: {
        inventoryFilter: null,
        storageFilter: null,
        inventoryFiltered: null,
        storageFiltered: null,
        categoryFilter: null,
        rarityFilter: null,
      },
      inventoryReducer: {
        inventory: null,
        combinedInventory: null,
        storageInventory: null,
        storageInventoryRaw: null,
        itemsLookUp: null,
      },
      moveFromReducer: {
        activeStorages: null,
        totalToMove: null,
      },
      moveToReducer: {
        activeStorages: null,
        totalToMove: null,
      },
      modalMoveReducer: {
        storageIdsToClearFrom: null,
        doCancel: null,
        query: null,
        modalPayload: null,
      },
      modalTradeReducer: {
        inventoryFirst: null,
        rowToMatch: null,
      },
      pricingReducer: {
        prices: null,
        productsRequested: null,
      },
    });

    expect(sanitized.settingsReducer.columns).toEqual([
      'Price',
      'Stickers/patches',
      'Storage',
      'Tradehold',
      'Moveable',
      'Inventory link',
    ]);
    expect(sanitized.settingsReducer.currencyPrice).toEqual({});
    expect(sanitized.settingsReducer.source).toEqual({
      title: 'steam_listing',
      name: 'Steam Community Market',
      avatar: 'https://steamcommunity.com/favicon.ico',
    });
    expect(sanitized.settingsReducer.overview).toEqual({
      by: 'price',
      chartleft: 'overall',
      chartRight: 'itemDistribution',
    });
    expect(Array.isArray(sanitized.tradeUpReducer.tradeUpProducts)).toBe(true);
    expect(sanitized.tradeUpReducer.options).toEqual(['Hide equipped']);
    expect(Array.isArray(sanitized.inventoryFiltersReducer.inventoryFilter)).toBe(
      true,
    );
    expect(Array.isArray(sanitized.inventoryReducer.inventory)).toBe(true);
    expect(Array.isArray(sanitized.moveFromReducer.activeStorages)).toBe(true);
    expect(Array.isArray(sanitized.moveToReducer.totalToMove)).toBe(true);
    expect(Array.isArray(sanitized.modalMoveReducer.query)).toBe(true);
    expect(Array.isArray(sanitized.modalTradeReducer.inventoryFirst)).toBe(true);
    expect(typeof sanitized.pricingReducer.prices).toBe('object');
    expect(Array.isArray(sanitized.pricingReducer.productsRequested)).toBe(true);
  });

  it('keeps valid user values while filling missing contracts', () => {
    const originalState = {
      settingsReducer: {
        columns: ['Price'],
        currencyPrice: { EUR: 0.93 },
      },
      tradeUpReducer: {
        tradeUpProducts: [{ item_id: '123' }],
      },
      pricingReducer: {
        prices: { AK47: 3.21 },
        productsRequested: ['AK47'],
      },
    };

    const sanitized = sanitizePersistedState(originalState);

    expect(sanitized.settingsReducer.columns).toEqual(['Price']);
    expect(sanitized.settingsReducer.currencyPrice).toEqual({ EUR: 0.93 });
    expect(sanitized.tradeUpReducer.tradeUpProducts).toEqual([
      { item_id: '123' },
    ]);
    expect(sanitized.pricingReducer.prices).toEqual({ AK47: 3.21 });
    expect(sanitized.pricingReducer.productsRequested).toEqual(['AK47']);
    expect(originalState).toEqual({
      settingsReducer: {
        columns: ['Price'],
        currencyPrice: { EUR: 0.93 },
      },
      tradeUpReducer: {
        tradeUpProducts: [{ item_id: '123' }],
      },
      pricingReducer: {
        prices: { AK47: 3.21 },
        productsRequested: ['AK47'],
      },
    });
  });
});
