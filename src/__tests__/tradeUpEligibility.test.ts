import { isTradeUpEligible } from '../renderer/functionsClasses/filters/tradeUpEligibility';

describe('isTradeUpEligible', () => {
  it('returns true when tradeUpConfirmed is true', () => {
    expect(isTradeUpEligible({ tradeUpConfirmed: true, tradeUp: false })).toBe(
      true,
    );
  });

  it('returns true when tradeUp is true', () => {
    expect(isTradeUpEligible({ tradeUpConfirmed: false, tradeUp: true })).toBe(
      true,
    );
  });

  it('returns false when both flags are false', () => {
    expect(isTradeUpEligible({ tradeUpConfirmed: false, tradeUp: false })).toBe(
      false,
    );
  });
});
