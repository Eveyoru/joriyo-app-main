import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Axios from '../utils/Axios';
import { toast } from 'react-hot-toast';
import Loading from './Loading';
import NoData from './NoData';

const VendorGrid = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/api/vendor/get-active');
      if (response.data.success) {
        setVendors(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Something went wrong while fetching vendors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!vendors || vendors.length === 0) return <NoData message="No vendors available" />;

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-4">Our Vendors</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {vendors.map((vendor) => (
          <Link
            key={vendor._id}
            to={`/vendor/${vendor._id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative pb-[100%] bg-gray-100">
              <img
                src={vendor.imageUrl || vendor.image}
                alt={vendor.name}
                className="absolute object-cover w-full h-full"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-800">{vendor.name}</h3>
              {vendor.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{vendor.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VendorGrid; 