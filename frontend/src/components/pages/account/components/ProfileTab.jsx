import React from "react";
import { Button, Input, Select, DatePicker } from "antd";
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  ManOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "../account.css";
import TabHeader from "../../../common/components/TabHeader";

export default function ProfileTab() {
  return (
    <>
      <TabHeader breadcrumb="Profile" />
      <div className="profile-tab-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="avatar"
            />
            <button className="change-avatar-btn">
              <EditOutlined />
            </button>
          </div>
          <div className="profile-info">
            <h2>
              Johnathan Doe
              <span className="status" style={{ marginLeft: 8 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} /> Active
              </span>
            </h2>
            <div className="email">
              <MailOutlined /> johndoe123@email.com
            </div>
            <div className="point">
              <span role="img" aria-label="point" style={{ marginRight: 8 }}>
                🎁
              </span>
              Point: 12,450
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <Button className="profile-action-btn" type="default">
            Change Password
          </Button>
          <Button className="profile-action-btn" type="default">
            View Orders
          </Button>
          <Button className="profile-action-btn" type="default">
            Back to Homepage
          </Button>
        </div>
        <div className="profile-sections">
          <div className="profile-section">
            <div className="profile-section-title">Personal Information</div>
            <div className="profile-field">
              <label>
                <UserOutlined /> Full Name
              </label>
              <Input defaultValue="Johnathan Doe" />
            </div>
            <div className="profile-field">
              <label>
                <CalendarOutlined /> Date of Birth
              </label>
              <DatePicker
                defaultValue={null}
                style={{ width: "100%" }}
                placeholder="Select date of birth"
              />
            </div>
            <div className="profile-field">
              <label>
                <ManOutlined /> Gender
              </label>
              <Select defaultValue="male" style={{ width: "100%" }}>
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </div>
            <div className="profile-field">
              <label>
                <InfoCircleOutlined /> About Me
              </label>
              <Input.TextArea
                rows={2}
                placeholder="A short introduction about yourself..."
                defaultValue="Sneaker enthusiast. Love to collect and review the latest shoes."
              />
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-section-title">Account Information</div>
            <div className="profile-field">
              <label>
                <MailOutlined /> Email
              </label>
              <Input defaultValue="johndoe123@email.com" disabled />
            </div>
            <div className="profile-field">
              <label>
                <UserOutlined /> Username
              </label>
              <Input defaultValue="johnnydoe" />
            </div>
            <div className="profile-field">
              <label>
                <PhoneOutlined /> Phone Number
              </label>
              <Input defaultValue="(555) 123-4567" />
            </div>
            <div className="profile-field">
              <label>
                <HomeOutlined /> Address
              </label>
              <Input defaultValue="123 Main St, Springfield, USA" />
            </div>
            <div className="profile-field">
              <label>
                <CalendarOutlined /> Join Date
              </label>
              <Input defaultValue="03/15/2021" disabled />
            </div>
          </div>
        </div>
        <Button type="default" className="save-btn">
          Save Changes
        </Button>
      </div>
    </>
  );
}
