import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {
  ConvertPrices,
  safeAdd,
  safeDivide,
  sanitizePriceNumber,
} from '../../functionsClasses/prices';
import RunOverview from './runOverview';

function OverviewContent() {
  const tradeUpData = useSelector((state: any) => state.tradeUpReducer);
  const pricesResult = useSelector((state: any) => state.pricingReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const pricingClass = new ConvertPrices(settingsData, pricesResult);
  let totalFloat = 0;
  let totalPrice = 0;
  tradeUpData.tradeUpProducts.forEach((element) => {
    totalFloat = safeAdd(totalFloat, sanitizePriceNumber(element.item_paint_wear, 0));
    totalPrice = safeAdd(totalPrice, pricingClass.getPrice(element, true));
  });
  totalFloat = safeDivide(totalFloat, tradeUpData.tradeUpProducts.length, 0);
  let totalEV = 0;
  tradeUpData.possibleOutcomes.forEach((element) => {
    const individualPrice = pricingClass.getPriceWithMultiplier(
      element,
      safeDivide(sanitizePriceNumber(element.percentage, 0), 100, 0),
      true,
    );
    totalEV = safeAdd(totalEV, individualPrice);
  });

  return (
    <>
      <div>
        <div className="">
          <div className="h-screen">
            <RunOverview />
          </div>
        </div>
      </div>
    </>
  );
}
export default function OverviewPage() {
  return (
    <Routes>
      <Route path="*" element={<OverviewContent />} />
    </Routes>
  );
}
