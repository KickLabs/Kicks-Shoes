import { Pagination } from "antd";
import TableOrders from "./components/TableOrders";
import TabHeader from "./components/TabHeader";
import { getOrders, getTotalOrders } from "./data/dashboardData";
import { useContext, useEffect, useState } from "react";
import { ActiveTabContext } from "./Dashboard";

const OrderList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const currentOrders = getOrders(currentPage, pageSize);
  const totalOrders = getTotalOrders();

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab("3");
  }, [setActiveTab]);

  return (
    <>
      <TabHeader breadcrumb="Order List" />
      <TableOrders title="Recent Purchases" orders={currentOrders} />
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
