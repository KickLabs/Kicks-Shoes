import { Pagination } from "antd";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrders, getTotalOrders } from "../../../data/mockData";
import TableOrders from "../../pages/dashboard/components/TableOrders";
import { ActiveTabContext } from "./ActiveTabContext";
import TabHeader from "./TabHeader";
import { Dropdown, Button, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";

const OrderList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const currentOrders = getOrders(currentPage, pageSize);
  const totalOrders = getTotalOrders();

  const { setActiveTab } = useContext(ActiveTabContext);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    setActiveTab("3");
  }, [setActiveTab]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const statusMenu = (
    <Menu
      items={[
        { label: "Pending", key: "pending" },
        { label: "Completed", key: "completed" },
        { label: "Cancelled", key: "cancelled" }
      ]}
      onClick={(e) => {
        console.log("Selected status:", e.key);
        // TODO: Thay đổi status tại đây
      }}
    />
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <TabHeader breadcrumb="Order List" />
        <Dropdown overlay={statusMenu} trigger={["click"]}>
          <Button style={{ height: 45 }}>
            Change Status <DownOutlined />
          </Button>
        </Dropdown>
      </div>

      <TableOrders
        title="Recent Purchases"
        orders={currentOrders}
        dashboard={isDashboard}
      />
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalOrders}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default OrderList;
