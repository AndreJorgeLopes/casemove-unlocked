import { ItemRow } from '../interfaces/items';
import { Prices, Settings } from '../interfaces/states';
import { pricing_add_to_requested } from '../store/actions/pricingActions';

export class ConvertPrices {
  settingsData: Settings;
  prices: Prices;

  constructor(settingsData: Settings, prices: Prices) {
    this.settingsData = settingsData;
    this.prices = prices;
  }

  _getName(itemRow: ItemRow) {
    return getPriceKey(itemRow, this.prices?.prices);
  }

  getPrice(itemRow: ItemRow, nanToZero = false) {
    const sourcePrice = sanitizePriceNumber(
      this.prices?.prices?.[this._getName(itemRow)]?.[this.settingsData.source.title],
    );
    const currencyMultiplier = sanitizePriceNumber(
      this.settingsData.currencyPrice?.[this.settingsData.currency],
    );
    const itemPrice = safeMultiply(
      sourcePrice,
      currencyMultiplier,
    );

    if (nanToZero && Number.isNaN(itemPrice)) {
      return 0;
    }

    return itemPrice;
  }

  getPriceWithMultiplier(
    itemRow: ItemRow,
    multiplier: number,
    nanToZero = false,
  ) {
    const itemPrice = this.getPrice(itemRow, nanToZero);
    const totalPrice = safeMultiply(itemPrice, multiplier);

    if (nanToZero && Number.isNaN(totalPrice)) {
      return 0;
    }

    return totalPrice;
  }
}

export class ConvertPricesFormatted extends ConvertPrices {
  constructor(settingsData: Settings, prices: Prices) {
    super(settingsData, prices);
  }

  formatPrice(price: number) {
    const safePrice = sanitizePriceNumber(price, 0);
    return new Intl.NumberFormat(this.settingsData.locale, {
      style: 'currency',
      currency: this.settingsData.currency,
    }).format(safePrice);
  }

  getFormattedPrice(itemRow: ItemRow, nanToZero = false) {
    return this.formatPrice(this.getPrice(itemRow, nanToZero));
  }
  getFormattedPriceCombined(itemRow: ItemRow) {
    const comQty = itemRow?.combined_QTY as number;
    return new Intl.NumberFormat(this.settingsData.locale, {
      style: 'currency',
      currency: this.settingsData.currency,
    }).format(this.getPriceWithMultiplier(itemRow, comQty, true));
  }
}

async function requestPrice(priceToGet: Array<ItemRow>) {
  window.electron.ipcRenderer.getPrice(priceToGet);
}

const MAX_SAFE_PRICE = Number.MAX_SAFE_INTEGER;

function clampPrice(value: number) {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  if (value > MAX_SAFE_PRICE) {
    return MAX_SAFE_PRICE;
  }

  if (value < -MAX_SAFE_PRICE) {
    return -MAX_SAFE_PRICE;
  }

  return value;
}

export function sanitizePriceNumber(
  value?: number | string,
  fallback: number = Number.NaN,
) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampPrice(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clampPrice(parsed);
    }
  }

  return fallback;
}

export function safeAdd(valueOne?: number, valueTwo?: number) {
  const parsedOne = sanitizePriceNumber(valueOne);
  const parsedTwo = sanitizePriceNumber(valueTwo);
  if (Number.isNaN(parsedOne) || Number.isNaN(parsedTwo)) {
    return Number.NaN;
  }

  return clampPrice(parsedOne + parsedTwo);
}

export function safeMultiply(valueOne?: number, valueTwo?: number) {
  const parsedOne = sanitizePriceNumber(valueOne);
  const parsedTwo = sanitizePriceNumber(valueTwo);
  if (Number.isNaN(parsedOne) || Number.isNaN(parsedTwo)) {
    return Number.NaN;
  }

  return clampPrice(parsedOne * parsedTwo);
}

export function safeDivide(
  valueOne?: number,
  valueTwo?: number,
  fallback: number = Number.NaN,
) {
  const parsedOne = sanitizePriceNumber(valueOne);
  const parsedTwo = sanitizePriceNumber(valueTwo);

  if (
    Number.isNaN(parsedOne) ||
    Number.isNaN(parsedTwo) ||
    parsedTwo === 0
  ) {
    return fallback;
  }

  return clampPrice(parsedOne / parsedTwo);
}

export function safePercent(
  value?: number,
  total?: number,
  fallback: number = 0,
) {
  const ratio = safeDivide(value, total, Number.NaN);
  const percent = safeMultiply(ratio, 100);
  if (Number.isNaN(percent)) {
    return fallback;
  }

  return percent;
}

export function getPriceKey(itemRow: ItemRow, prices?: Prices['prices']) {
  const baseName = itemRow?.item_name?.replaceAll('(Holo/Foil)', '(Holo-Foil)');
  const hasWear =
    itemRow?.item_wear_name !== undefined && itemRow?.item_wear_name !== '';
  const wearName = hasWear
    ? `${baseName} (${itemRow.item_wear_name})`
    : baseName;

  if (prices?.[wearName]) {
    return wearName;
  }

  if (prices?.[baseName]) {
    return baseName;
  }

  return wearName || baseName || '';
}

async function dispatchRequested(
  dispatch: Function,
  rowsToGet: Array<ItemRow>,
) {
  dispatch(pricing_add_to_requested(rowsToGet));
}

export class RequestPrices extends ConvertPrices {
  dispatch: Function;
  constructor(dispatch: Function, settingsData: Settings, prices: Prices) {
    super(settingsData, prices);
    this.dispatch = dispatch;
  }

  _checkRequested(itemRow: ItemRow): boolean {
    return (
      this.prices.productsRequested.includes(this._getName(itemRow)) == false
    );
  }

  handleRequested(itemRow: ItemRow): void {
    if (
      isNaN(this.getPrice(itemRow)) == true &&
      this._checkRequested(itemRow)
    ) {
      const rowsToSend = [itemRow];
      requestPrice(rowsToSend);
      dispatchRequested(this.dispatch, rowsToSend);
    }
  }

  handleRequestArray(itemRows: Array<ItemRow>): void {
    const rowsToSend = [] as Array<ItemRow>;
    itemRows.forEach((itemRow) => {
      if (
        isNaN(this.getPrice(itemRow)) == true &&
        this._checkRequested(itemRow)
      ) {
        rowsToSend.push(itemRow);
      }
    });
    if (rowsToSend.length > 0) {
      requestPrice(rowsToSend);
      dispatchRequested(this.dispatch, rowsToSend);
    }
  }
}
