# BLINKIT Expo App - API Documentation

This document outlines all the features and APIs that the BLINKIT Expo app connects to, including the available endpoints and functionality.

## Base Configuration

The app connects to a backend server at: `http://192.168.18.198:8080`

## Authentication APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/user/register` | POST | Register a new user | `{ name, email, password }` |
| `/api/user/verify-email` | POST | Verify email with OTP | `{ email, otp }` |
| `/api/user/login` | POST | Login user | `{ email, password }` |
| `/api/user/logout` | GET | Logout user | - |
| `/api/user/forgot-password` | POST | Request password reset | `{ email }` |
| `/api/user/reset-password` | POST | Reset password with token | `{ email, newPassword, token }` |
| `/api/user/refresh-token` | POST | Refresh authentication token | `{ refreshToken }` |

## User Profile APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/user/profile` | GET | Get user profile | - |
| `/api/user/update-profile` | PUT | Update user details | `{ name, email, mobile }` |
| `/api/user/upload-avatar` | POST | Upload user avatar | `FormData` |

## Address APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/user/addresses` | GET | Get user addresses | - |
| `/api/user/add-address` | POST | Add new address | `{ address_line, city, state, pincode, country, mobile }` |
| `/api/user/update-address` | PUT | Update address | `{ addressId, address_line, city, state, pincode, country, mobile }` |
| `/api/user/delete-address` | DELETE | Delete address | `{ addressId }` |

## Order APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/order/place-order` | POST | Place a new order | `{ list_items, totalAmt, subTotalAmt, addressId }` |
| `/api/order/get-orders` | GET | Get user orders | - |
| `/api/order/get-order-details` | GET | Get order details | `{ orderId }` |

## Product APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/product/get` | POST | Get all products | `{}` |
| `/api/product/get` | POST | Get featured products | `{ featured: true }` |
| `/api/product/get-product-by-category` | POST | Get products by category | `{ id: categoryId }` |
| `/api/product/get-pruduct-by-category-and-subcategory` | POST | Get products by category and subcategory | `{ categoryId, subCategoryId, page, limit }` |
| `/api/product/get-product-details` | POST | Get product details | `{ productId }` |

## Category APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/category/get` | GET | Get all categories | - |

## Subcategory APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/subcategory/get` | POST | Get all subcategories | - |
| `/api/subcategory/get` | POST | Get subcategories by category | `{ categoryId }` |

## Banner APIs

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/banner/get-active` | GET | Get active banners | - |

## Health Check

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/health` | GET | Check server health | - |

## App Features

The BLINKIT Expo app provides the following features:

### Authentication
- User registration with email verification
- Login with email and password
- Password reset functionality
- Token-based authentication with refresh tokens

### User Profile Management
- View and update user profile information
- Upload profile picture
- Manage multiple delivery addresses

### Shopping Experience
- Browse products by categories and subcategories
- View product details including images, price, and description
- Add products to cart
- Place orders with delivery address selection

### Home Screen
- Banner carousel with promotional content
- Category navigation
- Featured products section

### Order Management
- View order history
- Track order status
- View order details

### UI Components
- Banner carousel using React Native Reanimated
- Category grid with icons
- Product cards with images and pricing information
- Address management interface
- Order history and details interface

## Data Models

### User
```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string;
}
```

### Product
```typescript
interface Product {
  _id: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  quantity: number;
  unit?: string;
  image?: string | { url: string }[];
  images?: string[] | { url: string }[];
  categoryId?: string;
  isActive?: boolean;
  stock?: number | null;
}
```

### Category
```typescript
interface Category {
  _id: string;
  name: string;
  icon?: string;
  image: string;
  displayOrder?: number;
  isActive: boolean;
}
```

### SubCategory
```typescript
interface SubCategory {
  _id: string;
  category: Array<{
    _id: string;
    name: string;
  }>;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
}
```

### Banner
```typescript
interface Banner {
  _id: string;
  title: string;
  image: string;
  description?: string;
  url?: string;
  isActive: boolean;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
}
```

### Address
```typescript
interface Address {
  _id: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
}
```

### Order
```typescript
interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  subTotalAmount: number;
  status: string;
  address: Address;
  createdAt: string;
}
```

### OrderItem
```typescript
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
```
