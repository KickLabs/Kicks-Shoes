import React, { useState, useEffect } from "react";
import { Button, Input, Select, DatePicker, Spin, message, Form } from "antd";
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
import { useAuth } from "../../../../contexts/AuthContext";
import dayjs from "dayjs";

export default function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        gender: user.gender || "male",
        aboutMe: user.aboutMe,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewImg = document.querySelector(".profile-avatar img");
        if (previewImg) {
          previewImg.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === "dateOfBirth") {
            formData.append(key, values[key].toISOString());
          } else {
            formData.append(key, values[key]);
          }
        }
      });
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      const updatedUser = await updateProfile(formData);
      console.log('Updated user:', updatedUser);
      
      // Cập nhật preview ảnh ngay lập tức nếu có URL mới
      if (updatedUser && updatedUser.avatar) {
        const previewImg = document.querySelector(".profile-avatar img");
        if (previewImg) {
          previewImg.src = updatedUser.avatar;
        }
      }
      
      message.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      message.error(error.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TabHeader breadcrumb="Profile" />
      <div className="profile-tab-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <img 
              src={user.avatar || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"} 
              alt="avatar" 
              onError={(e) => {
                console.log('Avatar load error, falling back to default');
                e.target.src = "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png";
                return true; // Prevent infinite error loop
              }}
            />
            <label className="change-avatar-btn">
              <EditOutlined />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div className="profile-info">
            <h2>
              {user.fullName}
              <span className="status" style={{ marginLeft: 8 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} /> Active
              </span>
            </h2>
            <div className="email">
              <MailOutlined /> {user.email}
            </div>
            <div className="point">
              <span role="img" aria-label="point" style={{ marginRight: 8 }}>
                🎁
              </span>
              Point: {user.reward_point || 0}
            </div>
          </div>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="profile-sections-form"
          style={{ width: "100%" }}
        >
          <div
            className="profile-sections-row"
            style={{ display: "flex", gap: 32 }}
          >
            <div className="profile-section" style={{ flex: 1 }}>
              <div className="profile-section-title">Personal Information</div>
              <Form.Item
                name="fullName"
                label={
                  <label>
                    <UserOutlined /> Full Name
                  </label>
                }
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="dateOfBirth"
                label={
                  <label>
                    <CalendarOutlined /> Date of Birth
                  </label>
                }
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="gender"
                label={
                  <label>
                    <ManOutlined /> Gender
                  </label>
                }
              >
                <Select>
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="aboutMe"
                label={
                  <label>
                    <InfoCircleOutlined /> About Me
                  </label>
                }
              >
                <Input.TextArea
                  rows={2}
                  placeholder="A short introduction about yourself..."
                />
              </Form.Item>
            </div>
            <div className="profile-section" style={{ flex: 1 }}>
              <div className="profile-section-title">Account Information</div>
              <Form.Item
                name="email"
                label={
                  <label>
                    <MailOutlined /> Email
                  </label>
                }
              >
                <Input disabled />
              </Form.Item>
              <Form.Item
                name="username"
                label={
                  <label>
                    <UserOutlined /> Username
                  </label>
                }
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="phone"
                label={
                  <label>
                    <PhoneOutlined /> Phone Number
                  </label>
                }
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label={
                  <label>
                    <HomeOutlined /> Address
                  </label>
                }
              >
                <Input />
              </Form.Item>
              <Form.Item
                label={
                  <label>
                    <CalendarOutlined /> Join Date
                  </label>
                }
              >
                <Input
                  value={new Date(user.createdAt).toLocaleDateString()}
                  disabled
                />
              </Form.Item>
            </div>
          </div>
        </Form>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            className="save-btn"
            loading={loading}
            style={{ minWidth: 180, fontWeight: 600, fontSize: 18 }}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}
