import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import Axios from '../utils/Axios';
import Loading from '../components/Loading';
import { IoCheckmarkCircle, IoEyeOutline, IoAlertCircle } from 'react-icons/io5';
import { FaBox, FaTruck, FaTimesCircle, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingOrderIds, setUpdatingOrderIds] = useState([]);
  const [statusMessages, setStatusMessages] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/api/order/all');
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Clear any previous status messages for this order
      setStatusMessages(prev => ({ ...prev, [orderId]: { type: 'loading', message: 'Updating...' } }));
      
      // Add this order to the updating list
      setUpdatingOrderIds(prev => [...prev, orderId]);
      toast.loading('Updating order status...');
      
      // Log the request details for debugging
      console.log('Updating order status:', { orderId, status: newStatus });
      
      // Using the exact route that matches our backend
      const response = await Axios({
        method: 'PUT',
        url: `/api/order/admin/update-status/${orderId}`,
        data: {
          status: newStatus.toLowerCase()
        }
      });

      console.log('Server response:', response.data);

      if (response.data?.success) {
        // Update the local state with the new status
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: newStatus.toLowerCase(), ...response.data.data }
              : order
          )
        );
        toast.success('Order status updated successfully');
        setStatusMessages(prev => ({ ...prev, [orderId]: { type: 'success', message: 'Status updated' } }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatusMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[orderId];
            return newMessages;
          });
        }, 3000);
      } else {
        // If the server returned a response but with success: false
        const errorMsg = response.data?.message || 'Failed to update status';
        toast.error(errorMsg);
        setStatusMessages(prev => ({ ...prev, [orderId]: { type: 'error', message: errorMsg } }));
        
        // Revert the dropdown to the original status
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order } // Keep the original state
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      toast.error(errorMessage);
      setStatusMessages(prev => ({ ...prev, [orderId]: { type: 'error', message: errorMessage } }));
      
      // Revert the dropdown to the original status on error
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order } // Keep the original state
            : order
        )
      );
    } finally {
      // Remove this order from the updating list
      setUpdatingOrderIds(prev => prev.filter(id => id !== orderId));
      toast.dismiss();
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      order.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">All Customer Orders</h1>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order ID or customer email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">{order.userId?.name}</div>
                      <div className="text-gray-500">{order.userId?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>{order.products?.length || 0} items</div>
                      {order.products && order.products.map((product, idx) => (
                        <div key={idx} className="text-xs text-gray-500 flex items-center">
                          <span className="truncate max-w-[120px]">
                            {product.name?.substring(0, 15)}{product.name?.length > 15 ? '...' : ''}
                          </span>
                          {product.selectedSize && (
                            <span className="ml-1 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                              Size: {product.selectedSize}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {DisplayPriceInRupees(order.subTotalAmt || order.totalAmt || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {updatingOrderIds.includes(order.orderId) ? (
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Updating...
                      </div>
                    ) : (
                      <select
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                    {statusMessages[order.orderId] && (
                      <div className={`mt-2 text-sm ${statusMessages[order.orderId].type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {statusMessages[order.orderId].message}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/order-details/${order.orderId}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <IoEyeOutline className="text-xl" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <FaBox className="mx-auto text-4xl text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrders;
