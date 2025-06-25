import React, { useState, useEffect, useRef } from 'react';
import BannerSlider from '../components/BannerSlider';
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay';
import VendorGrid from '../components/VendorGrid';
import Axios from '../utils/Axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AxiosToastError from '../utils/AxiosToastError';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  // ... existing code and states

  // Add useEffect to fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await Axios.get('/api/category/get');
      
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      AxiosToastError(error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ... rest of existing code and functions

  return (
    <section className='bg-white'>
      <div className='container mx-auto'>
        <BannerSlider />
      </div>
      
      {/* Featured This Week Section */}
      {/* ... existing featured section code ... */}
      
      <div className='container mx-auto px-4'>
        <VendorGrid />
        
        {/* Display category-wise products */}
        {loadingCategories ? (
          <div className="animate-pulse my-8">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-200 h-64 rounded"></div>
              ))}
            </div>
          </div>
        ) : categories.length > 0 ? (
          // Map through categories and render CategoryWiseProductDisplay for each
          categories.map(category => (
            <CategoryWiseProductDisplay 
              key={category._id} 
              id={category._id} 
              name={category.name} 
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p>No categories available</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Home; 