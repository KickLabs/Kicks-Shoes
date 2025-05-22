import React, { useContext, useEffect, useState } from "react";
import { Button, Pagination } from "antd";
import TableUsers from "./components/TableUsers";
import TabHeader from "./components/TabHeader";
import { getUsers, getTotalUsers } from "../../../data/mockData";
import { ActiveTabContext } from "./Dashboard";

const UserManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const currentUsers = getUsers(currentPage, pageSize);
  const totalUsers = getTotalUsers();

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab("5");
  }, [setActiveTab]);

  return (
    <>
      <div className="all-products-header">
        <TabHeader breadcrumb="User Management" />
        <Button
          onClick={() => {
            window.location.href = "/dashboard/users/add-new";
          }}
          type="default"
        >
          ADD NEW USER
        </Button>
      </div>
      <TableUsers title="User List" users={currentUsers} />
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalUsers}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default UserManagementPage;
