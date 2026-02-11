import settingsReducer from '../renderer/store/reducer/settings';
import tradeUpReducer from '../renderer/store/reducer/tradeupReducer';

describe('Reducer null-safety for persisted state corruption', () => {
  it('settingsReducer repairs nullable iterable/object fields on unknown action', () => {
    const state = settingsReducer(
      {
        columns: null,
        currencyPrice: null,
        source: null,
        overview: null,
      } as any,
      { type: 'UNKNOWN_ACTION' } as any,
    );

    expect(state.columns).toEqual([
      'Price',
      'Stickers/patches',
      'Storage',
      'Tradehold',
      'Moveable',
      'Inventory link',
    ]);
    expect(state.currencyPrice).toEqual({});
    expect(state.source).toEqual({
      title: 'steam_listing',
      name: 'Steam Community Market',
      avatar: 'https://steamcommunity.com/favicon.ico',
    });
    expect(state.overview).toEqual({
      by: 'price',
      chartleft: 'overall',
      chartRight: 'itemDistribution',
    });
  });

  it('settingsReducer can add currency rates when currencyPrice is null', () => {
    const state = settingsReducer(
      { currencyPrice: null } as any,
      {
        type: 'SETTINGS_ADD_CURRENCYPRICE',
        payload: { currency: 'USD', rate: 1.25 },
      } as any,
    );

    expect(state.currency).toBe('USD');
    expect(state.currencyPrice).toEqual({ USD: 1.25 });
  });

  it('tradeUpReducer can add item when persisted arrays are null', () => {
    const payload = { item_id: 'item-1' } as any;
    const state = tradeUpReducer(
      {
        tradeUpProducts: null,
        tradeUpProductsIDS: null,
        possibleOutcomes: null,
      } as any,
      {
        type: 'TRADEUP_ADD_REMOVE',
        payload,
      } as any,
    );

    expect(state.tradeUpProducts).toEqual([payload]);
    expect(state.tradeUpProductsIDS).toEqual(['item-1']);
    expect(state.possibleOutcomes).toEqual([]);
  });

  it('tradeUpReducer can toggle collections and options when persisted arrays are null', () => {
    const withCollection = tradeUpReducer(
      { collections: null } as any,
      {
        type: 'TRADEUP_ADDREMOVE_COLLECTION',
        payload: 'The Dust Collection',
      } as any,
    );
    expect(withCollection.collections).toEqual(['The Dust Collection']);

    const withOption = tradeUpReducer(
      { options: null } as any,
      {
        type: 'TRADEUP_ADDREMOVE_OPTION',
        payload: 'Include stattrak',
      } as any,
    );
    expect(withOption.options).toContain('Hide equipped');
    expect(withOption.options).toContain('Include stattrak');
  });
});
