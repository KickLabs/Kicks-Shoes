import { useEffect, useState } from 'react';
import { Table, Tag, Spin, message, Modal, Segmented } from 'antd';
import axiosInstance from '../../../../services/axiosInstance';
import TabHeader from './../../../common/components/TabHeader';
import { EyeOutlined } from '@ant-design/icons';

export default function ReportTab() {
  const [reports, setReports] = useState([]);
  const [feedbackReports, setFeedbackReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [tab, setTab] = useState('myReports');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [myRes, fbRes] = await Promise.all([
          axiosInstance.get('/products/reports/my'),
          axiosInstance.get('/dashboard/my/feedback-reports'),
        ]);
        setReports(myRes.data.data || []);
        setFeedbackReports(fbRes.data.data || []);
      } catch (err) {
        message.error('Cannot load report list');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const columns = [
    {
      title: 'Type',
      dataIndex: 'targetType',
      key: 'type',
      align: 'center',
      render: type => (
        <Tag
          color={
            type === 'product'
              ? 'blue'
              : type === 'feedback'
                ? 'orange'
                : type === 'comment'
                  ? 'purple'
                  : type === 'user'
                    ? 'red'
                    : 'default'
          }
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '4px 16px' }}
        >
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      align: 'center',
      render: text => <span style={{ fontSize: 14 }}>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: text => (
        <span
          style={{ maxWidth: 220, display: 'inline-block', whiteSpace: 'pre-line', fontSize: 14 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: status => (
        <Tag
          style={{ borderRadius: 8, fontSize: 13, padding: '2px 12px' }}
          color={status === 'pending' ? 'orange' : status === 'resolved' ? 'green' : 'blue'}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: date => <span style={{ fontSize: 13 }}>{new Date(date).toLocaleString()}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) =>
        record.status === 'resolved' ? (
          <EyeOutlined
            style={{ fontSize: 18, color: '#4A69E2', cursor: 'pointer' }}
            title="View admin resolution"
            onClick={() => {
              setSelectedReport(record);
              setViewModalOpen(true);
            }}
          />
        ) : null,
    },
  ];

  // Columns for feedback reports about me
  const feedbackReportColumns = [
    {
      title: 'Type',
      dataIndex: 'targetType',
      key: 'type',
      align: 'center',
      render: () => (
        <Tag
          color="orange"
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '4px 16px' }}
        >
          FEEDBACK
        </Tag>
      ),
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      render: fb =>
        fb ? (
          <span style={{ fontWeight: 500, fontSize: 15 }}>
            {fb.comment}
            {fb.product && (
              <span style={{ color: '#aaa', marginLeft: 8 }}>on {fb.product.name}</span>
            )}
          </span>
        ) : (
          'N/A'
        ),
      align: 'center',
    },
    {
      title: 'Rating',
      dataIndex: ['feedback', 'rating'],
      key: 'rating',
      align: 'center',
      render: rating =>
        rating ? (
          <span style={{ color: '#faad14', fontWeight: 600 }}>{'★'.repeat(rating)}</span>
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Shop Reporter',
      dataIndex: 'reporter',
      key: 'reporter',
      align: 'center',
      render: reporter => (reporter ? `${reporter.fullName} (${reporter.email})` : 'N/A'),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      align: 'center',
      render: text => <span style={{ fontSize: 14 }}>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: text => (
        <span
          style={{ maxWidth: 220, display: 'inline-block', whiteSpace: 'pre-line', fontSize: 14 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: status => (
        <Tag
          style={{ borderRadius: 8, fontSize: 13, padding: '2px 12px' }}
          color={status === 'pending' ? 'orange' : status === 'resolved' ? 'green' : 'blue'}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: date => <span style={{ fontSize: 13 }}>{new Date(date).toLocaleString()}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) =>
        record.status === 'resolved' ? (
          <EyeOutlined
            style={{ fontSize: 18, color: '#4A69E2', cursor: 'pointer' }}
            title="View admin resolution"
            onClick={() => {
              setSelectedReport(record);
              setViewModalOpen(true);
            }}
          />
        ) : null,
    },
  ];

  // Lọc chỉ hiển thị report có target còn hoạt động
  const activeReports = reports.filter(r => !r.target || r.target.status !== false);
  const activeFeedbackReports = feedbackReports.filter(r => r.feedback);

  return (
    <div style={{ padding: 24 }}>
      <TabHeader breadcrumb="Reports Management" />
      <Segmented
        options={[
          { label: 'Reports I have made', value: 'myReports' },
          { label: 'Feedback about me reported by shops', value: 'feedbackAboutMe' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 20 }}
      />
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: 16,
        }}
      >
        {loading ? (
          <Spin />
        ) : tab === 'myReports' ? (
          <Table
            columns={columns}
            dataSource={activeReports}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            bordered
            style={{ borderRadius: 14, overflow: 'hidden' }}
            size="middle"
            scroll={{ x: true }}
          />
        ) : (
          <Table
            columns={feedbackReportColumns}
            dataSource={activeFeedbackReports}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            bordered
            style={{ borderRadius: 14, overflow: 'hidden' }}
            size="middle"
            scroll={{ x: true }}
          />
        )}
      </div>
      {/* Modal view admin resolution */}
      <Modal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        title="Admin Resolution"
      >
        {selectedReport ? (
          <div style={{ lineHeight: 2 }}>
            <div>
              <b>Resolution:</b> {selectedReport.resolution || 'N/A'}
            </div>
            <div>
              <b>Admin Note:</b> {selectedReport.adminNote || 'N/A'}
            </div>
            <div>
              <b>Resolved By:</b>{' '}
              {selectedReport.resolvedBy
                ? selectedReport.resolvedBy.fullName ||
                  selectedReport.resolvedBy.email ||
                  selectedReport.resolvedBy
                : 'N/A'}
            </div>
            <div>
              <b>Resolved At:</b>{' '}
              {selectedReport.resolvedAt
                ? new Date(selectedReport.resolvedAt).toLocaleString()
                : 'N/A'}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
