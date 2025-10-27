import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Tooltip } from 'antd';
import { CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import shipperApplicationService from '../../../services/shipperApplicationService';
import { useAuth } from '../../../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const ShipperApplicationModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Auto-fill form with user data when modal opens
  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        identityCard: user.identityCard || '',
        vehicleType: 'motorcycle', // Default
      });
    }
  }, [visible, user, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await shipperApplicationService.createApplication(values);
      message.success('Application submitted successfully! We will review it soon.');
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      message.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CarOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <span>Become a Shipper</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
        Fill out the form below to apply to become a shipper. We've pre-filled your information from your profile. Please review and update if needed.
      </div>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[
            { required: true, message: 'Please enter your full name' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="Enter your full name" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone"
          rules={[
            { required: true, message: 'Please enter your phone number' },
            { pattern: /^[0-9]{10,11}$/, message: 'Please enter a valid phone number' },
          ]}
        >
          <Input placeholder="Enter your phone number" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[
            { required: true, message: 'Please enter your address' },
            { min: 10, message: 'Address must be at least 10 characters' },
          ]}
        >
          <TextArea
            placeholder="Enter your full address"
            rows={2}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Identity Card Number (CCCD/CMND)"
          name="identityCard"
          rules={[
            { required: true, message: 'Please enter your identity card number' },
            { pattern: /^[0-9]{9,12}$/, message: 'Please enter a valid ID number' },
          ]}
        >
          <Input placeholder="Enter your identity card number" />
        </Form.Item>

        <Form.Item
          label="Vehicle Type"
          name="vehicleType"
          rules={[{ required: true, message: 'Please select your vehicle type' }]}
        >
          <Select placeholder="Select vehicle type">
            <Option value="motorcycle">Motorcycle</Option>
            <Option value="bicycle">Bicycle</Option>
            <Option value="car">Car</Option>
            <Option value="truck">Truck</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Vehicle Plate Number (Optional)"
          name="vehiclePlate"
        >
          <Input placeholder="Enter vehicle plate number" />
        </Form.Item>

        <Form.Item
          label="Delivery Experience (Optional)"
          name="experience"
        >
          <TextArea
            placeholder="Describe your delivery experience (if any)"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Why do you want to become a shipper?"
          name="reason"
          rules={[
            { required: true, message: 'Please tell us why you want to join' },
            { min: 20, message: 'Please provide at least 20 characters' },
          ]}
        >
          <TextArea
            placeholder="Tell us why you want to become a shipper..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CarOutlined />}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
              }}
            >
              Submit Application
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShipperApplicationModal;

