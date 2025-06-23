import React, { useContext, useEffect, useState } from 'react';
import { Button, Pagination } from 'antd';
import TableUsers from './components/TableUsers';
import TabHeader from '../../common/components/TabHeader';
import { ActiveTabContext } from '../../common/components/ActiveTabContext';
import axios from 'axios';

const UserManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // const currentUsers = getUsers(currentPage, pageSize);
  // const totalUsers = getTotalUsers();
  const [currentUsers, setCurrentUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = () => {
    axios
      .get(`/api/users?page=${currentPage}&limit=${pageSize}`)
      .then(res => {
        setCurrentUsers(res.data.data);
        setTotalUsers(res.data.total);
      })
      .catch(err => {
        console.error('Failed to fetch users:', err);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab('6');
  }, [setActiveTab]);

  return (
    <>
      <div className="all-products-header">
        <TabHeader breadcrumb="User Management" />
        <Button
          onClick={() => {
            window.location.href = '/dashboard/users/add-new';
          }}
          type="default"
        >
          ADD NEW USER
        </Button>
      </div>
      <TableUsers title="User List" users={currentUsers} onReload={fetchUsers} />
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
