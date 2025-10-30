import { CameraOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, message, Modal, Typography, Upload } from 'antd';
import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Dragger } = Upload;
const { Text } = Typography;

const HeaderVisualSearch = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    setFile(null);
    setPreviewImage(null);
  };

  const handleFileChange = info => {
    const currentFile = info.file;
    if (currentFile) {
      setFile(currentFile);
      const reader = new FileReader();
      reader.readAsDataURL(currentFile);
      reader.onload = () => setPreviewImage(reader.result);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      message.error('Please select an image to search.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/api/products/visual-search', formData);

      if (response.data.success) {
        message.success('Image analysis successful, displaying results...');
        setIsModalVisible(false);
        navigate('/shop/visual-search', {
          state: { searchResults: response.data.data },
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to perform search.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
      setFile(null);
      setPreviewImage(null);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: file => {
      const isJpgOrPng =
        file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) message.error('You can only upload JPG/PNG/WEBP files!');
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) message.error('Image must be less than 5MB!');
      if (isJpgOrPng && isLt5M) {
        handleFileChange({ file });
      }
      return false;
    },
  };

  return (
    <>
      <Button
        icon={<CameraOutlined />}
        onClick={showModal}
        type="text"
        aria-label="Tìm kiếm bằng hình ảnh"
      />
      <Modal
        title="Tìm Kiếm Bằng Hình Ảnh"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSearch}
            disabled={!file}
            icon={<SearchOutlined />}
          >
            {loading ? 'Đang phân tích...' : 'Tìm Kiếm'}
          </Button>,
        ]}
      >
        <Dragger {...draggerProps} height={200}>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Preview"
              style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
            />
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <CameraOutlined />
              </p>
              <p className="ant-upload-text">Nhấn hoặc kéo thả file vào đây</p>
              <p className="ant-upload-hint">Tìm kiếm bất kỳ sản phẩm nào từ một hình ảnh.</p>
            </>
          )}
        </Dragger>
        {file && (
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            Tệp đã chọn: {file.name}
          </Text>
        )}
      </Modal>
    </>
  );
};

export default HeaderVisualSearch;
