# Frontend API Documentation

## Base URL
```
Production: https://backend-ottoman-mitten.onrender.com
Development: http://localhost:5000

Note: The backend supports both /api/* and /* endpoint patterns:
- /api/auth/send-otp (recommended)
- /auth/send-otp (alternative)
```

## Authentication Flow

### 1. JWT Token Management
- All authenticated requests require a JWT token in the Authorization header
- Token format: `Bearer <token>`
- Token expires after 7 days
- Store token in localStorage or secure cookie

### 2. API Response Format
All API responses follow this standardized format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...} // or "user": {...}, "token": "...", etc.
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "details": "Additional error details (development only)"
}
```

## Authentication Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/auth/send-otp` (or `POST /auth/send-otp`)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP sent to email"
}
```

**Error Cases:**
- 400: Email is required
- 400: Invalid email format
- 500: Failed to send OTP

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp` (or `POST /auth/verify-otp`)

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP verified"
}
```

**Error Cases:**
- 400: Email and OTP are required
- 400: Invalid or expired OTP

### 3. User Signup
**Endpoint:** `POST /api/auth/signup` (or `POST /auth/signup`)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890" // optional
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

**Error Cases:**
- 400: Missing required fields
- 400: Invalid email format
- 400: Password must be at least 6 characters long
- 400: User already exists
- 500: Server error during signup

### 4. User Login
**Endpoint:** `POST /api/auth/login` (or `POST /auth/login`)

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "cart": []
  }
}
```

**Error Cases:**
- 401: Invalid email or password
- 500: Server error

### 5. Google OAuth Login
**Endpoint:** `POST /api/auth/google` (or `POST /auth/google`)

**Request Body:**
```json
{
  "credential": "google_id_token_here"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Google authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@gmail.com",
    "cart": [],
    "wishlist": []
  }
}
```

**Error Cases:**
- 400: No credential provided
- 401: Google authentication failed
- 500: Server configuration error

### 6. Get Current User Profile (Protected)
**Endpoint:** `GET /api/auth/profile` (or `GET /auth/profile`)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "profilePic": "https://example.com/avatar.jpg",
    "shippingAddress": {...},
    "billingAddress": {...},
    "cart": [],
    "wishlist": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Cases:**
- 401: Access token required
- 403: Invalid or expired token
- 404: User not found
- 500: Authentication failed

### 7. Update User Profile (Protected)
**Endpoint:** `PUT /api/auth/profile` (or `PUT /auth/profile`)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePic": "https://example.com/avatar.jpg",
  "shippingAddress": {
    "houseName": "123 Main St",
    "streetArea": "Downtown",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001"
  },
  "billingAddress": {
    "houseName": "123 Main St",
    "streetArea": "Downtown",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "profilePic": "https://example.com/avatar.jpg",
    "shippingAddress": {...},
    "billingAddress": {...},
    "cart": [],
    "wishlist": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Cases:**
- 401: Access token required
- 403: Invalid or expired token
- 404: User not found
- 500: Failed to update profile

### 8. Get User Profile by ID (Public)
**Endpoint:** `GET /api/auth/profile/:id` (or `GET /auth/profile/:id`)

**Response:**
```json
{
  "status": "success",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "profilePic": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Cases:**
- 404: User not found
- 500: Failed to fetch profile

## Frontend Implementation Examples

### 1. Axios Configuration
```javascript
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://backend-ottoman-mitten.onrender.com/api', // or use '/auth' instead of '/api/auth'
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Login Function
```javascript
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.status === 'success') {
      // Store token
      localStorage.setItem('authToken', response.data.token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 3. Signup Function
```javascript
const signup = async (userData) => {
  try {
    const response = await api.post('/auth/signup', userData);
    
    if (response.data.status === 'success') {
      // Store token
      localStorage.setItem('authToken', response.data.token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    }
  } catch (error) {
    console.error('Signup error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 4. Send OTP Function
```javascript
const sendOTP = async (email) => {
  try {
    const response = await api.post('/auth/send-otp', { email });
    
    if (response.data.status === 'success') {
      return response.data;
    }
  } catch (error) {
    console.error('Send OTP error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 5. Verify OTP Function
```javascript
const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    
    if (response.data.status === 'success') {
      return response.data;
    }
  } catch (error) {
    console.error('Verify OTP error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 6. Get User Profile Function
```javascript
const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    
    if (response.data.status === 'success') {
      return response.data.user;
    }
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 7. Update Profile Function
```javascript
const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    if (response.data.status === 'success') {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    }
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 8. Logout Function
```javascript
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
};
```

## CORS Configuration

The backend is configured to allow requests from:
- `https://ottomanmitten.com`
- `https://www.ottomanmitten.com`
- `http://localhost:3000` (development)
- `http://127.0.0.1:3000` (development)
- `http://localhost:3001` (development)
- `http://127.0.0.1:3001` (development)
- In development mode, all origins are allowed for easier testing

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created (signup)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (invalid/expired token)
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Structure
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "details": "Technical details (development only)"
}
```

## Security Considerations

1. **JWT Token Storage**: Store tokens securely in localStorage or httpOnly cookies
2. **Token Expiration**: Handle token expiration gracefully (redirect to login)
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: Validate all user inputs on frontend before sending to backend
5. **Error Messages**: Don't expose sensitive information in error messages

## Testing

### Test User Credentials
```javascript
// Test user for development
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};
```

### Test OTP
- OTP is sent to email
- OTP expires after 5 minutes
- OTP is 6 digits

## Notes

1. All timestamps are in ISO 8601 format
2. User IDs are MongoDB ObjectId strings (24 characters)
3. Passwords are hashed using bcrypt
4. Email addresses are validated using regex
5. Phone numbers are optional and stored as strings
6. Profile pictures should be URLs to image files
7. Addresses are stored as objects with specific fields

## Support

For any questions or issues with the API integration, please contact the backend development team. 