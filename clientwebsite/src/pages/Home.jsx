import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import {Link, useNavigate} from 'react-router-dom'
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay'
import BannerSlider from '../components/BannerSlider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import VendorGrid from '../components/VendorGrid'
import { toast } from 'react-hot-toast'

const Home = () => {
  const loadingCategory = useSelector(state => state.product.loadingCategory)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const navigate = useNavigate()
  const [featuredCategories, setFeaturedCategories] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(false)
  const featuredContainerRef = useRef(null)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const handleRedirectProductListpage = (id,cat)=>{
      try {
        console.log("Redirecting to category:", id, cat)
        const subcategory = subCategoryData.find(sub =>{
          const filterData = sub.category.some(c => {
            return c._id == id
          })
  
          return filterData ? true : null
        })
        
        if (!subcategory) {
          console.error("No subcategory found for category:", id)
          toast.error("No products available in this category")
          return
        }
        
        const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`
  
        navigate(url)
        console.log("Navigating to:", url)
      } catch (error) {
        console.error("Error in redirect:", error)
        toast.error("Something went wrong. Please try again.")
      }
  }

  useEffect(() => {
    fetchFeaturedCategories()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await Axios.get('/api/category/get-active')
      
      if (response.data.success) {
        console.log("Categories fetched:", response.data.data)
        setCategories(response.data.data)
      } else {
        toast.error(response.data.message || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      AxiosToastError(error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchFeaturedCategories = async () => {
    try {
      setLoadingFeatured(true)
      const response = await Axios({
        ...SummaryApi.getActiveFeaturedCategories
      })

      const { data: responseData } = response
      if (responseData.success) {
        setFeaturedCategories(responseData.data)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoadingFeatured(false)
    }
  }

  const handleScrollRight = () => {
    featuredContainerRef.current.scrollLeft += 200
  }

  const handleScrollLeft = () => {
    featuredContainerRef.current.scrollLeft -= 200
  }

  const handleFeaturedCategoryClick = (category) => {
    navigate(`/featured-category/${category._id}`)
  }

  return (
   <section className='bg-white'>
      <div className='container mx-auto'>
          <BannerSlider />
      </div>
      
      {/* Featured This Week Section */}
      {featuredCategories.length > 0 && (
        <div className='container mx-auto my-8'>
          <div className='px-4 mb-4'>
            <h2 className='text-2xl font-bold'>Featured This Week</h2>
          </div>
          <div className='relative flex items-center'>
            <div className='flex gap-4 container mx-auto px-4 overflow-x-scroll scrollbar-none scroll-smooth' ref={featuredContainerRef}>
              {loadingFeatured ? (
                new Array(4).fill(null).map((_, index) => (
                  <div key={`featured-loading-${index}`} className='min-w-[280px] h-48 bg-gray-200 rounded-lg animate-pulse'></div>
                ))
              ) : (
                featuredCategories.map(category => (
                  <div 
                    key={`featured-${category._id}`} 
                    className='min-w-[280px] h-48 relative cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all'
                    onClick={() => handleFeaturedCategoryClick(category)}
                  >
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))
              )}
            </div>
            {featuredCategories.length > 3 && (
              <div className='w-full left-0 right-0 container mx-auto px-2 absolute hidden lg:flex justify-between'>
                <button onClick={handleScrollLeft} className='z-10 relative bg-white hover:bg-gray-100 shadow-lg text-lg p-2 rounded-full'>
                  <FaAngleLeft />
                </button>
                <button onClick={handleScrollRight} className='z-10 relative bg-white hover:bg-gray-100 shadow-lg p-2 text-lg rounded-full'>
                  <FaAngleRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className='container mx-auto px-4'>
        <VendorGrid />
        
        {/* Display category images grid */}
        {loadingCategories ? (
          <div className="animate-pulse my-8">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-200 h-64 rounded"></div>
              ))}
            </div>
          </div>
        ) : categories.length > 0 ? (
          <div className="my-8">
            <h2 className="text-2xl font-semibold mb-4">Shop By Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map(category => (
                <div 
                  key={`category-grid-${category._id}`} 
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => handleRedirectProductListpage(category._id, category.name)}
                >
                  <div className="h-32 overflow-hidden bg-gray-100">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        
        {/* Display category-wise products */}
        {loadingCategories ? (
          <div className="animate-pulse my-8">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-200 h-64 rounded"></div>
              ))}
            </div>
          </div>
        ) : categories.length > 0 ? (
          // Map through categories and render CategoryWiseProductDisplay for each
          categories.map(category => (
            <CategoryWiseProductDisplay 
              key={category._id} 
              id={category._id} 
              name={category.name} 
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p>No categories available</p>
          </div>
        )}
      </div>

   </section>
  )
}

export default Home
