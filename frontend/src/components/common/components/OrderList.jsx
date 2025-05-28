import { Pagination } from "antd";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrders, getTotalOrders } from "../../../data/mockData";
import TableOrders from "../../pages/dashboard/components/TableOrders";
import { ActiveTabContext } from "./ActiveTabContext";
import TabHeader from "./TabHeader";

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

  return (
    <>
      <TabHeader breadcrumb="Order List" />
      <TableOrders title="Recent Purchases" orders={currentOrders} dashboard={isDashboard} />
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
