import React, { useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from './Loading';

const EditFeaturedCategory = ({ close, fetchData, data: featuredCategoryData }) => {
    const [data, setData] = useState({
        _id: featuredCategoryData._id,
        name: featuredCategoryData.name,
        image: featuredCategoryData.image,
        coverImage: featuredCategoryData.coverImage || "",
        description: featuredCategoryData.description || "",
        products: featuredCategoryData.products?.map(product => 
            typeof product === 'object' ? product._id : product
        ) || [],
        displayOrder: featuredCategoryData.displayOrder,
        active: featuredCategoryData.active
    });
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [coverImageLoading, setCoverImageLoading] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showProductSelector, setShowProductSelector] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getProduct,
                data: {
                    page: 1,
                    limit: 100  // Get up to 100 products
                }
            });
            
            if (response.data.success) {
                setAllProducts(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!data.name || !data.image) {
            return toast.error("Name and image are required");
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.updateFeaturedCategory,
                data: data
            });
            
            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                close();
                fetchData();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: name === 'displayOrder' ? Number(value) : value
            }
        });
    };

    const handleUploadCategoryImage = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setImageLoading(true);
        try {
            const response = await uploadImage(file);
            const { data: ImageResponse } = response;

            setData((prev) => {
                return {
                    ...prev,
                    image: ImageResponse.data.url
                }
            });
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setImageLoading(false);
        }
    };

    const handleUploadCoverImage = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setCoverImageLoading(true);
        try {
            const response = await uploadImage(file);
            const { data: ImageResponse } = response;

            setData((prev) => {
                return {
                    ...prev,
                    coverImage: ImageResponse.data.url
                }
            });
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setCoverImageLoading(false);
        }
    };

    const toggleProductSelection = (productId) => {
        setData(prev => {
            const newProducts = [...prev.products];
            
            if (newProducts.includes(productId)) {
                return {
                    ...prev,
                    products: newProducts.filter(id => id !== productId)
                };
            } else {
                return {
                    ...prev,
                    products: [...newProducts, productId]
                };
            }
        });
    };

    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className='fixed top-0 bottom-0 left-0 right-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='font-semibold text-lg'>Edit Featured Category</h2>
                    <button onClick={close} className='p-1 hover:bg-neutral-100 rounded'>
                        <IoClose size={20} />
                    </button>
                </div>

                <form className='my-3 grid gap-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='name'>Name*</label>
                        <input
                            id='name'
                            name='name'
                            value={data.name}
                            onChange={handleOnChange}
                            placeholder="Enter category name"
                            className='p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded'
                            required
                        />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='description'>Description</label>
                        <textarea
                            id='description'
                            name='description'
                            value={data.description}
                            onChange={handleOnChange}
                            placeholder="Enter description (optional)"
                            className='p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded'
                            rows={3}
                        />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='displayOrder'>Display Order</label>
                        <input
                            id='displayOrder'
                            name='displayOrder'
                            type='number'
                            min={0}
                            value={data.displayOrder}
                            onChange={handleOnChange}
                            className='p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded'
                        />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='active'>Status</label>
                        <select
                            id='active'
                            name='active'
                            value={data.active}
                            onChange={(e) => setData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                            className='p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded'
                        >
                            <option value={true}>Active</option>
                            <option value={false}>Inactive</option>
                        </select>
                    </div>

                    <div className='grid gap-1'>
                        <p>Thumbnail Image* (displayed on homepage)</p>
                        <div className='flex gap-4 flex-col lg:flex-row items-center'>
                            <div className='border bg-blue-50 h-36 w-full lg:w-36 flex items-center justify-center rounded'>
                                {
                                    imageLoading ? (
                                        <Loading />
                                    ) : data.image ? (
                                        <img
                                            alt='category'
                                            src={data.image}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <p className='text-sm text-neutral-500'>No Image</p>
                                    )
                                }
                            </div>
                            <label htmlFor='uploadFeaturedCategoryImage'>
                                <div className={`
                                ${!data.name ? "bg-gray-300" : "border-primary-200 hover:bg-primary-100" }  
                                    px-4 py-2 rounded cursor-pointer border font-medium
                                `}>
                                    {imageLoading ? "Uploading..." : "Upload New Image"}
                                </div>
                                <input 
                                    disabled={!data.name || imageLoading} 
                                    onChange={handleUploadCategoryImage} 
                                    type='file' 
                                    accept="image/*"
                                    id='uploadFeaturedCategoryImage' 
                                    className='hidden'
                                />
                            </label>
                        </div>
                    </div>

                    <div className='grid gap-1'>
                        <p>Cover Image (displayed at the top of category page)</p>
                        <div className='flex gap-4 flex-col lg:flex-row items-center'>
                            <div className='border bg-blue-50 h-36 w-full lg:w-72 flex items-center justify-center rounded'>
                                {
                                    coverImageLoading ? (
                                        <Loading />
                                    ) : data.coverImage ? (
                                        <img
                                            alt='category cover'
                                            src={data.coverImage}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <p className='text-sm text-neutral-500'>No Cover Image</p>
                                    )
                                }
                            </div>
                            <label htmlFor='uploadCoverImage'>
                                <div className={`
                                ${!data.name ? "bg-gray-300" : "border-primary-200 hover:bg-primary-100" }  
                                    px-4 py-2 rounded cursor-pointer border font-medium
                                `}>
                                    {coverImageLoading ? "Uploading..." : "Upload Cover Image"}
                                </div>
                                <input 
                                    disabled={!data.name || coverImageLoading} 
                                    onChange={handleUploadCoverImage} 
                                    type='file' 
                                    accept="image/*"
                                    id='uploadCoverImage' 
                                    className='hidden'
                                />
                            </label>
                        </div>
                    </div>

                    <div className='grid gap-1'>
                        <div className='flex justify-between items-center'>
                            <label>Selected Products ({data.products.length})</label>
                            <button 
                                type='button'
                                onClick={() => setShowProductSelector(!showProductSelector)}
                                className='text-sm text-blue-600 hover:underline'
                            >
                                {showProductSelector ? 'Hide Products' : 'Select Products'}
                            </button>
                        </div>
                        
                        {showProductSelector && (
                            <div className='border p-3 rounded mt-2'>
                                <div className='mb-3'>
                                    <input
                                        type='text'
                                        placeholder='Search products...'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className='p-2 bg-blue-50 border outline-none focus-within:border-primary-200 rounded w-full'
                                    />
                                </div>
                                
                                {loading ? (
                                    <div className='py-4 flex justify-center'>
                                        <Loading />
                                    </div>
                                ) : (
                                    <div className='max-h-60 overflow-y-auto grid gap-2'>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(product => (
                                                <div 
                                                    key={product._id}
                                                    className={`
                                                        flex items-center gap-2 p-2 rounded cursor-pointer
                                                        ${data.products.includes(product._id) ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-100'}
                                                    `}
                                                    onClick={() => toggleProductSelection(product._id)}
                                                >
                                                    <div className='w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0'>
                                                        {product.image && product.image[0] && (
                                                            <img 
                                                                src={product.image[0]} 
                                                                alt={product.name}
                                                                className='w-full h-full object-cover' 
                                                            />
                                                        )}
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-medium truncate'>{product.name}</p>
                                                        <p className='text-xs text-gray-500'>
                                                            ₹{product.price} 
                                                            {product.discount > 0 && ` • ${product.discount}% off`}
                                                        </p>
                                                    </div>
                                                    <div className={`
                                                        w-6 h-6 rounded-full flex items-center justify-center
                                                        ${data.products.includes(product._id) 
                                                            ? 'bg-green-500 text-white' 
                                                            : 'border border-gray-300'}
                                                    `}>
                                                        {data.products.includes(product._id) && <FaCheck size={12} />}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className='text-center text-gray-500 py-4'>No products found</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!showProductSelector && data.products.length > 0 && (
                            <div className='flex flex-wrap gap-2 mt-1'>
                                {data.products.map((productId) => {
                                    const product = allProducts.find(p => p._id === productId);
                                    return product ? (
                                        <div key={productId} className='bg-blue-50 rounded px-2 py-1 text-sm flex items-center gap-1'>
                                            <span className='truncate max-w-[150px]'>{product.name}</span>
                                            <button 
                                                type='button'
                                                onClick={() => toggleProductSelection(productId)}
                                                className='text-red-500 hover:text-red-700'
                                            >
                                                <IoClose size={16} />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        disabled={loading || !data.name || !data.image}
                        className={`
                        ${(loading || !data.name || !data.image) ? "bg-gray-300" : "bg-primary-200 hover:bg-primary-100"}
                        py-2 mt-2
                        font-semibold 
                        `}
                    >
                        {loading ? <Loading /> : "Update Featured Category"}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default EditFeaturedCategory; 