import "./CartSection.css";
import { CartList } from "./CartList";
import { OrderSummary } from "./OrderSummary";
export const CartSection = () => {
  return (
    <div className="cart-section">
      <CartList />
      <OrderSummary/>
    </div>
  );
};
