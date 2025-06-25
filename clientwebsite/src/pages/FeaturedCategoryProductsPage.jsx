import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import CardProduct from '../components/CardProduct'
import { AiOutlineLeft } from 'react-icons/ai'

const FeaturedCategoryProductsPage = () => {
  const { id } = useParams()
  const [featuredCategory, setFeaturedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (id) {
      fetchFeaturedCategory()
    }
  }, [id])

  const fetchFeaturedCategory = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        method: SummaryApi.getFeaturedCategoryById.method,
        url: SummaryApi.getFeaturedCategoryById.getUrl(id)
      })

      const { data: responseData } = response

      if (responseData.success) {
        console.log('Featured category API response:', responseData.data);
        setFeaturedCategory(responseData.data)
        
        // Process products to ensure variations are properly formatted
        const processedProducts = responseData.data.products.map(product => {
          // Normalize hasVariations to a boolean
          const hasVariations = Boolean(product.hasVariations);
          
          // Ensure variations is an array
          let variations = [];
          if (Array.isArray(product.variations)) {
            variations = product.variations.map(v => ({
              ...v,
              stock: typeof v.stock === 'number' ? v.stock : 0,
              price: typeof v.price === 'number' ? v.price : 0,
              size: v.size || ''
            }));
          }
          
          return {
            ...product,
            hasVariations,
            variations,
            // Force calculation of availability based on variations or main stock
            isOutOfStock: hasVariations 
              ? !variations.some(v => v.stock > 0)
              : product.stock <= 0
          };
        });
        
        console.log('Processed products:', processedProducts);
        setProducts(processedProducts || [])
      }
    } catch (error) {
      console.error('Error fetching featured category:', error);
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    )
  }

  if (!featuredCategory) {
    return (
      <div className="container mx-auto p-4">
        <NoData message="Featured category not found" />
        <div className="mt-4">
          <Link to="/" className="text-primary-500 flex items-center gap-2">
            <AiOutlineLeft /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="container mx-auto">
      {/* Back navigation */}
      <div className="p-4">
        <Link to="/" className="text-primary-500 flex items-center gap-2">
          <AiOutlineLeft /> Back to Home
        </Link>
      </div>

      {/* Cover Image */}
      {featuredCategory.coverImage && (
        <div className="w-full relative h-48 md:h-64 lg:h-80 overflow-hidden mb-6">
          <img 
            src={featuredCategory.coverImage} 
            alt={featuredCategory.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">{featuredCategory.name}</h1>
            {featuredCategory.description && (
              <p className="mt-2 text-white text-opacity-90 max-w-2xl">{featuredCategory.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Category info without cover image */}
      {!featuredCategory.coverImage && (
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">{featuredCategory.name}</h1>
          {featuredCategory.description && (
            <p className="text-gray-600 mb-4">{featuredCategory.description}</p>
          )}
        </div>
      )}

      {/* Products grid */}
      <div className="px-4 pb-8">
        {products.length === 0 ? (
          <NoData message="No products found in this category" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(product => (
              <CardProduct key={product._id} data={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedCategoryProductsPage 