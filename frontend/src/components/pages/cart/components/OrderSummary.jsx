import "./OrderSummary.css";
import { orderData } from "../../../../data/cartData";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export const OrderSummary = () => {
  const navigate = useNavigate();
  return (
    <div className="order-wrapper">
      <div className="order-table">
        <h4>Order Summary</h4>
        <div className="table-body">
          <div className="item-info">
            <p>{orderData.quantity} item</p>
            <p>${orderData.totalAmount.toLocaleString()}</p>
          </div>
          <div className="item-info">
            <p>Delivery</p>
            <p>${orderData.delivery.toLocaleString()}</p>
          </div>
          <div className="item-info">
            <p>Delivery</p>
            <p>${orderData.tax.toLocaleString()}</p>
          </div>
          <div className="total">
            <p>Total</p>
            <p>${orderData.total.toLocaleString()}</p>
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
