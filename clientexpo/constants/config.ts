// API configuration
export const API_URL = 'http://localhost:8080'; // Updated to use local IP address

// App configuration
export const APP_NAME = 'BlinkIt';
export const DEFAULT_CURRENCY = '₹';

// Image placeholders
export const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/150';
export const DEFAULT_CATEGORY_IMAGE = 'https://via.placeholder.com/100';
export const DEFAULT_USER_AVATAR = 'https://via.placeholder.com/50';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Order status colors
export const ORDER_STATUS_COLORS = {
  pending: '#FFA000',
  processing: '#2196F3',
  shipped: '#9C27B0',
  delivered: '#4CAF50',
  cancelled: '#F44336',
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Payment status colors
export const PAYMENT_STATUS_COLORS = {
  pending: '#FFA000',
  completed: '#4CAF50',
  failed: '#F44336',
  refunded: '#9E9E9E',
};

// Payment methods
export const PAYMENT_METHODS = {
  COD: 'Cash on Delivery',
  CARD: 'Credit/Debit Card',
  UPI: 'UPI',
  WALLET: 'Wallet',
};

// Delivery times
export const DELIVERY_TIMES = [
  { id: '1', label: 'As soon as possible' },
  { id: '2', label: 'Today, 2-4 PM' },
  { id: '3', label: 'Today, 4-6 PM' },
  { id: '4', label: 'Today, 6-8 PM' },
  { id: '5', label: 'Tomorrow, 10-12 AM' },
  { id: '6', label: 'Tomorrow, 12-2 PM' },
];

// Default delivery charge
export const DEFAULT_DELIVERY_CHARGE = 49; 