import React, { useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from './Loading';

const UploadVendorModel = ({ close, fetchData }) => {
    const [data, setData] = useState({
        name: "",
        imageUrl: "",
        coverImageUrl: "",
        description: "",
        displayOrder: 0,
        status: true
    });
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [coverImageLoading, setCoverImageLoading] = useState(false);

    // Get next available display order when component mounts
    useEffect(() => {
        getNextDisplayOrder().then(nextOrder => {
            setData(prev => ({
                ...prev,
                displayOrder: nextOrder
            }));
        });
    }, []);

    const getNextDisplayOrder = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getVendors
            });
            const vendors = response.data.data || [];
            // Find the highest display order and add 1
            const maxOrder = Math.max(...vendors.map(vendor => vendor.displayOrder), -1);
            return maxOrder + 1;
        } catch (error) {
            return 0;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!data.name) {
            return toast.error("Vendor name is required");
        }

        if (!data.imageUrl) {
            return toast.error("Vendor image is required");
        }

        try {
            setLoading(true);
            console.log("Submitting vendor data:", data);
            
            const response = await Axios({
                ...SummaryApi.addVendor,
                data: data
            });
            
            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                close();
                fetchData();
            }
        } catch (error) {
            console.error("Error adding vendor:", error);
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

    const handleUploadVendorImage = async (e) => {
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
                    imageUrl: ImageResponse.data.url
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
                    coverImageUrl: ImageResponse.data.url
                }
            });
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setCoverImageLoading(false);
        }
    };

    return (
        <section className='fixed top-0 bottom-0 left-0 right-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='font-semibold text-lg'>Add Vendor</h2>
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
                            placeholder="Enter vendor name"
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
                        <label htmlFor='status'>Status</label>
                        <select
                            id='status'
                            name='status'
                            value={data.status}
                            onChange={(e) => setData(prev => ({ ...prev, status: e.target.value === 'true' }))}
                            className='p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded'
                        >
                            <option value={true}>Active</option>
                            <option value={false}>Inactive</option>
                        </select>
                    </div>

                    <div className='grid gap-1'>
                        <p>Logo Image</p>
                        <div className='flex gap-4 flex-col lg:flex-row items-center'>
                            <div className='border bg-blue-50 h-36 w-full lg:w-36 flex items-center justify-center rounded'>
                                {
                                    imageLoading ? (
                                        <Loading />
                                    ) : data.imageUrl ? (
                                        <img
                                            alt='vendor'
                                            src={data.imageUrl}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <p className='text-sm text-neutral-500'>No Image</p>
                                    )
                                }
                            </div>
                            <label htmlFor='uploadVendorImage'>
                                <div className={`
                                ${!data.name ? "bg-gray-300" : "border-primary-200 hover:bg-primary-100" }  
                                    px-4 py-2 rounded cursor-pointer border font-medium
                                `}>
                                    {imageLoading ? "Uploading..." : "Upload Logo"}
                                </div>
                                <input 
                                    disabled={!data.name || imageLoading} 
                                    onChange={handleUploadVendorImage} 
                                    type='file' 
                                    accept="image/*"
                                    id='uploadVendorImage' 
                                    className='hidden'
                                />
                            </label>
                        </div>
                    </div>

                    <div className='grid gap-1'>
                        <p>Cover Image (displayed on vendor detail page)</p>
                        <div className='flex gap-4 flex-col lg:flex-row items-center'>
                            <div className='border bg-blue-50 h-36 w-full lg:w-72 flex items-center justify-center rounded'>
                                {
                                    coverImageLoading ? (
                                        <Loading />
                                    ) : data.coverImageUrl ? (
                                        <img
                                            alt='vendor cover'
                                            src={data.coverImageUrl}
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

                    <button
                        type='submit'
                        disabled={loading || !data.name || !data.imageUrl}
                        className={`
                        ${loading || !data.name || !data.imageUrl ? "bg-gray-300" : "bg-primary-100 hover:bg-primary-200"} 
                            p-3 rounded font-medium
                        `}
                    >
                        {loading ? "Adding..." : "Add Vendor"}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default UploadVendorModel; 