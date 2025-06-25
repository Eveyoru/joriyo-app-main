import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import { FaEdit, FaTag } from 'react-icons/fa';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching order details for ID:', orderId);
        
        toast.loading(`Fetching order: ${orderId}`);
        
        const response = await Axios.get(`/api/order/details/${orderId}`);
        console.log('API Response:', response);
        
        if (response.data?.success) {
          console.log('Order details received:', response.data.data);
          // Log the entire order for debugging
          console.log('FULL ORDER OBJECT:', JSON.stringify(response.data.data, null, 2));
          setOrder(response.data.data);
          toast.success('Order details loaded successfully');
        } else {
          console.error('API returned success:false -', response.data);
          setError(response.data?.message || 'Failed to fetch order details');
          toast.error(`Error: ${response.data?.message || 'Failed to fetch order details'}`);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        console.error('Error response:', error.response);
        setError(error.response?.data?.message || error.message || 'An error occurred');
        toast.error(`Error: ${error.response?.data?.message || error.message || 'An error occurred'}`);
        AxiosToastError(error);
      } finally {
        setLoading(false);
        toast.dismiss();
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Error Loading Order</h2>
          <div className="text-red-600 mb-4">{error}</div>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Error Message:</strong> {error}</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/dashboard/myorders" className="text-blue-600 hover:underline flex items-center">
              <IoArrowBack className="mr-1" /> Back to My Orders
            </Link>
            <Link to="/dashboard/allorders" className="text-blue-600 hover:underline flex items-center">
              <IoArrowBack className="mr-1" /> Back to All Orders
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="text-green-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-gray-600 mb-4">Order not found</div>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <p><strong>Order ID:</strong> {orderId}</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/dashboard/myorders" className="text-blue-600 hover:underline flex items-center">
              <IoArrowBack className="mr-1" /> Back to My Orders
            </Link>
            <Link to="/dashboard/allorders" className="text-blue-600 hover:underline flex items-center">
              <IoArrowBack className="mr-1" /> Back to All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleString();
  const orderStatus = order.status || 'Pending';
  const paymentStatus = order.payment_status || 'Pending';

  const products = order.products || [];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <div className="flex space-x-4">
          <Link to="/dashboard/myorders" className="text-blue-600 hover:underline flex items-center">
            <IoArrowBack className="mr-1" /> Back to My Orders
          </Link>
          <Link to="/dashboard/allorders" className="text-blue-600 hover:underline flex items-center">
            <IoArrowBack className="mr-1" /> Back to All Orders
          </Link>
        </div>
      </div>
      
      {/* Order Header */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Order ID: {order.orderId}</h1>
              <p className="text-gray-600">{orderDate}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatus.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Payment {paymentStatus}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  orderStatus.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' : 
                  orderStatus.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' :
                  orderStatus.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Order Items</h2>
            </div>
            <div className="divide-y">
              {products.map((product, index) => (
                <div key={index} className="p-4">
                  {/* Add prominent size indicator at the very top if available */}
                  <div className="mb-3 bg-blue-50 border-2 border-blue-300 p-2 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-blue-700">
                      Size: <span className="underline">{product.selectedSize || product.size || "Standard"}</span>
                    </span>
                    <span className="bg-blue-100 px-3 py-1 rounded-md text-sm font-semibold text-blue-800">
                      Selected Size
                    </span>
                  </div>
                  
                  <div className="flex">
                    <div className="w-16 h-16 flex-shrink-0 mr-4 border rounded overflow-hidden">
                      {product.image && product.image[0] && (
                        <img 
                          src={product.image[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{product.name}</h3>
                      </div>
                      
                      {/* Add size as a separate line item for better visibility */}
                      <div className="mt-2 flex items-center font-semibold text-blue-700">
                        <span className="mr-2">Ordered Size:</span> 
                        <span className="bg-blue-50 border-2 border-blue-200 px-4 py-1 rounded-lg">
                          {product.selectedSize || product.size || "Standard"}
                        </span>
                      </div>
                      
                      {/* Add console log for debugging */}
                      {console.log("Product in OrderDetails:", product)}
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span>{product.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Original Price:</span>
                          <span className="line-through text-gray-500">{DisplayPriceInRupees(product.originalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discounted Price:</span>
                          <span className="font-medium">{DisplayPriceInRupees(product.discountedPrice)}</span>
                        </div>
                        {product.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span className="flex items-center">
                              <FaTag className="mr-1" /> Discount:
                            </span>
                            <span>{product.discount}% off</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total:</span>
                          <span>{DisplayPriceInRupees(product.totalDiscountedPrice)}</span>
                        </div>
                        {product.totalSaved > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>You Saved:</span>
                            <span>{DisplayPriceInRupees(product.totalSaved)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="p-4 bg-gray-50 border-t">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Original Total</span>
                  <span className="line-through text-gray-500">{DisplayPriceInRupees(order.originalTotalAmt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{DisplayPriceInRupees(order.subTotalAmt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>Free</span>
                </div>
                {order.totalSaved > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Total Savings</span>
                    <span>{DisplayPriceInRupees(order.totalSaved)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{DisplayPriceInRupees(order.totalAmt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer Information */}
        <div className="lg:col-span-1">
          {/* Customer Details */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Customer</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-3">
                  {order.userId?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{order.userId?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.userId?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
            <div className="p-4">
              <p className="mb-2">{order.userId?.email || 'N/A'}</p>
              <p>{order.delivery_address?.mobile || 'No phone number'}</p>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
            </div>
            <div className="p-4">
              {order.delivery_address ? (
                <div>
                  <p className="font-medium">{order.userId?.name || 'N/A'}</p>
                  <p>{order.delivery_address.address_line}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.pincode}</p>
                  <p>{order.delivery_address.country}</p>
                  <p className="mt-2">+{order.delivery_address.mobile}</p>
                </div>
              ) : (
                <p className="text-gray-600">No shipping address provided</p>
              )}
            </div>
          </div>
          
          {/* Billing Address */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Billing Address</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600">Same as shipping address</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
