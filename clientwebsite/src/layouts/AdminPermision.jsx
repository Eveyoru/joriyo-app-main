import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPermision = ({ children }) => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            // Check if token exists
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken) {
                navigate('/login');
                return;
            }

            // Try to fetch user details to check if they're an admin
            try {
                const response = await fetch('http://localhost:8080/api/user/user-details', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user details');
                }

                const userData = await response.json();
                
                if (userData.data && userData.data.role === 'ADMIN') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [navigate]);

    if (loading) {
        return (
            <div className='p-4 bg-yellow-100 rounded border border-yellow-300 text-yellow-800'>
                <p className='font-medium'>Checking admin access...</p>
                <p className='text-sm mt-1'>Please wait while we verify your permissions.</p>
            </div>
        );
    }

    return (
        <>
            {isAdmin ? (
                children
            ) : (
                <div className='p-4 bg-red-100 rounded border border-red-300'>
                    <h2 className='text-red-800 text-lg font-medium'>Access Denied</h2>
                    <p className='text-red-600 mt-1'>
                        You do not have permission to access this page. 
                        This area is restricted to administrators only.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className='mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                    >
                        Return to Home
                    </button>
                </div>
            )}
        </>
    );
};

export default AdminPermision;
