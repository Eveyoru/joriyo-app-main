import React, { useState, useEffect } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import axios from 'axios'; // Use direct axios instead of our intercepted instance
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';

const Login = () => {
    const [data, setData] = useState({
        email: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Don't clear tokens on mount - that causes issues with refreshes
    // Instead check if we are already logged in
    useEffect(() => {
        const checkExistingLogin = async () => {
            const token = localStorage.getItem('accesstoken');
            // If we already have a token, redirect to home
            if (token) {
                try {
                    // Verify token is valid
                    const userResponse = await axios.get('http://localhost:8080/api/user/user-details', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (userResponse.data.success) {
                        console.log('User already logged in, redirecting to home');
                        navigate('/', { replace: true });
                    }
                } catch (error) {
                    // Token invalid, stay on login page
                    console.log('Token invalid, staying on login page');
                }
            }
        };
        
        checkExistingLogin();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const valideValue = Object.values(data).every(el => el)

    const handleSubmit = async(e) => {
        e.preventDefault()
        
        if (loading) return;
        
        try {
            setLoading(true);
            
            // Clear any existing tokens before login attempt
            localStorage.removeItem('accesstoken');
            localStorage.removeItem('refreshToken');
            
            // Make direct API call without interceptors to avoid issues
            const response = await axios.post('http://localhost:8080/api/user/login', data);
            
            if (!response.data.success) {
                toast.error(response.data.message || "Login failed");
                return;
            }
            
            // If login successful, save tokens
            const { accesstoken, refreshToken } = response.data.data;
            localStorage.setItem('accesstoken', accesstoken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // Get user details
            try {
                const userResponse = await axios.get('http://localhost:8080/api/user/user-details', {
                    headers: {
                        'Authorization': `Bearer ${accesstoken}`
                    }
                });
                
                if (userResponse.data.success) {
                    dispatch(setUserDetails(userResponse.data.data));
                    toast.success("Login successful!");
                    
                    // Reset form
                    setData({
                        email: "",
                        password: "",
                    });
                    
                    // Navigate to home page with replace to prevent back button issues
                    navigate('/', { replace: true });
                } else {
                    throw new Error("Failed to get user details");
                }
            } catch (detailsError) {
                console.error("Error fetching user details:", detailsError);
                toast.error("Login successful, but failed to load your profile");
                
                // Still navigate to home
                navigate('/', { replace: true });
            }
        } catch (error) {
            console.error("Login error:", error);
            
            // Clear tokens on error
            localStorage.removeItem('accesstoken');
            localStorage.removeItem('refreshToken');
            
            // Show error message
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Login failed. Please check your credentials and try again.");
            }
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <section className='w-full container mx-auto px-2'>
            <div className='bg-bg-light my-4 w-full max-w-lg mx-auto rounded p-7 shadow-md'>
                <div className='flex justify-center mb-4'>
                    <h1 className='text-primary-200 text-5xl font-bold tracking-wide'>Joriyo</h1>
                </div>
                <h1 className='text-2xl font-bold text-center mb-4 text-text-light'>Login to Your Account</h1>

                <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='email' className='text-text-light'>Email:</label>
                        <input
                            type='email'
                            id='email'
                            className='app-input'
                            name='email'
                            value={data.email}
                            onChange={handleChange}
                            placeholder='Enter your email'
                            disabled={loading}
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='password' className='text-text-light'>Password:</label>
                        <div className='bg-white p-2 border rounded flex items-center focus-within:border-primary-200'>
                            <input
                                type={showPassword ? "text" : "password"}
                                id='password'
                                className='w-full outline-none bg-white'
                                name='password'
                                value={data.password}
                                onChange={handleChange}
                                placeholder='Enter your password'
                                disabled={loading}
                            />
                            <div onClick={() => !loading && setShowPassword(preve => !preve)} className='cursor-pointer text-icon-light'>
                                {
                                    showPassword ? (
                                        <FaRegEye />
                                    ) : (
                                        <FaRegEyeSlash />
                                    )
                                }
                            </div>
                        </div>
                        <Link to={"/forgot-password"} className='block ml-auto hover:text-primary-200 text-primary-200'>Forgot password?</Link>
                    </div>
    
                    <button 
                        disabled={!valideValue || loading} 
                        className={` ${valideValue && !loading ? "bg-primary-200 hover:bg-primary-100" : "bg-gray-500" } text-white py-2 rounded font-semibold my-3 tracking-wide flex justify-center items-center`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className='text-text-light'>
                    Don't have an account? <Link to={"/register"} className='font-semibold text-primary-200 hover:opacity-80'>Register</Link>
                </p>
            </div>
        </section>
    )
}

export default Login
