import "./OrderSummary.css";
import { useSelector } from "react-redux";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export const OrderSummary = () => {
  const navigate = useNavigate();
 const { items, totalPrice, status, error } = useSelector((state) => state.cart);

  const quantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce(
    (acc, item) => acc + item.quantity * item.product.discountedPrice,
    0
  );
  const delivery = 0; //
  const taxRate = 0; // 0%
  const tax = totalAmount * taxRate;
  const total = totalAmount + delivery + tax;

  return (
    <div className="order-wrapper">
      <div className="order-table">
        <h4>Order Summary</h4>
        <div className="table-body">
          <div className="item-info">
            <p>{quantity} item{quantity > 1 ? "s" : ""}</p>
            <p>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="item-info">
            <p>Delivery</p>
            <p>${delivery.toFixed(2)}</p>
          </div>
          <div className="item-info">
            <p>Tax</p>
            <p>${tax.toFixed(2)}</p>
          </div>
          <div className="total">
            <p>Total</p>
            <p>${total.toFixed(2)}</p>
          </div>
        </div>
        <Button
          style={{ height: 48, width: "100%", marginTop: 16 }}
          type="default"
          onClick={() => navigate("/checkout")}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
};
