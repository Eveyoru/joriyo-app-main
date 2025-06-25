import React, { useEffect, useState } from 'react';
import UploadBannerModel from '../components/UploadBannerModel';
import EditBanner from '../components/EditBanner';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import CofirmBox from '../components/CofirmBox';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';

const BannerPage = () => {
    const [openUploadBanner, setOpenUploadBanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bannerData, setBannerData] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({
        title: "",
        image: "",
        description: "",
        link: "",
        displayOrder: 0,
        isActive: true
    });
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [deleteBanner, setDeleteBanner] = useState({
        _id: ""
    });

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getBanners
            });
            const { data: responseData } = response;

            if (responseData.success) {
                setBannerData(responseData.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDeleteBanner = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.deleteBanner,
                data: deleteBanner
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                fetchBanners();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className=''>
            <div className='p-2 bg-white shadow-md flex items-center justify-between'>
                <h2 className='font-semibold'>Banners</h2>
                <button 
                    onClick={() => setOpenUploadBanner(true)} 
                    className='text-sm border border-primary-200 hover:bg-primary-200 px-3 py-1 rounded'
                >
                    Add Banner
                </button>
            </div>
            {
                !bannerData[0] && !loading && (
                    <NoData />
                )
            }

            <div className='p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {
                    bannerData.map((banner) => {
                        return (
                            <div className='rounded shadow-md bg-white' key={banner._id}>
                                <div className="relative h-48 overflow-hidden">
                                    <img 
                                        alt={banner.title}
                                        src={banner.image}
                                        className='w-full h-full object-cover'
                                    />
                                    {!banner.isActive && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            Inactive
                                        </div>
                                    )}
                                </div>
                                <div className='p-3'>
                                    <h3 className="font-medium text-lg mb-1">{banner.title}</h3>
                                    {banner.description && (
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{banner.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                                        {banner.link && (
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                                </svg>
                                                <span className="truncate max-w-[150px]">{banner.link}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                            </svg>
                                            <span>Order: {banner.displayOrder}</span>
                                        </div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <button 
                                            onClick={() => {
                                                setOpenEdit(true);
                                                setEditData(banner);
                                            }} 
                                            className='flex-1 bg-green-100 hover:bg-green-200 text-green-600 font-medium py-1 rounded'
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setOpenConfirmBoxDelete(true);
                                                setDeleteBanner(banner);
                                            }} 
                                            className='flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-medium py-1 rounded'
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            {
                loading && (
                    <Loading />
                )
            }

            {
                openUploadBanner && (
                    <UploadBannerModel fetchData={fetchBanners} close={() => setOpenUploadBanner(false)} />
                )
            }

            {
                openEdit && (
                    <EditBanner data={editData} close={() => setOpenEdit(false)} fetchData={fetchBanners} />
                )
            }

            {
                openConfirmBoxDelete && (
                    <CofirmBox 
                        close={() => setOpenConfirmBoxDelete(false)} 
                        cancel={() => setOpenConfirmBoxDelete(false)} 
                        confirm={handleDeleteBanner}
                    />
                )
            }
        </section>
    );
};

export default BannerPage;
