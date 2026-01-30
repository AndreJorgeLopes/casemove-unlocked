import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConvertPrices } from '../../functionsClasses/prices';
import RunOverview from './runOverview';

function OverviewContent() {
  const tradeUpData = useSelector((state: any) => state.tradeUpReducer);
  const pricesResult = useSelector((state: any) => state.pricingReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const pricingClass = new ConvertPrices(settingsData, pricesResult);
  let totalFloat = 0;
  let totalPrice = 0;
  tradeUpData.tradeUpProducts.forEach((element) => {
    totalFloat += element.item_paint_wear;
    totalPrice += pricingClass.getPrice(element, true);
  });
  totalFloat = totalFloat / tradeUpData.tradeUpProducts.length;
  let totalEV = 0;
  tradeUpData.possibleOutcomes.forEach((element) => {
    const individualPrice = pricingClass.getPriceWithMultiplier(
      element,
      element.percentage / 100,
      true,
    );
    totalEV += individualPrice;
    console.log(element, element.percentage, individualPrice);
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
