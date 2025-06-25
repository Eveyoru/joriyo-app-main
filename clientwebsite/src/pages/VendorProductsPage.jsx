import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Axios from '../utils/Axios';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import CardProduct from '../components/CardProduct';
import Header from '../components/Header';
import Footer from '../components/Footer';

const VendorProductsPage = () => {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchVendorProducts();
    }
  }, [vendorId, page]);

  const fetchVendorDetails = async () => {
    try {
      const response = await Axios.get(`/api/vendor/get/${vendorId}`);
      if (response.data.success) {
        setVendor(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch vendor details');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      toast.error('Something went wrong while fetching vendor details');
    }
  };

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`/api/product/vendor/${vendorId}?page=${page}&limit=${limit}`);
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        toast.error(response.data.message || 'Failed to fetch vendor products');
      }
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      toast.error('Something went wrong while fetching vendor products');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="text-green-600 hover:text-green-800 flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to home
        </Link>

        {loading && !vendor ? (
          <Loading />
        ) : !vendor ? (
          <NoData message="Vendor not found" />
        ) : (
          <>
            {/* Vendor header */}
            <div className="mb-6">
              <div className="relative h-40 md:h-60 bg-gray-200 rounded-lg overflow-hidden">
                {vendor.coverImageUrl || vendor.coverImage ? (
                  <img
                    src={vendor.coverImageUrl || vendor.coverImage}
                    alt={`${vendor.name} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500" />
                )}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white">
                      <img
                        src={vendor.imageUrl || vendor.image}
                        alt={vendor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 text-white">
                      <h1 className="text-xl md:text-3xl font-bold">{vendor.name}</h1>
                      {vendor.description && (
                        <p className="text-sm md:text-base opacity-90 mt-1">{vendor.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Products</h2>
              {loading ? (
                <Loading />
              ) : products.length === 0 ? (
                <NoData message="No products available from this vendor" />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((product) => (
                      <CardProduct key={product._id} data={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={page === 1}
                          className={`px-4 py-2 rounded ${
                            page === 1
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          Previous
                        </button>
                        <span className="text-sm">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={page === totalPages}
                          className={`px-4 py-2 rounded ${
                            page === totalPages
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default VendorProductsPage;