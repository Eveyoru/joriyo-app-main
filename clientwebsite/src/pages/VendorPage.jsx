import React, { useState, useEffect } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import UploadVendorModel from '../components/UploadVendorModel';
import EditVendor from '../components/EditVendor';

const VendorPage = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openUploadVendor, setOpenUploadVendor] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [deleteVendor, setDeleteVendor] = useState(null);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getVendors
            });

            const { data: responseData } = response;

            if (responseData.success) {
                console.log("Vendors loaded:", responseData.data);
                setVendors(responseData.data);
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteVendor) return;

        try {
            const response = await Axios({
                ...SummaryApi.deleteVendor,
                data: {
                    _id: deleteVendor._id
                }
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                fetchVendors();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section>
            <div className='p-2 bg-white shadow-md flex items-center justify-between'>
                <h2 className='font-semibold'>Vendors</h2>
                <button 
                    onClick={() => setOpenUploadVendor(true)} 
                    className='text-sm border border-primary-200 hover:bg-primary-200 px-3 py-1 rounded'
                >
                    Add Vendor
                </button>
            </div>

            {!vendors[0] && !loading && <NoData />}

            <div className='p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {vendors.map((vendor) => (
                    <div className='bg-white rounded-lg shadow-md overflow-hidden' key={vendor._id}>
                        <div className='w-full aspect-video relative'>
                            {vendor.imageUrl ? (
                                <img 
                                    alt={vendor.name}
                                    src={vendor.imageUrl}
                                    className='w-full h-full object-cover'
                                />
                            ) : (
                                <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                                    <span className='text-gray-400'>No Image</span>
                                </div>
                            )}
                            {vendor.status ? (
                                <div className='absolute top-0 right-0 m-2 px-2 py-1 bg-green-500 text-white text-xs rounded'>
                                    Active
                                </div>
                            ) : (
                                <div className='absolute top-0 right-0 m-2 px-2 py-1 bg-red-500 text-white text-xs rounded'>
                                    Inactive
                                </div>
                            )}
                        </div>
                        <div className='p-3'>
                            <div className='flex items-center justify-between mb-2'>
                                <h3 className='font-medium text-gray-800'>{vendor.name}</h3>
                                <span className='text-sm text-gray-500'>Order: {vendor.displayOrder}</span>
                            </div>
                            {vendor.description && (
                                <p className='text-sm text-gray-600 mb-2'>{vendor.description}</p>
                            )}
                            <div className='flex gap-2'>
                                <button 
                                    onClick={() => {
                                        setOpenEdit(true);
                                        setEditData(vendor);
                                    }} 
                                    className='flex-1 bg-green-50 hover:bg-green-100 text-green-600 font-medium py-1.5 rounded text-sm'
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => {
                                        setOpenConfirmBoxDelete(true);
                                        setDeleteVendor(vendor);
                                    }} 
                                    className='flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 rounded text-sm'
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <Loading />}

            {openUploadVendor && (
                <UploadVendorModel 
                    fetchData={fetchVendors} 
                    close={() => setOpenUploadVendor(false)}
                />
            )}

            {openEdit && (
                <EditVendor 
                    data={editData} 
                    close={() => setOpenEdit(false)} 
                    fetchData={fetchVendors}
                />
            )}

            {openConfirmBoxDelete && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
                    <div className='bg-white rounded-lg p-6 max-w-md w-full'>
                        <h3 className='text-lg font-medium mb-4'>Delete Vendor</h3>
                        <p className='mb-6'>
                            Are you sure you want to delete <span className='font-bold'>{deleteVendor?.name}</span>?
                        </p>
                        <div className='flex justify-end gap-3'>
                            <button 
                                onClick={() => setOpenConfirmBoxDelete(false)}
                                className='px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded'
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
                                className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default VendorPage; 