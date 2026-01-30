import { ItemRow } from '../../interfaces/items';

export type TradeUpEligibilityItem = Pick<
  ItemRow,
  'tradeUpConfirmed' | 'tradeUp'
>;

export function isTradeUpEligible(item: TradeUpEligibilityItem) {
  return Boolean(item.tradeUpConfirmed || item.tradeUp);
}
