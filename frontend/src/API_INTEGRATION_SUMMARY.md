# API Integration Summary

This document summarizes the authentication API integration for the My Pet frontend application.

## Overview

The authentication system has been updated to integrate with the real API endpoints from `https://my-pet-api.onrender.com`.

## Environment Configuration

A `.env.local` file has been created with:

```
VITE_API_URL=https://my-pet-api.onrender.com
```

## API Endpoints Integrated

### 1. Register Request

- **Endpoint**: `POST /api/auth/register-request`
- **Payload**:

```json
{
  "fullname": "Dinh Quoc Huy",
  "username": "huy2004",
  "email": "huydqds180257@fpt.edu.vn",
  "password": "123"
}
```

- **Usage**: Sends registration request to backend. Requires OTP verification before completing registration.

### 2. Verify Register

- **Endpoint**: `POST /api/auth/verify-register`
- **Payload**:

```json
{
  "email": "huydqds180257@fpt.edu.vn",
  "otp": "534373"
}
```

- **Usage**: Verifies OTP and completes registration. Returns authentication token.

### 3. Login

- **Endpoint**: `POST /api/auth/login`
- **Payload**:

```json
{
  "usernameOrEmail": "admin",
  "password": "123"
}
```

- **Usage**: Authenticates user and returns access token.

### 4. Logout

- **Endpoint**: `POST /api/auth/logout`
- **Usage**: Logs out the user from the backend.

## Files Modified

### 1. `src/features/authenticate/types/index.ts`

- Added new type interfaces:
  - `RegisterRequestPayload`
  - `VerifyRegisterPayload`
  - `LoginRequestPayload`

### 2. `src/features/authenticate/authAPI.ts`

- Completely replaced mock implementations with real API calls
- Functions updated:
  - `loginAPI()` - Uses real login endpoint
  - `registerAPI()` - Sends register request
  - `verifyRegisterAPI()` - New function to verify OTP
  - `logoutAPI()` - New function to logout from backend
  - `getUserByIdAPI()` - Updated to use real API

### 3. `src/features/authenticate/authThunk.ts`

- Updated to import new API functions
- Added new thunks:
  - `verifyRegister` - Handles OTP verification
  - `logoutThunk` - Handles logout with API call

### 4. `src/features/authenticate/authSlice.ts`

- Added reducers for `verifyRegister` and `logoutThunk`
- Updated register reducer to handle two-step process

### 5. `src/features/authenticate/hooks/useAuth.ts`

- Added `handleVerifyRegister` function
- Updated `handleLogout` to use `logoutThunk`

### 6. `src/features/authenticate/pages/Logout.tsx`

- Updated to use `logoutThunk` instead of local `logout` action

### 7. `src/features/authenticate/context/AuthContext.tsx`

- Updated to use `logoutThunk` for API-based logout

## Registration Flow

The registration process now consists of two steps:

1. **Register Request**: User fills out form and submits. Backend sends OTP to email.
2. **OTP Verification**: User enters OTP code from email. Backend verifies and completes registration.

**Note**: The current `RegisterPage.tsx` only handles step 1. To complete the full flow, you'll need to add an OTP verification step to the registration page.

## Usage Examples

### Login

```typescript
const { login } = useAuth();
await login({
  username: 'admin',
  password: '123',
  rememberClient: true,
});
```

### Register

```typescript
const { register } = useAuth();
await register({
  username: 'huy2004',
  email: 'huydqds180257@fpt.edu.vn',
  password: '123',
  confirmPassword: '123',
  fullName: 'Dinh Quoc Huy',
  phone: '0123456789',
});
```

### Verify Register

```typescript
const { verifyRegister } = useAuth();
await verifyRegister({ email: 'huydqds180257@fpt.edu.vn', otp: '534373' });
```

### Logout

```typescript
const { logout } = useAuth();
await logout();
```

## Important Notes

1. **API Base URL**: The base URL is configured in `.env.local` as `VITE_API_URL`
2. **Axios Instance**: All API calls use the configured axios instance from `src/services/axiosInstance.ts`
3. **Authentication Token**: Tokens are automatically included in request headers via the axios interceptor
4. **Two-Step Registration**: The registration process requires OTP verification to complete

## Next Steps

1. **Add OTP Verification UI**: Update the `RegisterPage.tsx` to include an OTP input step after the initial registration request
2. **Handle API Response Structure**: You may need to adjust the response parsing based on the actual API response structure
3. **Error Handling**: Add proper error handling for API errors (network errors, validation errors, etc.)
