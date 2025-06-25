import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import CardProduct from '../components/CardProduct';
import { FaArrowLeft } from 'react-icons/fa6';

const VendorDetailPage = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchVendorDetails();
            fetchVendorProducts();
        }
    }, [id]);

    const fetchVendorDetails = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getVendorById,
                data: { _id: id }
            });

            if (response.data.success) {
                setVendor(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching vendor details:", error);
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendorProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await Axios({
                method: 'post',
                url: '/api/product/get-products-by-vendor',
                data: { vendor: id, page: 1, limit: 50 }
            });

            if (response.data.success) {
                setProducts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching vendor products:", error);
            AxiosToastError(error);
        } finally {
            setProductsLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!vendor) {
        return (
            <div className="container mx-auto p-4">
                <Link to="/" className="flex items-center gap-2 text-primary-200 mb-4">
                    <FaArrowLeft /> Back to Home
                </Link>
                <NoData message="Vendor not found" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Link to="/" className="flex items-center gap-2 text-primary-200 mb-4">
                <FaArrowLeft /> Back to Home
            </Link>

            {/* Vendor Header */}
            <div className="relative rounded-lg overflow-hidden mb-6">
                {vendor.coverImageUrl ? (
                    <div className="h-48 w-full">
                        <img 
                            src={vendor.coverImageUrl} 
                            alt={`${vendor.name} cover`} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="h-48 w-full bg-gradient-to-r from-primary-100 to-blue-100"></div>
                )}
                
                <div className="absolute -bottom-16 left-8 flex items-end">
                    <div className="bg-white p-1 rounded-lg shadow-md">
                        {vendor.imageUrl ? (
                            <img 
                                src={vendor.imageUrl} 
                                alt={vendor.name} 
                                className="w-24 h-24 object-contain rounded-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-primary-100 rounded-lg flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary-200">
                                    {vendor.name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vendor Info */}
            <div className="mt-20 mb-8">
                <h1 className="text-2xl font-bold">{vendor.name}</h1>
                {vendor.description && (
                    <p className="text-gray-600 mt-2">{vendor.description}</p>
                )}
                
                {vendor.status !== undefined && (
                    <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${vendor.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {vendor.status ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            {/* Products Section */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Products from {vendor.name}</h2>
                
                {productsLoading ? (
                    <Loading />
                ) : products.length === 0 ? (
                    <NoData message="No products available from this vendor yet" />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map(product => (
                            <CardProduct key={product._id} data={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorDetailPage; 