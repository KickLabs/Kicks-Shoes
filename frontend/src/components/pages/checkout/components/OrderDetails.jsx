import { Card, Typography, Row, Col, Image, Space, Divider, Input } from 'antd';
import './OrderDetails.css';

const { Title, Text } = Typography;

export default function OrderDetails({ products = [], notes = '', setNotes }) {
  return (
    <div>
      <Card>
        <Title level={4} className="order-card-title">
          Order Details
        </Title>
        {products.map((product, idx) => {
          const isDiscount = product.price?.isOnSale && product.price?.discountPercent;
          const priceRegular = product.price?.regular || product.price;
          const priceDiscount = isDiscount
            ? priceRegular * (1 - product.price.discountPercent / 100)
            : priceRegular;
          return (
            <Row gutter={16} align="middle" key={product.id || idx} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Image
                  src={product.mainImage}
                  alt={product.name}
                  preview={false}
                  className="order-image"
                />
              </Col>
              <Col span={16}>
                <Text strong className="order-product-name">
                  {product.name}
                </Text>
                <Text type="secondary" className="order-product-description">
                  {product.description}
                </Text>
                <Text type="secondary" className="order-product-color">
                  {product.color}
                </Text>
                <Space className="order-product-info">
                  <Text strong>Size {product.size}</Text>
                  <Divider type="vertical" />
                  <Text strong>Quantity {product.quantity}</Text>
                </Space>
                <div>
                  {isDiscount ? (
                    <>
                      <Text
                        strong
                        style={{ fontSize: 20, color: 'rgb(74, 105, 226)', marginRight: 8 }}
                      >
                        ${priceDiscount.toFixed(2)}
                      </Text>

                      <Text delete style={{ fontSize: 16, marginLeft: 8 }}>
                        ${priceRegular.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text strong>${priceRegular.toFixed(2)}</Text>
                  )}
                </div>
              </Col>
            </Row>
          );
        })}
      </Card>
      <Card className="order-notes-card" style={{ marginTop: 32 }}>
        <label
          style={{
            fontWeight: 600,
            fontSize: 32,
            marginBottom: 8,
            display: 'block',
            color: '#222',
            marginTop: 0,
            fontFamily: 'Rubik',
          }}
        >
          Order Notes
        </label>
        <Input.TextArea
          value={notes}
          onChange={e => setNotes && setNotes(e.target.value)}
          placeholder="Add any notes for your order (if any)"
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={300}
          showCount
          style={{
            borderRadius: 10,
            background: '#fafbfc',
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 8px rgba(74,105,226,0.04)',
            padding: 12,
            fontSize: 15,
            marginTop: 4,
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = '#4A69E2')}
          onBlur={e => (e.target.style.borderColor = '#d9d9d9')}
        />
      </Card>
    </div>
  );
}
