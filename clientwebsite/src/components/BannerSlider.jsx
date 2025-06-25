import React, { useState, useEffect } from 'react';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';

// Debug mode - set to false for production
const ENABLE_DEBUG = false;

// Component to display a single banner with its own isolated click handler
const BannerItem = ({ banner, isVisible }) => {
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (ENABLE_DEBUG) {
            console.log('DIRECT CLICK ON BANNER:', {
                id: banner._id,
                title: banner.title,
                order: banner.displayOrder,
                link: banner.link
            });
        }
        
        // Direct navigation to prevent any context mixing between banners
        if (banner.link) {
            window.location.href = banner.link;
        }
    };
    
    return (
        <div 
            className={`banner-item transition-opacity duration-500 ${isVisible ? 'opacity-100 z-10' : 'opacity-0 absolute top-0 left-0 -z-10'}`}
            onClick={handleClick}
            style={{ cursor: banner.link ? 'pointer' : 'default' }}
        >
            <div className="pt-3">
                <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover rounded-t-lg"
                />
            </div>
            
            {/* Debug information overlay - only visible when debug mode is enabled */}
            {ENABLE_DEBUG && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    Order: {banner.displayOrder} | ID: {banner._id.substring(0, 6)}...
                </div>
            )}
            
            {/* Only show title overlay if in debug mode */}
            {ENABLE_DEBUG && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {banner.title}
                    {banner.link && (
                        <div className="text-xs text-gray-300">Link: {banner.link}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const BannerSlider = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentBanner, setCurrentBanner] = useState(0);
    
    useEffect(() => {
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            const interval = setInterval(() => {
                setCurrentBanner((prev) => (prev + 1) % banners.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [banners]);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            
            // Fetch active banners
            const response = await Axios({
                ...SummaryApi.getActiveBanners,
            });

            const { data: responseData } = response;
            
            if (responseData.success && responseData.data.length > 0) {
                // Sort by displayOrder explicitly
                const sortedBanners = [...responseData.data].sort((a, b) => {
                    // This ensures that banners are displayed in the correct order
                    return a.displayOrder - b.displayOrder;
                });
                
                if (ENABLE_DEBUG) {
                    console.log('Sorted banners:', sortedBanners);
                    
                    // Log each banner individually for debugging
                    sortedBanners.forEach((banner, index) => {
                        console.log(`Banner ${index}:`, {
                            id: banner._id,
                            title: banner.title,
                            order: banner.displayOrder,
                            link: banner.link
                        });
                    });
                }
                
                setBanners(sortedBanners);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse shadow-md"></div>
            </div>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="relative w-full overflow-hidden rounded-lg shadow-md">
                <div className="relative">
                    {banners.map((banner, index) => (
                        <BannerItem 
                            key={`${banner._id}-${banner.displayOrder}`}
                            banner={banner}
                            isVisible={index === currentBanner}
                        />
                    ))}
                </div>

                {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                        {banners.map((banner, index) => (
                            <button
                                key={`dot-${banner._id}`}
                                onClick={() => setCurrentBanner(index)}
                                className={`w-3 h-3 rounded-full ${
                                    index === currentBanner ? 'bg-white' : 'bg-white/60'
                                } shadow-sm transition-all duration-300`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerSlider;
