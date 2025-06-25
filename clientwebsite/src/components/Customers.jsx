import React, { useState, useEffect } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { IoFilter, IoSearch, IoEyeOutline, IoMailOutline, IoCallOutline, IoHomeOutline, IoCloseOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import isAdmin from '../utils/isAdmin';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const user = useSelector(state => state.user);

  const fetchCustomers = async () => {
    // Skip if we've already attempted a fetch or if the user isn't an admin
    if (fetchAttempted || !isAdmin(user?.role)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await Axios.get(SummaryApi.getAllCustomers.url);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setCustomers(response.data.data);
        setFilteredCustomers(response.data.data);
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
        setError('No customers data available');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setFilteredCustomers([]);
      setError(error.message || 'Failed to fetch customers');
      AxiosToastError(error);
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  useEffect(() => {
    // Only attempt to fetch customers if the user is logged in and is an admin
    if (user && isAdmin(user.role)) {
      fetchCustomers();
    } else if (user && !isAdmin(user.role)) {
      // Redirect non-admin users
      navigate('/');
    }
  }, [user]);

  // Reset fetch attempted when user changes
  useEffect(() => {
    setFetchAttempted(false);
  }, [user?.id]);

  // Apply filters whenever statusFilter or searchTerm changes
  useEffect(() => {
    applyFilters();
  }, [customers, statusFilter, searchTerm]);

  // Function to apply filters and search
  const applyFilters = () => {
    let result = [...customers];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(customer => 
        customer.status && customer.status === statusFilter
      );
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(customer => 
        // Search by name
        (customer.name && customer.name.toLowerCase().includes(search)) ||
        // Search by email
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        // Search by mobile
        (customer.mobile && customer.mobile.toString().includes(search))
      );
    }
    
    setFilteredCustomers(result);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleViewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleViewCustomerAddresses = (customer) => {
    setSelectedCustomer(customer);
    setShowAddressModal(true);
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowAddressModal(false);
  };

  // Customer Details Modal Component
  const CustomerDetailsModal = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Details</h2>
            <button 
              onClick={closeModals}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <IoCloseOutline size={24} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-semibold">
                {selectedCustomer.avatar ? (
                  <img 
                    src={selectedCustomer.avatar} 
                    alt={selectedCustomer.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  selectedCustomer.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                <p className="text-gray-500">{selectedCustomer.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IoMailOutline className="text-gray-500" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoCallOutline className="text-gray-500" />
                    <span>{selectedCustomer.mobile || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Account Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCustomer.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedCustomer.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                      selectedCustomer.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedCustomer.status || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span>Email Verified:</span>
                    <span className="ml-2">
                      {selectedCustomer.verify_email ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Activity</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Last Login:</span>
                    <span className="ml-2">
                      {formatDate(selectedCustomer.last_login_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined Date:</span>
                    <span className="ml-2">
                      {formatDate(selectedCustomer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Orders</h4>
                <div>
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="ml-2">
                    {selectedCustomer.orderHistory ? selectedCustomer.orderHistory.length : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Customer Addresses Modal Component
  const CustomerAddressesModal = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Addresses</h2>
            <button 
              onClick={closeModals}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <IoCloseOutline size={24} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <h3 className="font-medium">{selectedCustomer.name}'s Addresses</h3>
            </div>
            
            {selectedCustomer.address_details && selectedCustomer.address_details.length > 0 ? (
              <div className="grid gap-4">
                {selectedCustomer.address_details.map((address, index) => (
                  <div key={address._id || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{address.type || 'Address'} {index + 1}</h4>
                        <div className="mt-1 text-gray-600">
                          {address.street && <div>{address.street}</div>}
                          {address.city && address.state && (
                            <div>{address.city}, {address.state}</div>
                          )}
                          {address.zip && <div>ZIP: {address.zip}</div>}
                          {address.country && <div>{address.country}</div>}
                        </div>
                      </div>
                      {address.isDefault && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No addresses found for this customer.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className='p-4'>
        <div className='bg-white shadow-md rounded-lg p-4'>
          <div className='text-center'>Loading customers...</div>
        </div>
      </section>
    );
  }

  return (
    <section className='p-4'>
      <div className='bg-white shadow-md rounded-lg'>
        <div className='p-4 border-b flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>All Customers</h2>
          <div className='text-sm text-gray-500'>
            Total Customers: {filteredCustomers.length}
          </div>
        </div>

        <div className='p-4'>
          <div className='flex flex-wrap gap-4 mb-4'>
            <div className='flex-1 min-w-[200px]'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search by name, email or phone...'
                  className='pl-10 pr-3 py-2 border rounded-lg w-full'
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <IoSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              </div>
            </div>
            <div className='flex gap-2 items-center'>
              <IoFilter className="text-gray-500" />
              <select
                className='px-3 py-2 border rounded-lg'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='p-3 text-left font-semibold'>Name</th>
                  <th className='p-3 text-left font-semibold'>Email</th>
                  <th className='p-3 text-left font-semibold'>Phone</th>
                  <th className='p-3 text-left font-semibold'>Status</th>
                  <th className='p-3 text-left font-semibold'>Last Login</th>
                  <th className='p-3 text-left font-semibold'>Joined Date</th>
                  <th className='p-3 text-center font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer._id} className='border-b hover:bg-gray-50'>
                      <td className='p-3 font-medium'>
                        <div className='flex items-center'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-blue-600'>
                            {customer.avatar ? (
                              <img 
                                src={customer.avatar} 
                                alt={customer.name} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              customer.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          {customer.name}
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center'>
                          <IoMailOutline className='mr-1 text-gray-500' />
                          {customer.email}
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center'>
                          <IoCallOutline className='mr-1 text-gray-500' />
                          {customer.mobile || 'N/A'}
                        </div>
                      </td>
                      <td className='p-3'>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'Active' ? 'bg-green-100 text-green-800' :
                          customer.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                          customer.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status || 'Unknown'}
                        </span>
                      </td>
                      <td className='p-3 text-sm'>
                        {formatDate(customer.last_login_date)}
                      </td>
                      <td className='p-3 text-sm'>
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className='p-3 text-center'>
                        <div className='flex justify-center space-x-2'>
                          <button
                            className='text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors'
                            title='View Customer Details'
                            onClick={() => handleViewCustomerDetails(customer)}
                          >
                            <IoEyeOutline size={18} />
                          </button>
                          <button
                            className='text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors'
                            title='View Customer Addresses'
                            onClick={() => handleViewCustomerAddresses(customer)}
                          >
                            <IoHomeOutline size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className='text-center py-4 text-gray-500'>
                      {error || 'No customers found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Render Modals */}
      {showDetailsModal && <CustomerDetailsModal />}
      {showAddressModal && <CustomerAddressesModal />}
    </section>
  );
};

export default Customers;
