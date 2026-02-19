import { getValue, setValue } from './settings';
import axios from 'axios';
import EventEmitter from 'events';
import dotenv from 'dotenv';
dotenv.config()

class MyEmitter extends EventEmitter {}
export const pricingEmitter = new MyEmitter();

const PRICE_PLACEHOLDER_THRESHOLD = Number.MAX_VALUE / 1024;
const MAX_REASONABLE_MARKET_PRICE = 10000000;

function normalizeProviderPrice(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  if (Math.abs(value) >= PRICE_PLACEHOLDER_THRESHOLD) {
    return 0;
  }

  if (Math.abs(value) > MAX_REASONABLE_MARKET_PRICE) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Get latest prices, if fail use backup

export async function getPricesBackup(cas) {
  const pricesBackup = require('./backup/prices.json');
  cas.setPricing(pricesBackup);
}
export async function getPrices(cas) {
  const url = 'https://cdn.skinledger.com/casemove/prices.json';
  axios
    .get(url)
    .then(function (response) {
      console.log(
        'prices, response',
        typeof response === 'object',
        response !== null
      );
      if (typeof response === 'object' && response !== null) {
        cas.setPricing(response.data, 'normal');
      } else {
        getPricesBackup(cas);
      }
    })
    .catch(function (error) {
      console.log('Error prices', error);
      getPricesBackup(cas);
    });
}

export const currencyCodes = {
  1: 'USD',
  2: 'GBP',
  3: 'EUR',
  4: 'CHF',
  5: 'RUB',
  6: 'PLN',
  7: 'BRL',
  8: 'JPY',
  9: 'NOK',
  10: 'IDR',
  11: 'MYR',
  12: 'PHP',
  13: 'SGD',
  14: 'THB',
  15: 'VND',
  16: 'KRW',
  17: 'TRY',
  18: 'UAH',
  19: 'MXN',
  20: 'CAD',
  21: 'AUD',
  22: 'NZD',
  23: 'CNY',
  24: 'INR',
  25: 'CLP',
  26: 'PEN',
  27: 'COP',
  28: 'ZAR',
  29: 'HKD',
  30: 'TWD',
  31: 'SAR',
  32: 'AED',
  33: 'SEK',
  34: 'ARS',
  35: 'ILS',
  36: 'BYN',
  37: 'KZT',
  38: 'KWD',
  39: 'QAR',
  40: 'CRC',
  41: 'UYU',
  42: 'BGN',
  43: 'HRK',
  44: 'CZK',
  45: 'DKK',
  46: 'HUF',
  47: 'RON',
};

// import { DOMParser } from 'xmldom'
// RUN PROGRAMS
export class runItems {
  steamUser;
  seenItems;
  packageToSend;
  header;
  currency;
  headers;
  prices;

  constructor(steamUser) {
    this.steamUser = steamUser;
    this.seenItems = {};
    this.packageToSend = {};
    getPrices(this);
    getValue('pricing.currency').then((returnValue) => {
      if (returnValue == undefined) {
        setValue('pricing.currency', currencyCodes[steamUser.wallet.currency]);
      }
    });
  }
  async setPricing(pricingData, commandFrom) {
    console.log('pricingSet', commandFrom);
    this.prices = pricingData;
  }
  async makeSinglerequest(itemRow) {
    const baseName = itemRow.item_name.replaceAll(
      '(Holo/Foil)',
      '(Holo-Foil)'
    );
    const hasWear =
      itemRow.item_wear_name !== undefined && itemRow.item_wear_name !== '';
    let itemNamePricing = hasWear
      ? baseName + ' (' + itemRow.item_wear_name + ')'
      : baseName;

    if (!this.prices[itemNamePricing] && this.prices[baseName]) {
      itemNamePricing = baseName;
    }

    if (this.prices[itemNamePricing] !== undefined) {
      const buffPrice = normalizeProviderPrice(
        this.prices[itemNamePricing]?.buff163?.starting_at?.price,
      );
      const skinportPrice = normalizeProviderPrice(
        this.prices[itemNamePricing]?.skinport?.starting_at,
      );

      const steamCandidates = [
        this.prices[itemNamePricing]?.steam?.last_24h,
        this.prices[itemNamePricing]?.steam?.last_7d,
        this.prices[itemNamePricing]?.steam?.last_30d,
        this.prices[itemNamePricing]?.steam?.last_90d,
      ];
      let steamPrice = 0;
      steamCandidates.some((candidate) => {
        const normalized = normalizeProviderPrice(candidate);
        if (normalized > 0) {
          steamPrice = normalized;
          return true;
        }

        return false;
      });

      const pricingDict = {
        buff163: buffPrice,
        steam_listing: steamPrice,
        skinport: skinportPrice,
        bitskins: 0,
      };
      if (
        normalizeProviderPrice(this.prices[itemNamePricing]?.steam?.last_7d) ===
          0 &&
        buffPrice > 2000
      ) {
        pricingDict.steam_listing = normalizeProviderPrice(buffPrice * 0.8);
      }
      itemRow['pricing'] = pricingDict;
      return itemRow;
    } else {
      const pricingDict = {
        buff163: 0,
        steam_listing: 0,
        skinport: 0,
        bitskins: 0,
      };
      itemRow['pricing'] = pricingDict;
      return itemRow;
    }
  }
  async handleItem(itemRow) {
    const returnRows = [] as any;
    itemRow.forEach((element) => {
      if (element.item_name !== undefined && element.item_moveable == true) {
        this.makeSinglerequest(element).then((returnValue) => {
          returnRows.push(returnValue);
        });
      }
    });
    pricingEmitter.emit('result', itemRow);
  }

  async handleTradeUp(itemRow) {
    const returnRows = [] as any;
    itemRow.forEach((element) => {
      this.makeSinglerequest(element).then((returnValue) => {
        returnRows.push(returnValue);
      });
    });
    pricingEmitter.emit('result', itemRow);
  }
}
