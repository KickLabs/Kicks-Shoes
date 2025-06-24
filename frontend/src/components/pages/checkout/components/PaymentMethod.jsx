import { CheckCircleTwoTone } from '@ant-design/icons';

const paymentOptions = [
  {
    value: 'cash_on_delivery',
    label: 'Cash on Delivery',
    img: 'https://cdn-icons-png.flaticon.com/512/2331/2331943.png', // icon tiền mặt
  },
  {
    value: 'vnpay',
    label: 'VNPAY',
    img: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png',
  },
];

export default function PaymentMethod({ value, onChange }) {
  return (
    <div style={{ margin: '24px 0' }}>
      <label
        style={{ fontWeight: 600, fontSize: 32, marginBottom: 8, display: 'block', color: '#222' }}
      >
        Payment Method
      </label>
      <div style={{ display: 'flex', gap: 24 }}>
        {paymentOptions.map(option => (
          <div
            key={option.value}
            onClick={() => onChange({ target: { value: option.value } })}
            style={{
              cursor: 'pointer',
              border: value === option.value ? '2px solid #4A69E2' : '1px solid #d9d9d9',
              borderRadius: 12,
              padding: 16,
              minWidth: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: value === option.value ? '#f0f6ff' : '#fafbfc',
              boxShadow: value === option.value ? '0 2px 8px rgba(74,105,226,0.08)' : 'none',
              position: 'relative',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <img
              src={option.img}
              alt={option.label}
              style={{ width: 48, height: 48, marginBottom: 12 }}
            />
            <span style={{ fontWeight: 500, fontSize: 15 }}>{option.label}</span>
            <input
              type="checkbox"
              checked={value === option.value}
              readOnly
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                accentColor: '#4A69E2',
                width: 18,
                height: 18,
              }}
            />
            {value === option.value && (
              <CheckCircleTwoTone
                twoToneColor="#4A69E2"
                style={{ position: 'absolute', top: 10, right: 10, fontSize: 22 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
