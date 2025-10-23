import React, { useEffect, useMemo, useState } from 'react';
import { Modal, List, Tag, Button, Typography, Space, message } from 'antd';
import {
  GiftOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import userDiscountService from '../../../../services/userDiscount.service';

const { Text } = Typography;

/**
 * VoucherPicker
 * Display list of vouchers user can use for current order
 * Allow selecting 1 voucher and return discountAmount via props.onApplied
 */
export default function VoucherPicker({ open, onClose, orderAmount = 0, onApplied }) {
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await userDiscountService.getUserDiscounts();
        if (res?.success && Array.isArray(res.data)) {
          setVouchers(res.data);
        } else {
          setVouchers([]);
        }
      } catch (e) {
        console.error('Failed to load vouchers', e);
        message.error('Unable to load vouchers.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const now = Date.now();

  const eligibleVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // Only show vouchers with 'saved' status
      if (v.status !== 'saved') {
        console.log('Voucher filtered out - status:', v.status, v.code);
        return false;
      }

      // Check validity period
      const from = v.validFrom ? new Date(v.validFrom).getTime() : 0;
      const to = v.validTo ? new Date(v.validTo).getTime() : Number.MAX_SAFE_INTEGER;
      if (now < from || now > to) {
        console.log('Voucher filtered out - expired:', v.code, { from, to, now });
        return false;
      }

      // Check minimum order amount
      if (v.minOrderAmount && orderAmount < v.minOrderAmount) {
        console.log('Voucher filtered out - min order amount:', v.code, {
          minOrderAmount: v.minOrderAmount,
          orderAmount,
        });
        return false;
      }

      console.log('Voucher eligible:', v.code);
      return true;
    });
  }, [vouchers, orderAmount, now]);

  const formatVnd = value =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  const renderDiscountText = v => {
    if (v.discountType === 'percentage') {
      const base = `${v.discountValue}%`;
      return v.maxDiscountAmount ? `${base} (max ${formatVnd(v.maxDiscountAmount)})` : base;
    }
    return `${formatVnd(v.discountValue)}`;
  };

  const handleApply = async voucher => {
    try {
      setApplyingId(voucher.id);

      // Debug info
      console.log('Applying voucher:', {
        code: voucher.code,
        orderAmount,
        voucher: voucher,
        minOrderAmount: voucher.minOrderAmount,
      });

      const res = await userDiscountService.validateDiscount(voucher.code, orderAmount);

      console.log('Validation response:', res);

      if (res?.success && res.data?.isValid) {
        const discountAmount = res.data.discountAmount || 0;
        message.success('Voucher applied successfully');
        onApplied?.({
          code: voucher.code,
          discountAmount,
          meta: res.data,
        });
        onClose?.();
      } else {
        const errorMsg =
          res?.data?.message || res?.message || 'Voucher is not valid for current order';
        console.error('Voucher validation failed:', { res, voucher, orderAmount });
        message.error(errorMsg);
      }
    } catch (e) {
      console.error('Apply voucher error', e);
      const errorMsg = e?.response?.data?.message || e?.message || 'Unable to apply voucher.';
      message.error(errorMsg);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <GiftOutlined />
          <span>Select a voucher to apply</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <List
        loading={loading}
        locale={{ emptyText: 'No eligible vouchers' }}
        dataSource={eligibleVouchers}
        renderItem={v => (
          <List.Item
            actions={[
              <Button
                key="apply"
                type="primary"
                loading={applyingId === v.id}
                onClick={() => handleApply(v)}
              >
                Apply
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{v.title || v.code}</Text>
                  <Tag color="green">
                    <CheckCircleOutlined /> Eligible
                  </Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Code: {v.code}</Text>
                  <Text>Benefit: {renderDiscountText(v)}</Text>
                  {v.minOrderAmount ? (
                    <Text type="secondary">
                      <DollarOutlined /> Min order: {formatVnd(v.minOrderAmount)}
                    </Text>
                  ) : null}
                  {(v.validFrom || v.validTo) && (
                    <Text type="secondary">
                      <CalendarOutlined />{' '}
                      {v.validFrom ? new Date(v.validFrom).toLocaleDateString('en-GB') : '—'}
                      {' - '}
                      {v.validTo ? new Date(v.validTo).toLocaleDateString('en-GB') : '—'}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
