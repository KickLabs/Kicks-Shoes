// import React, { useState } from 'react';
// import { Modal, Form, Rate, Input, Upload, Button, message } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import axiosInstance from '@/services/axiosInstance';

// const FeedbackModal = ({ visible, onCancel, onSaved, orderId, productId }) => {
//   const [form] = Form.useForm();
//   const [fileList, setFileList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleUploadChange = ({ fileList }) => {
//     setFileList(fileList);
//   };

//   const onFinish = async values => {
//     const imageUrls = fileList
//       .filter(file => file.status === 'done')
//       .map(file => file.url || (file.response && file.response.url));
//     try {
//       const data = new FormData();
//       data.append('order', orderId);
//       data.append('product', productId);
//       data.append('rating', values.rating);
//       data.append('comment', values.comment);
//       fileList.forEach(file => {
//         if (file.originFileObj) data.append('images', file.originFileObj);
//       });
//       await axiosInstance.post('/feedback', data);

//       form.resetFields();
//       setFileList([]);
//       message.success('Review submitted successfully');
//       onSaved();
//     } catch (error) {
//       console.error('Error submitting feedback:', error);
//       message.error('Failed to submit review');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal
//       title="Submit Product Review"
//       visible={visible}
//       onCancel={onCancel}
//       onOk={() => form.submit()}
//       confirmLoading={loading}
//       okText="Submit"
//       cancelText="Cancel"
//     >
//       <Form form={form} layout="vertical" onFinish={onFinish}>
//         <Form.Item
//           name="rating"
//           label="Rating"
//           rules={[{ required: true, message: 'Please provide a rating!' }]}
//         >
//           <Rate />
//         </Form.Item>

//         <Form.Item
//           name="comment"
//           label="Comment"
//           rules={[{ required: true, message: 'Please enter your comment!' }]}
//         >
//           <Input.TextArea rows={4} placeholder="Write your review..." />
//         </Form.Item>

//         <Form.Item name="images" label="Images">
//           <Upload
//             beforeUpload={() => false}
//             multiple
//             listType="picture"
//             fileList={fileList}
//             onChange={handleUploadChange}
//           >
//             <Button icon={<UploadOutlined />}>Choose Images</Button>
//           </Upload>
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

// export default FeedbackModal;
import React, { useState, useEffect } from 'react';
import { Modal, Form, Rate, Input, Upload, Button, message, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '@/services/axiosInstance';

const FeedbackModal = ({ visible, onCancel, onSaved, orderId, productId }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [feedbackId, setFeedbackId] = useState(null);

  // Fetch existing feedback when modal opens
  useEffect(() => {
    if (visible && productId) {
      setLoadingExisting(true);
      axiosInstance
        .get(`/feedback?product=${productId}&order=${orderId}`)
        .then(res => {
          const fb = res.data.data;
          if (fb) {
            setFeedbackId(fb._id);
            form.setFieldsValue({ rating: fb.rating, comment: fb.comment });
            setFileList(
              fb.images.map((url, idx) => ({
                uid: `fb-${idx}`,
                name: `Image ${idx + 1}`,
                status: 'done',
                url,
              }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoadingExisting(false));
    } else {
      // reset when closed or no product
      setFeedbackId(null);
      form.resetFields();
      setFileList([]);
    }
  }, [visible, productId]);

  // Upload handler
  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ({ loaded, total }) =>
          onProgress({ percent: (loaded / total) * 100 }, file),
      });
      const url = response.data.url;
      setFileList(prev => [...prev, { uid: file.uid, name: file.name, status: 'done', url }]);
      onSuccess(response.data, file);
    } catch (err) {
      console.error('Upload error:', err);
      message.error(`${file.name} upload failed.`);
      onError(err);
    }
  };

  const handleRemove = file => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
  };

  // Delete feedback
  const handleDelete = async () => {
    if (!feedbackId) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/feedback/${feedbackId}`);
      message.success('Review deleted successfully');
      onSaved();
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Failed to delete review');
    } finally {
      setSubmitting(false);
      onCancel();
    }
  };

  // Submit or update
  const onFinish = async values => {
    setSubmitting(true);
    const images = fileList.map(f => f.url).filter(Boolean);
    try {
      if (feedbackId) {
        await axiosInstance.put(`/feedback/${feedbackId}`, {
          rating: values.rating,
          comment: values.comment,
          images,
        });
        message.success('Review updated successfully');
      } else {
        await axiosInstance.post('/feedback', {
          order: orderId,
          product: productId,
          rating: values.rating,
          comment: values.comment,
          images,
        });
        message.success('Review submitted successfully');
      }
      form.resetFields();
      setFileList([]);
      onSaved();
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Failed to submit review');
    } finally {
      setSubmitting(false);
      onCancel();
    }
  };

  return (
    <Modal
      title={feedbackId ? 'Edit Product Review' : 'Submit Product Review'}
      open={visible}
      onCancel={onCancel}
      footer={
        loadingExisting
          ? [<Spin key="spin" />]
          : [
              feedbackId && (
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={submitting}
                >
                  Delete
                </Button>
              ),
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={() => form.submit()}
                loading={submitting}
              >
                {feedbackId ? 'Update' : 'Submit'}
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
              onRemove={handleRemove}
              multiple
            >
              {fileList.length < 5 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{feedbackId ? 'Add' : 'Upload'}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default FeedbackModal;
