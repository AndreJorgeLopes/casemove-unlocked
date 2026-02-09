import {
  ConvertPrices,
  getPriceKey,
} from '../renderer/functionsClasses/prices';
import { ItemRow } from '../renderer/interfaces/items';
import { Prices, Settings } from '../renderer/interfaces/states';

const baseSettings: Settings = {
  fastMove: false,
  theme: 'dark',
  currency: 'USD',
  locale: 'en-US',
  steamLoginShow: false,
  os: 'linux',
  devmode: false,
  columns: [],
  currencyPrice: { USD: 1 },
  source: {
    title: 'steam_listing',
    avatar: '',
    name: 'Steam',
  },
  overview: {
    by: 'price',
    chartleft: 'overall',
    chartRight: 'itemDistribution',
  },
};

const baseItemRow: ItemRow = {
  item_name: 'AK-47',
  item_customname: '',
  item_url: '',
  item_id: '1',
  position: 0,
  item_wear_name: 'Factory New',
  item_paint_wear: 0.1,
  item_origin: 0,
  item_moveable: true,
  item_has_stickers: false,
  equipped_ct: false,
  equipped_t: false,
  def_index: 0,
  stickers: [],
  rarity: 0,
  rarityName: '',
  tradeUp: false,
  stattrak: false,
  tradeUpConfirmed: false,
  collection: '',
  combined_ids: [],
  combined_QTY: 1,
  bgColorClass: '',
  category: '',
  major: '',
  storage_id: '',
  item_storage_total: 0,
  percentage: 0,
};

const createItemRow = (overrides: Partial<ItemRow> = {}) => ({
  ...baseItemRow,
  ...overrides,
});

const createPrices = (pricesMap: Record<string, Record<string, number>>) =>
  ({
    prices: pricesMap,
    storageAmount: 0,
    productsRequested: [],
  }) as unknown as Prices;

describe('pricing helpers', () => {
  it('normalizes wear-based keys and prefers the wear key when available', () => {
    const prices = createPrices({
      'AK-47 (Factory New)': { steam_listing: 10 },
    });
    const itemRow = createItemRow({
      item_name: 'AK-47',
      item_wear_name: 'Factory New',
    });

    expect(getPriceKey(itemRow, prices.prices)).toBe('AK-47 (Factory New)');
  });

  it('falls back to base name when wear key is missing', () => {
    const prices = createPrices({
      'AK-47': { steam_listing: 12 },
    });
    const itemRow = createItemRow({
      item_name: 'AK-47',
      item_wear_name: 'Factory New',
    });

    expect(getPriceKey(itemRow, prices.prices)).toBe('AK-47');
  });

  it('clamps getPrice to MAX_SAFE_INTEGER on overflow', () => {
    const prices = createPrices({
      'AK-47 (Factory New)': { steam_listing: Number.MAX_SAFE_INTEGER },
    });
    const settings = {
      ...baseSettings,
      currencyPrice: { USD: 2 },
    };
    const converter = new ConvertPrices(settings, prices);
    const itemRow = createItemRow({
      item_name: 'AK-47',
      item_wear_name: 'Factory New',
    });

    expect(converter.getPrice(itemRow)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('clamps getPriceWithMultiplier to MAX_SAFE_INTEGER on overflow', () => {
    const prices = createPrices({
      'AK-47 (Factory New)': { steam_listing: 10 },
    });
    const converter = new ConvertPrices(baseSettings, prices);
    const itemRow = createItemRow({
      item_name: 'AK-47',
      item_wear_name: 'Factory New',
    });

    expect(
      converter.getPriceWithMultiplier(itemRow, Number.MAX_SAFE_INTEGER),
    ).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('returns zero when nanToZero is set and price is missing', () => {
    const prices = createPrices({});
    const converter = new ConvertPrices(baseSettings, prices);
    const itemRow = createItemRow({
      item_name: 'AK-47',
      item_wear_name: 'Factory New',
    });

    expect(converter.getPrice(itemRow, true)).toBe(0);
  });
});
