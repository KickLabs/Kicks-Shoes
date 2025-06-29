import React, { useEffect, useState, useContext } from 'react';
import { Button, Pagination, Tag } from 'antd';
import axios from 'axios';
import TabHeader from '../../common/components/TabHeader';
import { ActiveTabContext } from '../../common/components/ActiveTabContext';
import { StarFilled, ReloadOutlined } from '@ant-design/icons';
import styles from './FeedbackManagementPage.module.css';
import { Select, message } from 'antd';

const FeedbackManagementPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 9;

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await axios.patch(`/api/feedbacks/${feedbackId}/status`, { status: newStatus });
      message.success(`Updated feedback to ${newStatus}`);
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to update feedback status', err);
      message.error('Failed to update feedback status');
    }
  };

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
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <TabHeader breadcrumb="Feedback Management" />
        <Button onClick={fetchFeedbacks} icon={<ReloadOutlined />} type="primary">
          Refresh
        </Button>
      </div>

      <div className={styles.feedbackGrid}>
        {feedbacks.map(fb => (
          <div key={fb._id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.username}>{fb.user?.username}</div>
                <div className={styles.email}>{fb.user?.email}</div>
              </div>
              <div className={styles.rating}>
                {fb.rating}
                <StarFilled />
              </div>
            </div>

            <div className={styles.productInfo}>
              <div>
                <strong>Product:</strong> {fb.product?.name}
              </div>
              <div className={styles.price}>${fb.product?.discountedPrice?.toFixed(2)}</div>
              <div className={styles.order}>
                <strong>Order:</strong> {fb.order?.formattedOrderNumber || '#N/A'}
              </div>
            </div>

            <div className={styles.comment}>
              <strong>Comment:</strong>
              <p>{fb.comment}</p>
            </div>

            {fb.images?.length > 0 && (
              <div className={styles.imageContainer}>
                <img src={fb.images[0]} alt="feedback" className={styles.feedbackImage} />
              </div>
            )}

            <div className={styles.footer}>
              <div className={styles.statusControl}>
                <Select
                  value={fb.status}
                  style={{ width: 140 }}
                  disabled={fb.status !== 'pending'}
                  onChange={value => handleStatusChange(fb._id, value)}
                  options={
                    fb.status === 'pending'
                      ? [
                          { value: 'approved', label: 'Approve' },
                          { value: 'rejected', label: 'Reject' },
                        ]
                      : [
                          {
                            value: fb.status,
                            label: fb.status.charAt(0).toUpperCase() + fb.status.slice(1),
                            disabled: true,
                          },
                        ]
                  }
                />
              </div>

              <div className={styles.statusTags}>
                <Tag color={fb.isVerified ? 'green' : 'default'}>
                  {fb.isVerified ? 'Verified' : 'Unverified'}
                </Tag>
                <span className={styles.date}>{new Date(fb.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.paginationWrapper}>
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
