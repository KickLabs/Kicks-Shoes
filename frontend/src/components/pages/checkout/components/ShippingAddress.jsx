import { Card, Col, Form, Input, Radio, Row, Select, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
  fetchProvinces,
  fetchWards,
  formatProvinceName,
  formatWardName,
} from '../../../../utils/vietnamProvinceApi';
import './ShippingAddress.css';

const { Title, Text } = Typography;

export default function ShippingAddress({ form, user }) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [addressOption, setAddressOption] = useState('default'); // 'default' or 'custom'

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingProvinces(true);
        const data = await fetchProvinces();
        if (mounted) setProvinces(data);
      } catch (e) {
        // noop; UI can stay empty
      } finally {
        if (mounted) setLoadingProvinces(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleProvinceChange = async value => {
    form.setFieldsValue({
      provinceCode: value,
      wardCode: undefined,
      provinceName: undefined,
      wardName: undefined,
    });
    const province = provinces.find(p => String(p.code) === String(value));
    form.setFieldsValue({ provinceName: formatProvinceName(province) });
    try {
      setLoadingWards(true);
      const wardList = await fetchWards(value);
      setWards(wardList);
    } catch (e) {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = value => {
    form.setFieldsValue({ wardCode: value });
    const ward = wards.find(w => String(w.code) === String(value));
    form.setFieldsValue({ wardName: formatWardName(ward) });
  };

  const handleAddressOptionChange = e => {
    const option = e.target.value;
    setAddressOption(option);

    if (option === 'default') {
      // Reset form to user's default address
      if (user) {
        form.setFieldsValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          address: user.address || '',
          phone: user.phone || '',
          provinceCode: undefined,
          wardCode: undefined,
          provinceName: undefined,
          wardName: undefined,
        });
      }
    } else {
      // Clear form for custom address
      form.setFieldsValue({
        firstName: '',
        lastName: '',
        address: '',
        phone: '',
        provinceCode: undefined,
        wardCode: undefined,
        provinceName: undefined,
        wardName: undefined,
      });
    }
  };

  const getDefaultAddressDisplay = () => {
    if (!user) return 'No default address available';

    const parts = [];
    if (user.fullName) parts.push(user.fullName);
    if (user.address) parts.push(user.address);
    if (user.phone) parts.push(user.phone);

    return parts.length > 0 ? parts.join(', ') : 'No default address available';
  };

  return (
    <Card className="shipping-address-card">
      <Title level={4} className="shipping-address-title">
        Shipping Address
      </Title>

      {/* Address Option Selection */}
      <div style={{ marginBottom: 24 }}>
        <Radio.Group
          value={addressOption}
          onChange={handleAddressOptionChange}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio value="default" style={{ width: '100%' }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Use default address</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {getDefaultAddressDisplay()}
                </Text>
              </div>
            </Radio>
            <Radio value="custom" style={{ width: '100%' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Enter different shipping address</div>
              </div>
            </Radio>
          </Space>
        </Radio.Group>
      </div>

      {/* Address Form - only show when custom is selected */}
      {addressOption === 'custom' && (
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" className="shipping-address-item">
                <Input
                  placeholder="First Name*"
                  size="large"
                  className="shipping-address-input"
                  value={user?.fullName}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" className="shipping-address-item">
                <Input
                  placeholder="Last Name*"
                  size="large"
                  className="shipping-address-input"
                  value={user?.lastName}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="provinceCode"
                className="shipping-address-item"
                rules={[{ required: true, message: 'Please select province/city' }]}
              >
                <Select
                  showSearch
                  placeholder="Select Province/City*"
                  size="large"
                  loading={loadingProvinces}
                  optionFilterProp="label"
                  onChange={handleProvinceChange}
                  options={provinces.map(p => ({ label: formatProvinceName(p), value: p.code }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="wardCode"
                className="shipping-address-item"
                rules={[{ required: true, message: 'Please select ward/commune' }]}
              >
                <Select
                  showSearch
                  placeholder="Select Ward/Commune*"
                  size="large"
                  disabled={!form.getFieldValue('provinceCode')}
                  loading={loadingWards}
                  optionFilterProp="label"
                  onChange={handleWardChange}
                  options={wards.map(w => ({ label: formatWardName(w), value: w.code }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" className="shipping-address-item">
            <Input
              placeholder="Detailed Address (street, building, etc.)*"
              size="large"
              className="shipping-address-input"
              value={user?.address}
            />
          </Form.Item>
          {/* Hidden fields to carry display names for composition */}
          <Form.Item name="provinceName" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="wardName" hidden>
            <Input />
          </Form.Item>
          <Text type="secondary" className="shipping-address-note">
            Start typing your street address or zip code for suggestion
          </Text>

          <Form.Item name="phone" className="shipping-address-item">
            <Input placeholder="Phone Number*" size="large" className="shipping-address-input" />
          </Form.Item>
          <Text type="secondary" className="shipping-address-note">
            E.g. (123) 456-7890
          </Text>
        </Form>
      )}
    </Card>
  );
}
