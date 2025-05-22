import {
  Pagination,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
} from "antd";
import TabHeader from "./components/TabHeader";
import { getDiscounts, getTotalDiscounts } from "./data/dashboardData";
import { useContext, useEffect, useState } from "react";
import { ActiveTabContext } from "./Dashboard";
import TableDiscounts from "./components/TableDiscounts";

const DiscountListPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const pageSize = 9;
  const currentDiscounts = getDiscounts(currentPage, pageSize);
  const totalDiscounts = getTotalDiscounts();

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab("4");
  }, [setActiveTab]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      // Here you would typically make an API call to save the discount
      console.log("Discount values:", {
        ...values,
        totalUsed: 0, // Initialize total used to 0 for new discounts
      });
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error submitting discount:", error);
    }
  };

  return (
    <>
      <div className="all-products-header">
        <TabHeader breadcrumb="Discount Management" />
        <Button onClick={showModal} type="default">
          ADD NEW DISCOUNT
        </Button>
      </div>
      <TableDiscounts title="Discount List" discounts={currentDiscounts} />
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalDiscounts}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>

      <Modal
        title="Add New Discount"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="discountCode"
            label="Discount Code"
            rules={[
              { required: true, message: "Please input the discount code!" },
            ]}
          >
            <Input placeholder="Enter discount code" />
          </Form.Item>

          <Form.Item
            name="percentage"
            label="Percentage"
            rules={[
              {
                required: true,
                message: "Please input the discount percentage!",
              },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              placeholder="Enter percentage"
              addonAfter="%"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="numberOfDiscount"
            label="Number of Discount"
            rules={[
              {
                required: true,
                message: "Please input the total discount amount!",
              },
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter number of discount"
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/đ\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="minimumAmount"
            label="Minimum Amount"
            rules={[
              {
                required: true,
                message: "Please input the minimum amount!",
              },
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter minimum amount"
              style={{ width: "100%" }}
              formatter={(value) =>
                `đ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/đ\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="maximumDiscount"
            label="Maximum Discount"
            rules={[
              {
                required: true,
                message: "Please input the maximum discount amount!",
              },
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter maximum discount amount"
              style={{ width: "100%" }}
              formatter={(value) =>
                `đ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/đ\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item>
            <Button type="default" htmlType="submit" style={{ marginRight: 8 }}>
              Submit
            </Button>
            <Button type="default" onClick={handleCancel}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DiscountListPage;
