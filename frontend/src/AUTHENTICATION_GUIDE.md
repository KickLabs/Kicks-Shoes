# 🔐 Authentication & Pet Management Guide

## Tổng quan

Hệ thống authentication và quản lý thú cưng hoàn chỉnh với Redux, mock data, và UI đẹp mắt.

## 🚀 Tính năng đã hoàn thiện

### ✅ Authentication System

- **Login/Register** - Đăng nhập và đăng ký với validation đầy đủ
- **Logout** - Đăng xuất với UI loading và thông báo
- **Role-based Access** - Phân quyền admin, user, doctor
- **Redux State Management** - Quản lý state với Redux Toolkit
- **Persistent Storage** - Lưu trữ token và user info
- **Header Integration** - Hiển thị thông tin user trong header

### ✅ Pet Management System

- **Pet Profile** - Quản lý hồ sơ thú cưng
- **CRUD Operations** - Tạo, xem, sửa, xóa thú cưng
- **Vaccination History** - Lịch sử tiêm phòng
- **Medical History** - Lịch sử khám bệnh
- **Booking Integration** - Chọn thú cưng khi đặt lịch

## 🎯 Mock Users để test

### Admin Account

```
Username: admin
Password: admin123
Role: admin
```

### User Accounts

```
Username: user1
Password: user123
Role: user

Username: user2
Password: user123
Role: user
```

### Doctor Accounts

```
Username: doctor1
Password: doctor123
Role: doctor

Username: doctor2
Password: doctor123
Role: doctor
```

## 🔧 Cách sử dụng

### 1. Đăng nhập/Đăng ký

- Truy cập `/login` để đăng nhập
- Truy cập `/register` để đăng ký tài khoản mới
- Sử dụng mock users ở trên để test

### 2. Quản lý thú cưng

- Truy cập `/pet-profile` để quản lý hồ sơ thú cưng
- Thêm thú cưng mới với đầy đủ thông tin
- Xem lịch sử tiêm phòng và khám bệnh
- Chỉnh sửa thông tin thú cưng

### 3. Đặt lịch khám

- Truy cập `/scheduling` để xem danh sách bác sĩ
- Chọn bác sĩ và đặt lịch
- **Bắt buộc chọn thú cưng** trước khi đặt lịch
- Nếu chưa có thú cưng, sẽ được chuyển hướng đến `/pet-profile`

### 4. Navigation

- Header hiển thị thông tin user khi đã đăng nhập
- Menu profile với thông tin chi tiết
- Nút đăng nhập/đăng ký khi chưa đăng nhập

## 🛠️ Technical Details

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    status: 'idle' | 'loading' | 'success' | 'error',
    error: string | null
  },
  pet: {
    pets: Pet[],
    currentPet: Pet | null,
    loading: boolean,
    error: string | null
  }
}
```

### Key Components

- **LoginPage** - `/login`
- **RegisterPage** - `/register`
- **Logout** - `/logout`
- **PetProfilePage** - `/pet-profile`
- **BookingPage** - `/scheduling/booking/:id`
- **Header** - Hiển thị thông tin user

### Routes

```
/login - Trang đăng nhập
/register - Trang đăng ký
/logout - Đăng xuất
/pet-profile - Quản lý thú cưng
/scheduling - Danh sách bác sĩ
/scheduling/booking/:id - Đặt lịch
```

## 🎨 UI Features

### Authentication UI

- Form validation với error messages
- Loading states với CircularProgress
- Toast notifications cho success/error
- Responsive design với Material-UI

### Pet Management UI

- Tab navigation (Danh sách, Tiêm phòng, Khám bệnh)
- Pet cards với ảnh đại diện
- Form dialog cho tạo/sửa thú cưng
- Empty states với hướng dẫn

### Header UI

- Hiển thị avatar và thông tin user
- Profile menu với thông tin chi tiết
- Auth buttons khi chưa đăng nhập
- Role-based display

## 🐛 Debug & Testing

### AuthTest Component

- Hiển thị trên trang chủ để test authentication
- Test login với admin account
- Test register với thông tin mới
- Hiển thị thông tin user khi đã đăng nhập

### Console Logs

- Redux actions được log ra console
- API calls với delay simulation
- Error handling với try/catch

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: xs, sm, md, lg, xl
- Touch-friendly buttons và inputs
- Optimized cho mobile devices

## 🔒 Security Features

- Token-based authentication
- Role-based access control
- Form validation
- Error handling
- Secure logout với token cleanup

## 🚀 Next Steps

1. Tích hợp với real API
2. Thêm email verification
3. Password reset functionality
4. File upload cho pet images
5. Push notifications
6. Real-time updates

---

**Lưu ý**: Đây là mock data system, tất cả dữ liệu sẽ reset khi reload trang. Để lưu trữ persistent, cần tích hợp với real backend API.
