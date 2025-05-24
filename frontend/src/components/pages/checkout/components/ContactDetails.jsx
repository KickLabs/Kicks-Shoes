import { Card, Typography, Form, Input } from "antd"
import "./ContactDetails.css"

const { Title, Paragraph } = Typography

export default function ContactDetails({ form }) {
  return (
    <Card className="contact-card">
      <Title level={4} className="contact-title">
        Contact Details
      </Title>
      <Paragraph className="contact-paragraph">
        We will use these details to keep you informed about your delivery.
      </Paragraph>

      <Form form={form} layout="vertical">
        <Form.Item name="email" className="contact-form-item">
          <Input
            placeholder="Email"
            size="large"
            className="contact-input"
          />
        </Form.Item>
      </Form>
    </Card>
  )
}
