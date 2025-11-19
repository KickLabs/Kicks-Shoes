# Login API Updates Summary

## Changes Made

### 1. **Updated Response Format**

Login API now returns:

```json
{
  "user": {
    "id": "68feac40906f7afbe1428693",
    "username": "huesuong",
    "email": "suongnhde180706@fpt.edu.vn",
    "role": "customer"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 2. **Updated Types** (`src/features/authenticate/types/index.ts`)

- Changed `User.id` from `number` to `string`
- Added `LoginResponse` interface
- Updated `User` role to include `'customer'`
- Made some User fields optional (fullName, phone, avatar, etc.)

### 3. **Updated Login API** (`src/features/authenticate/authAPI.ts`)

- Now returns `LoginResponse` directly with user, accessToken, refreshToken
- Removed unnecessary `userId` fetching
- Login directly uses data from API response

### 4. **Updated Auth Thunk** (`src/features/authenticate/authThunk.ts`)

- Login thunk now returns `{ user, accessToken, refreshToken }`
- No longer fetches user separately
- Verify register also updated to same format

### 5. **Updated Auth Slice** (`src/features/authenticate/authSlice.ts`)

- Changed `userId` type from `number` to `string`
- Login now stores accessToken and refreshToken in localStorage
- Both tokens are cleared on logout

### 6. **Token Storage**

- `token` → localStorage (accessToken)
- `refreshToken` → localStorage (refreshToken)
- `user` → localStorage (user object as JSON)
- All cleared on logout

### 7. **Axios Interceptor** (Already configured)

- Automatically adds `Bearer ${token}` to Authorization header
- No changes needed in `src/services/axiosInstance.ts`

## How It Works

### Login Flow

1. User submits login credentials
2. API returns user data + tokens
3. Store in Redux state and localStorage
4. Token automatically added to all future requests via interceptor

### Token Usage

- All API requests include `Authorization: Bearer ${token}` header
- Token retrieved from localStorage via axios interceptor
- Refresh token available for token renewal (not yet implemented)

### User Data

- User data stored directly from login response
- No separate fetch required
- Available immediately after login
