import React, { useState, useEffect } from 'react';
import { Modal, Form, Rate, Input, Upload, Button, message, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '@/services/axiosInstance';

export default function FeedbackModal({
  visible,
  onCancel,
  onSaved,
  orderId,
  productId,
  feedbackId: fidProp, // id truyền vào nếu edit
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [fid, setFid] = useState(fidProp || null);

  // Khi modal bật: chỉ fetch feedback by ID nếu đang edit
  useEffect(() => {
    if (!visible) return;
    if (fidProp) {
      setLoadingExisting(true);
      axiosInstance
        .get(`/feedback/${fidProp}`)
        .then(res => {
          const fb = res.data.data;
          setFid(fb._id);
          form.setFieldsValue({ rating: fb.rating, comment: fb.comment });
          setFileList(
            fb.images.map((url, idx) => ({
              uid: `fb-${idx}`,
              name: `Image ${idx + 1}`,
              status: 'done',
              url,
            }))
          );
        })
        .catch(err => console.error('Fetch by ID error:', err))
        .finally(() => setLoadingExisting(false));
    } else {
      // tạo mới: reset form & list
      form.resetFields();
      setFileList([]);
      setFid(null);
    }
  }, [visible, fidProp, form]);

  // Upload handler
  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await axiosInstance.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => onProgress({ percent: (e.loaded / e.total) * 100 }, file),
      });
      const url = res.data.url;
      setFileList(prev => [...prev, { uid: file.uid, name: file.name, status: 'done', url }]);
      onSuccess(res.data, file);
    } catch (err) {
      console.error('Upload error:', err);
      message.error('Image upload failed');
      onError(err);
    }
  };

  const handleRemove = file => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
  };

  // Delete feedback
  const handleDelete = async () => {
    if (!fid) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/feedback/${fid}`);
      message.success('Review deleted successfully');
      onSaved();
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Failed to delete review');
    } finally {
      setLoading(false);
      onCancel();
    }
  };

  // Submit or update feedback
  const onFinish = async values => {
    setLoading(true);
    const images = fileList.map(f => f.url).filter(Boolean);
    try {
      if (fid) {
        // EDIT mode: PUT
        await axiosInstance.put(`/feedback/${fid}`, {
          rating: values.rating,
          comment: values.comment,
          images,
        });
        message.success('Review updated successfully');
      } else {
        // CREATE mode: POST
        await axiosInstance.post('/feedback', {
          order: orderId,
          product: productId,
          rating: values.rating,
          comment: values.comment,
          images,
        });
        message.success('Review submitted successfully');
      }
      onSaved();
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Failed to submit review');
    } finally {
      setLoading(false);
      onCancel();
    }
  };

  return (
    <Modal
      title={fid ? 'Edit Product Review' : 'Submit Product Review'}
      open={visible}
      onCancel={onCancel}
      confirmLoading={loading}
      footer={
        loadingExisting
          ? [<Spin key="spin" />]
          : [
              fid && (
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={loading}
                >
                  Delete
                </Button>
              ),
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button key="submit" type="primary" onClick={() => form.submit()} loading={loading}>
                {fid ? 'Update' : 'Submit'}
              </Button>,
            ]
      }
    >
      {loadingExisting ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please provide a rating!' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Please enter your comment!' }]}
          >
            <Input.TextArea rows={4} placeholder="Write your review..." />
          </Form.Item>
          <Form.Item label="Images">
            <Upload
              customRequest={customRequest}
              listType="picture-card"
              fileList={fileList}
              multiple
              onRemove={handleRemove}
            >
              {fileList.length < 5 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{fid ? 'Add' : 'Upload'}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
