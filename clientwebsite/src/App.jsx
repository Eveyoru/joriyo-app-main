import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory,setAllSubCategory,setLoadingCategory } from './store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import { handleAddItemCart } from './store/cartProduct'
import GlobalProvider from './provider/GlobalProvider';
import { FaCartShopping } from "react-icons/fa6";
import CartMobileLink from './components/CartMobile';

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector(state => state.user);
  
  const fetchUser = async() => {
    try {
      // Check if we have a token
      const accessToken = localStorage.getItem('accesstoken');
      
      if (!accessToken) {
        console.log('No access token found, skipping user fetch');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching user details on app load');
      const userData = await fetchUserDetails();
      
      if (userData.success && userData.data) {
        dispatch(setUserDetails(userData.data));
        console.log('User details fetched successfully');
      } else if (userData.statusCode === 401) {
        // If unauthorized, try to refresh token via the Axios interceptor
        // The interceptor will handle token refresh automatically on the next request
        console.log('User fetch returned 401, will try refresh token on next request');
        
        // Make a test request to trigger token refresh
        try {
          await Axios.get('/api/user/user-details');
          // If successful after refresh, fetch user details again
          const refreshedUserData = await fetchUserDetails();
          if (refreshedUserData.success && refreshedUserData.data) {
            dispatch(setUserDetails(refreshedUserData.data));
            console.log('User details fetched after token refresh');
          }
        } catch (refreshError) {
          console.log('Could not refresh token or fetch user after refresh');
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchCategory = async() => {
    try {
      dispatch(setLoadingCategory(true))
      const response = await Axios({
        ...SummaryApi.getCategory
      })
      const { data : responseData } = response

      if(responseData.success){
        dispatch(setAllCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name)))) 
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      dispatch(setLoadingCategory(false))
    }
  }

  const fetchSubCategory = async() => {
    try {
      const response = await Axios({
        ...SummaryApi.getSubCategory
      })
      const { data : responseData } = response

      if(responseData.success){
        dispatch(setAllSubCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name)))) 
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }
  
  // Load user data and initial app data
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchUser();
      fetchCategory();
      fetchSubCategory();
    };
    
    loadInitialData();
  }, []);

  // Show loading state while fetching user
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <GlobalProvider> 
      <Header/>
      <main className='min-h-[78vh]'>
          <Outlet/>
      </main>
      <Footer/>
      <Toaster/>
      {
        location.pathname !== '/checkout' && (
          <CartMobileLink/>
        )
      }
    </GlobalProvider>
  )
}

export default App
