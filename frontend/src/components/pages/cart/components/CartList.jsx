import "./CartList.css";
import { cartItems } from "../../../../data/cartData";
import CartItemCard from "./CartItemCard";
export const CartList = () => {
  return (
    <>
      <div className="cart-wrapper">
        <div className="cart-text">
          <h2>Your Bag</h2>
          <p>
            Items in your bag not reserved- check out now to make them yours.
          </p>
        </div>
        <div className="cart-items-scroll">
          {cartItems.map((item) => (
            <CartItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
};
