import { sanitizePersistedState } from '../renderer/store/configureStore';

describe('sanitizePersistedState', () => {
  it('returns empty object for null persisted state', () => {
    expect(sanitizePersistedState(null)).toEqual({});
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

    expect(Array.isArray(sanitized.settingsReducer.columns)).toBe(true);
    expect(typeof sanitized.settingsReducer.currencyPrice).toBe('object');
    expect(Array.isArray(sanitized.tradeUpReducer.tradeUpProducts)).toBe(true);
    expect(Array.isArray(sanitized.tradeUpReducer.options)).toBe(true);
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
});

