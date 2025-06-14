import {
  Pagination,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Radio,
} from "antd";
import TabHeader from "../../common/components/TabHeader";
import { useContext, useEffect, useState } from "react";
import { ActiveTabContext } from "../../common/components/ActiveTabContext"; 
import TableDiscounts from "./components/TableDiscounts";
import axios from "axios";
import moment from "moment";

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

const DiscountListPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [form] = Form.useForm();
  const pageSize = 9;

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/discounts?page=${currentPage}&limit=${pageSize}`);
      setDiscounts(response.data.data);
      setTotalDiscounts(response.data.pagination.totalItems);
    } catch (error) {
      message.error('Failed to fetch discounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab("5");
  }, [setActiveTab]);

  const showModal = (discount = null) => {
    setEditingDiscount(discount);
    if (discount) {
      form.setFieldsValue({
        code: discount.code,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        maxDiscount: discount.maxDiscount,
        startDate: moment(discount.startDate),
        endDate: moment(discount.endDate),
        minPurchase: discount.minPurchase,
        usageLimit: discount.usageLimit,
        status: discount.status
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingDiscount(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/discounts/${id}`);
      message.success('Discount deleted successfully');
      fetchDiscounts();
    } catch (error) {
      message.error('Failed to delete discount');
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        applicableProducts: [],
        applicableCategories: [],
        usedCount: editingDiscount?.usedCount || 0,
        status: values.status || 'active'
      };

      if (editingDiscount) {
        const { type, ...updateData } = data;
        await api.put(`/api/discounts/${editingDiscount._id}`, updateData);
        message.success('Discount updated successfully');
      } else {
        await api.post('/api/discounts', data);
        message.success('Discount created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchDiscounts();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save discount');
      }
      console.error(error);
    }
  };

  return (
    <>
      <div className="all-products-header">
        <TabHeader breadcrumb="Discount Management" />
        <Button onClick={() => showModal()} type="primary">
          ADD NEW DISCOUNT
        </Button>
      </div>
      <TableDiscounts 
        title="Discount List" 
        discounts={discounts}
        loading={loading}
        onEdit={showModal}
        onDelete={handleDelete}
      />
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalDiscounts}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>

      <Modal
        title={editingDiscount ? "Edit Discount" : "Add New Discount"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label="Discount Code"
            rules={[
              { required: true, message: "Please input the discount code!" },
            ]}
          >
            <Input placeholder="Enter discount code" disabled={!!editingDiscount} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Discount Type"
            rules={[
              { required: true, message: "Please select the discount type!" },
            ]}
          >
            <Radio.Group disabled={!!editingDiscount}>
              <Radio value="percentage">Percentage</Radio>
              <Radio value="fixed">Fixed Amount</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const discountType = getFieldValue('type');
              return (
                <Form.Item
                  name="value"
                  label="Discount Value"
                  rules={[
                    { required: true, message: "Please input the discount value!" },
                    {
                      type: 'number',
                      min: 0.01,
                      message: "Value must be greater than 0!"
                    },
                    {
                      validator: async (_, value) => {
                        if (value === undefined || value === null) {
                          return Promise.reject('Please input the discount value!');
                        }
                        if (value <= 0) {
                          return Promise.reject('Value must be greater than 0!');
                        }
                        if (discountType === 'percentage' && value > 100) {
                          return Promise.reject('Percentage discount cannot exceed 100%');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0.01}
                    max={discountType === 'percentage' ? 100 : undefined}
                    precision={2}
                    placeholder="Enter value"
                    addonAfter={discountType === 'percentage' ? '%' : '$'}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="maxDiscount"
            label="Maximum Discount Amount"
            rules={[
              { required: true, message: "Please input the maximum discount!" },
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter maximum discount"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="minPurchase"
            label="Minimum Purchase Amount"
            rules={[
              { required: true, message: "Please input the minimum purchase!" },
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter minimum purchase"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="usageLimit"
            label="Usage Limit"
            rules={[
              { required: true, message: "Please input the usage limit!" },
            ]}
          >
            <InputNumber
              min={1}
              placeholder="Enter usage limit"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[
              { required: true, message: "Please select the start date!" },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
            rules={[
              { required: true, message: "Please select the end date!" },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {editingDiscount ? "Update" : "Create"}
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DiscountListPage; 