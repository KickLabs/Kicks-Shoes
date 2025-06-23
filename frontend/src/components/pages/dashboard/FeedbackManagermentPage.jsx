import React, { useEffect, useState, useContext } from 'react';
import { Button, Pagination, Tag } from 'antd';
import axios from 'axios';
import TabHeader from '../../common/components/TabHeader';
import { ActiveTabContext } from '../../common/components/ActiveTabContext';
import { StarFilled } from '@ant-design/icons';
import './FeedbackManagementPage.css';

const FeedbackManagementPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 9;

  const fetchFeedbacks = () => {
    axios
      .get(`/api/feedbacks?page=${currentPage}&limit=${pageSize}`)
      .then(res => {
        setFeedbacks(res.data.data);
        setTotal(res.data.total);
      })
      .catch(err => console.error('Failed to fetch feedbacks', err));
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage]);

  const { setActiveTab } = useContext(ActiveTabContext);
  useEffect(() => {
    setActiveTab('7');
  }, [setActiveTab]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <TabHeader breadcrumb="Feedback Management" />
        <Button onClick={fetchFeedbacks} type="default">
          REFRESH
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 feedback-card">
        {feedbacks.map(fb => (
          <div
            key={fb._id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-800">{fb.user?.username}</div>
              <div className="text-xs text-gray-500">{fb.user?.email}</div>
            </div>

            {/* Product */}
            <div className="text-sm text-gray-700 mb-1">
              <strong>Product:</strong> {fb.product?.name}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              ${fb.product?.discountedPrice?.toFixed(2)}
            </div>

            {/* Order + Rating */}
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-700">
                <strong>Order:</strong> {fb.order?.formattedOrderNumber || '#N/A'}
              </span>
              <span className="flex items-center gap-1">
                {fb.rating}
                <StarFilled className="text-yellow-400" />
              </span>
            </div>

            {/* Comment */}
            <div className="text-gray-800 text-sm mb-2">
              <strong>Comment:</strong>
              <div className="text-sm mt-1 whitespace-pre-wrap">{fb.comment}</div>
            </div>

            {/* Image (centered) */}
            {fb.images?.length > 0 && (
              <div className="flex justify-center mt-3 feedback-img">
                <img
                  src={fb.images[0]}
                  alt="feedback"
                  className="w-28 h-28 object-cover rounded-md border"
                />
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <Tag
                color={
                  fb.status === 'approved' ? 'blue' : fb.status === 'rejected' ? 'red' : 'orange'
                }
              >
                {fb.status}
              </Tag>

              <Tag color={fb.isVerified ? 'green' : 'gray'}>
                {fb.isVerified ? 'Verified' : 'Unverified'}
              </Tag>

              <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <Pagination
          current={currentPage}
          total={total}
          pageSize={pageSize}
          onChange={setCurrentPage}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default FeedbackManagementPage;
