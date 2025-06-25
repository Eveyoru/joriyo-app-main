import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import Axios from '../utils/Axios';
import Loading from '../components/Loading';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { FaBox, FaTruck, FaTimesCircle, FaClock } from 'react-icons/fa';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/api/order/order-list');
      if (response.data?.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to fetch orders');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <IoCheckmarkCircle className="text-green-500 text-xl" />;
      case 'processing':
        return <FaTruck className="text-blue-500 text-xl" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500 text-xl" />;
      default:
        return <FaClock className="text-yellow-500 text-xl" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <FaBox className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.orderId} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Order ID: {order.orderId}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status || 'Pending'}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <Link
                to={`/order-details/${order.orderId}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details
              </Link>
            </div>
            <div className="divide-y">
              {order.products?.map((product, idx) => (
                <div key={idx} className="p-4 flex items-center">
                  <div className="w-16 h-16 flex-shrink-0">
                    {product.image && product.image[0] && (
                      <img
                        src={product.image[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.selectedSize && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Size: {product.selectedSize}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{DisplayPriceInRupees((product.discountedPrice || product.price) * product.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Payment: {order.payment_status || 'Pending'}
              </div>
              <div className="font-medium">
                Total: {DisplayPriceInRupees(order.subTotalAmt || order.totalAmt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
