import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import Loading from './Loading';
import { IoFilter, IoEyeOutline } from "react-icons/io5";
import { FaSort } from "react-icons/fa6";
import { useSelector } from 'react-redux';
import isAdmin from '../utils/isAdmin';

const AllOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const user = useSelector(state => state.user);

  const fetchOrders = async () => {
    // Skip if we've already attempted a fetch or if the user isn't an admin
    if (fetchAttempted || !isAdmin(user?.role)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await Axios.get(SummaryApi.getAllOrders.url);
      
      console.log('Orders response:', response);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setOrders(response.data.data);
        setFilteredOrders(response.data.data);
      } else {
        setOrders([]);
        setFilteredOrders([]);
        setError('No orders data available');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setFilteredOrders([]);
      setError(error.message || 'Failed to fetch orders');
      AxiosToastError(error);
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  useEffect(() => {
    // Only attempt to fetch orders if the user is logged in and is an admin
    if (user && isAdmin(user.role)) {
      fetchOrders();
    } else if (user && !isAdmin(user.role)) {
      // Redirect non-admin users
      navigate('/');
    }
  }, [user]);

  // Reset fetch attempted when user changes
  useEffect(() => {
    setFetchAttempted(false);
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [orders, filterStatus, searchTerm]);

  const applyFilters = () => {
    let result = [...orders];
    
    if (filterStatus !== 'all') {
      result = result.filter(order => 
        order.status && order.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(order => 
        (order.orderId && order.orderId.toLowerCase().includes(search)) ||
        (order._id && order._id.toLowerCase().includes(search)) ||
        (order.userId && order.userId.name && order.userId.name.toLowerCase().includes(search)) ||
        (order.userId && order.userId.email && order.userId.email.toLowerCase().includes(search))
      );
    }
    
    setFilteredOrders(result);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const handleStatusFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewOrderDetails = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  if (loading) {
    return (
      <section className='p-4'>
        <div className='bg-white shadow-md rounded-lg p-4'>
          <div className='text-center'>Loading orders...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='p-4'>
        <div className='bg-white shadow-md rounded-lg p-4'>
          <div className='text-red-600'>{error}</div>
          <button 
            onClick={fetchOrders}
            className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      const accessToken = localStorage.getItem('accesstoken');
      
      const response = await fetch(`/api/order/update-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({
          status: newStatus
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Status updated successfully:', data);
        fetchOrders();
      } else {
        console.error('Failed to update status:', data);
        alert(`Failed to update status: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      AxiosToastError(error);
    }
  };

  return (
    <section className='p-4'>
      <div className='bg-white shadow-md rounded-lg'>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-gray-100 text-xs">
            <p>Total Orders: {orders?.length || 0}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        )}
        <div className='p-4 border-b flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>All Customer Orders</h2>
          <div className='text-sm text-gray-500'>
            Total Orders: {orders.length}
          </div>
        </div>

        <div className='p-4'>
          <div className='flex flex-wrap gap-4 mb-4'>
            <div className='flex-1 min-w-[200px]'>
              <input
                type='text'
                placeholder='Search by order ID or customer name...'
                className='px-3 py-2 border rounded-lg w-full'
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className='flex gap-2 items-center'>
              <IoFilter className="text-gray-500" />
              <select
                className='px-3 py-2 border rounded-lg'
                value={filterStatus}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='p-3 text-left font-semibold cursor-pointer hover:bg-gray-100' 
                      onClick={() => handleSort('orderId')}>
                    Order ID <FaSort className='inline ml-1' />
                  </th>
                  <th className='p-3 text-left font-semibold cursor-pointer hover:bg-gray-100' 
                      onClick={() => handleSort('createdAt')}>
                    Date <FaSort className='inline ml-1' />
                  </th>
                  <th className='p-3 text-left font-semibold'>Customer Details</th>
                  <th className='p-3 text-left font-semibold'>Order Items</th>
                  <th className='p-3 text-left font-semibold cursor-pointer hover:bg-gray-100' 
                      onClick={() => handleSort('totalAmt')}>
                    Total Amount <FaSort className='inline ml-1' />
                  </th>
                  <th className='p-3 text-left font-semibold'>Status</th>
                  <th className='p-3 text-center font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className='border-b hover:bg-gray-50'>
                      <td className='p-3 font-medium'>{order.orderId}</td>
                      <td className='p-3'>
                        {new Date(order.createdAt).toLocaleDateString()}
                        <div className='text-xs text-gray-500'>
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{order.userId?.name || 'N/A'}</span>
                          <span className='text-sm text-gray-500'>{order.userId?.email || 'N/A'}</span>
                          {order.shippingAddress && (
                            <span className='text-xs text-gray-500 mt-1'>
                              {order.shippingAddress}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='max-h-20 overflow-y-auto'>
                          {order.products && order.products.length > 0 ? (
                            order.products.map((item, idx) => (
                              <div key={idx} className='text-sm mb-1 flex justify-between'>
                                <span>{item.name || 'N/A'}</span>
                                <span className='text-gray-500'>×{item.quantity || 1}</span>
                              </div>
                            ))
                          ) : order.list_items && order.list_items.length > 0 ? (
                            order.list_items.map((item, idx) => (
                              <div key={idx} className='text-sm mb-1 flex justify-between'>
                                <span>{item.productId?.name || 'N/A'}</span>
                                <span className='text-gray-500'>×{item.quantity || 1}</span>
                              </div>
                            ))
                          ) : (
                            <div className='text-sm text-gray-500'>No items</div>
                          )}
                        </div>
                      </td>
                      <td className='p-3 font-medium'>{DisplayPriceInRupees(order.totalAmt || 0)}</td>
                      <td className='p-3'>
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-sm font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className='p-3 text-center'>
                        <button 
                          onClick={() => handleViewOrderDetails(order.orderId)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                          title="View Order Details"
                        >
                          <IoEyeOutline size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className='text-center py-4 text-gray-500'>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllOrders;